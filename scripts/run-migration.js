require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  try {
    const argFile = process.argv[2];
    let chosenFile = argFile;
    if (!chosenFile) {
      // Default to feedback_type migration for backward compatibility
      chosenFile = '20251003_add_feedback_type.sql';
    }

    const migrationPath = path.join(__dirname, '..', 'sql', 'migrations', chosenFile);
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Running migration:', migrationPath);
    const res = await pool.query(sql);
    console.log('Migration executed. Result:', res.command || 'OK');

    // Simple heuristic verification: check for known columns if filename matches
    if (chosenFile.includes('feedback_type')) {
      const verify = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='feedback' AND column_name='feedback_type'`);
      console.log('Verification rows:', verify.rows);
      console.log(verify.rows.length > 0 ? 'feedback_type column present. Migration successful.' : 'feedback_type column missing after migration.');
    } else if (chosenFile.includes('user_status')) {
      const verify = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name='status'`);
      console.log('Verification rows:', verify.rows);
      console.log(verify.rows.length > 0 ? 'status column present. Migration successful.' : 'status column missing after migration.');
    }
  } catch (err) {
    console.error('Migration error:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
