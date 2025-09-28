const { Pool } = require('pg');
require('dotenv').config();

async function fixTables() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriconnect',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432
  });

  try {
    await pool.query('DROP TABLE IF EXISTS cart_items CASCADE;');
    await pool.query('DROP TABLE IF EXISTS carts CASCADE;');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create carts table
    await pool.query(`
      CREATE TABLE carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active'
      );
    `);

    // Create cart_items table
    await pool.query(`
      CREATE TABLE cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, product_id)
      );
    `);

    console.log('Tables recreated successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixTables();