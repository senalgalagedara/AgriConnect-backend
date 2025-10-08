import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
// Baseline files that should not be auto-applied as incremental migrations
const BASELINE_FILES = new Set([
  '20251004_full_schema.sql',
  '20251004_seed_baseline.sql'
]);

async function ensureMigrationsTable(client: Client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`);
}

async function getApplied(client: Client): Promise<Set<string>> {
  const res = await client.query('SELECT filename FROM schema_migrations');
  return new Set(res.rows.map(r => r.filename));
}

function loadMigrationFiles(): string[] {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // lexical sort assumes timestamp prefix naming
  return files;
}

async function applyMigration(client: Client, filename: string) {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`\n== Applying migration: ${filename} ==`);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`✔ Applied ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✖ Failed ${filename}:`, (err as Error).message);
    throw err;
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
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const files = loadMigrationFiles();

  const pending = files.filter(f => !applied.has(f) && !BASELINE_FILES.has(f));
    if (pending.length === 0) {
      console.log('No pending migrations. Database is up-to-date.');
      return;
    }

    console.log(`Pending migrations (${pending.length}):`);
    pending.forEach(f => console.log('  -', f));

    for (const file of pending) {
      await applyMigration(client, file);
    }

    console.log('\nAll pending migrations applied.');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
