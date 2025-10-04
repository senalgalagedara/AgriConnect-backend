import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const FULL_SCHEMA_FILE = path.join(MIGRATIONS_DIR, '20251004_full_schema.sql');
const SEED_FILE = path.join(MIGRATIONS_DIR, '20251004_seed_baseline.sql');

async function applyFile(client: Client, file: string) {
  const sql = fs.readFileSync(file, 'utf8');
  console.log(`\n== Executing ${path.basename(file)} ==`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✔ Executed ${path.basename(file)}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✖ Failed executing ${path.basename(file)}:`, (err as Error).message);
    throw err;
  }
}

async function databaseIsFresh(client: Client): Promise<boolean> {
  const res = await client.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
  // If only zero tables OR only the default pg catalog ones (count small), heuristically treat as fresh
  return res.rows[0].count < 3; // heuristic: before full schema there should be almost nothing
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`);
}

async function recordFullSchemaAsApplied(client: Client) {
  // Record full schema and seed file as applied so runner won't treat them as incremental migrations
  const baseFiles = ['20251004_full_schema.sql', '20251004_seed_baseline.sql'];
  for (const f of baseFiles) {
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
  }
}

async function runIncrementalMigrations(client: Client) {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  const baseline = new Set(['20251004_full_schema.sql', '20251004_seed_baseline.sql']);
  const appliedRes = await client.query('SELECT filename FROM schema_migrations');
  const applied = new Set(appliedRes.rows.map(r => r.filename));
  for (const file of files) {
    if (baseline.has(file)) continue; // skip baseline files
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`\n== Applying incremental migration: ${file} ==`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✔ Applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✖ Failed ${file}:`, (err as Error).message);
      throw err;
    }
  }
}

async function main() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432')
  });
  await client.connect();
  console.log('Connected to database');

  try {
    const fresh = await databaseIsFresh(client);
    await ensureMigrationsTable(client);

    if (fresh) {
      console.log('Fresh database detected. Applying full schema and seed...');
      await applyFile(client, FULL_SCHEMA_FILE);
      if (fs.existsSync(SEED_FILE)) {
        await applyFile(client, SEED_FILE);
      } else {
        console.warn('Seed file not found, skipping.');
      }
      await recordFullSchemaAsApplied(client);
    } else {
      console.log('Existing database detected. Skipping full schema.');
    }

    await runIncrementalMigrations(client);

    console.log('\nDatabase bootstrap complete.');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
