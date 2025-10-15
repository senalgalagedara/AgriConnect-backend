const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agriconnect',
  user: 'postgres',
  password: '1234'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting notification system migration...\n');
    
    // Read and run first migration
    const migration1Path = path.join(__dirname, 'scripts', 'migrations', '20251015_create_product_notifications_table.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    
    console.log('📄 Running: 20251015_create_product_notifications_table.sql');
    await client.query(migration1SQL);
    console.log('✅ Table created successfully!\n');
    
    // Check if table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_notifications'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Verified: product_notifications table exists');
      
      // Get table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'product_notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table Structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });
      
      console.log('\n✨ Migration completed successfully!');
      console.log('🎯 Your notification system is ready to use!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
