require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateFeedbackTable() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('Running feedback table migration...');
    
    const sqlPath = path.join(__dirname, 'migrate-feedback-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Feedback table migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating feedback table:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrateFeedbackTable().catch(process.exit);
}

module.exports = migrateFeedbackTable;