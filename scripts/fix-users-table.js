const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agriconnect',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
});

async function fixUsersTable() {
  try {
    console.log('🔧 Starting users table migration...');
    
    // First, check current table structure
    console.log('📋 Current users table structure:');
    const describeResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.log(describeResult.rows);

    // Drop existing trigger if it exists
    console.log('🗑️ Dropping existing trigger...');
    await pool.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');

    // Add missing columns
    console.log('➕ Adding missing columns...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Update role constraint to match service expectations
    console.log('🔧 Updating role constraint...');
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'farmer', 'supplier', 'driver', 'customer', 'consumer'));
    `);

    // Create the trigger for updated_at
    console.log('🔄 Creating updated_at trigger...');
    await pool.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Update existing users with default values
    console.log('📝 Updating existing users with default values...');
    await pool.query(`
      UPDATE users SET 
        name = COALESCE(name, 'User'),
        phone = COALESCE(phone, ''),
        address = COALESCE(address, ''),
        updated_at = COALESCE(updated_at, created_at)
      WHERE name IS NULL OR phone IS NULL OR address IS NULL OR updated_at IS NULL;
    `);

    // Show final table structure
    console.log('✅ Final users table structure:');
    const finalResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.log(finalResult.rows);

    console.log('✅ Users table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

fixUsersTable();