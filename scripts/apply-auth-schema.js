require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });
  try {
    const schemaPath = path.join(__dirname, '..', 'src', 'modules', 'auth', 'models', 'authSchema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('Auth schema file not found:', schemaPath);
      process.exit(1);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying auth schema...');
    await pool.query(sql);
    console.log('Auth schema applied. Verifying tables...');
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','sessions')");
    console.log('Found tables:', tables.rows);
  } catch (e) {
    console.error('Auth schema apply error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
