require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function createFeedbackTable() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const sqlPath = path.join(__dirname, 'feedback-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Feedback table created successfully!');
  } catch (error) {
    console.error('Error creating feedback table:', error);
  } finally {
    await pool.end();
  }
}

createFeedbackTable();