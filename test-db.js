// test-connection.js
require('dotenv').config();
console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

const { Pool } = require('pg');

// Test with same config as your models
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agriconnect',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    console.log('\nTesting connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test the actual query from Province model
    const result = await client.query(`
      SELECT 
        p.*,
        COUNT(pr.id) as total_products,
        COALESCE(SUM(pr.current_stock), 0) as total_current_stock
      FROM provinces p
      LEFT JOIN products pr ON p.id = pr.province_id AND pr.status = 'active'
      GROUP BY p.id
      ORDER BY p.name
      LIMIT 1
    `);
    
    console.log('✅ Query successful!');
    console.log('Data:', result.rows);
    
    client.release();
  } catch (error) {
    console.error('❌ Connection/Query failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();