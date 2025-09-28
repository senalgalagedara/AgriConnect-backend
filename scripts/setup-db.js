const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// First connect to postgres database to create agriconnect database
const adminPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres db first
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    // Check if database exists
    const dbExists = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'agriconnect']
    );

    if (dbExists.rows.length === 0) {
      // Create database
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'agriconnect'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }

    await adminPool.end();

    // Now connect to the agriconnect database to create tables
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'agriconnect',
      password: process.env.DB_PASSWORD || '1234',
      port: process.env.DB_PORT || 5432,
    });

    // Enable UUID extension
    await appPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create tables
    await createTables(appPool);
    await appPool.end();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup error:', error);
    process.exit(1);
  }
}

async function createTables(pool) {
  try {
    // Create provinces table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        capacity INTEGER DEFAULT 0,
        location VARCHAR(200),
        manager_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create farmers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(20),
        email VARCHAR(100) UNIQUE,
        address TEXT,
        province_id INTEGER REFERENCES provinces(id),
        registration_number VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        province_id INTEGER REFERENCES provinces(id),
        daily_limit DECIMAL(10,2) DEFAULT 0,
        current_stock DECIMAL(10,2) DEFAULT 0,
        final_price DECIMAL(10,2),
        unit VARCHAR(20) DEFAULT 'kg',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_name, province_id)
      )
    `);

    // Create suppliers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES farmers(id),
        product_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10,2) NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        supply_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create carts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cart items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        qty INTEGER NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, product_id)
      )
    `);

    // Insert default data
    await insertDefaultData(pool);
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

async function insertDefaultData(pool) {
  try {
    // Insert default provinces
    await pool.query(`
      INSERT INTO provinces (name, capacity, location) VALUES 
      ('Western', 10000, 'Colombo'),
      ('Central', 8000, 'Kandy'),
      ('Southern', 7000, 'Galle'),
      ('Northern', 6000, 'Jaffna'),
      ('Eastern', 5000, 'Batticaloa')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default categories
    await pool.query(`
      INSERT INTO categories (name, description) VALUES 
      ('Vegetables', 'Fresh vegetables'),
      ('Fruits', 'Fresh fruits'),
      ('Grains', 'Rice, wheat, etc.'),
      ('Legumes', 'Beans, lentils, etc.')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('Default data inserted successfully');
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
}

setupDatabase();