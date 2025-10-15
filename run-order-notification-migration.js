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
    console.log('🚀 Extending notification system for orders and milestones...\n');
    
    // Read and run migration
    const migrationPath = path.join(__dirname, 'scripts', 'migrations', '20251016_extend_notifications_for_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running: 20251016_extend_notifications_for_orders.sql');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');
    
    // Verify changes
    console.log('📋 Verifying changes...\n');
    
    // Check table name
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('notifications', 'product_notifications');
    `);
    console.log('✅ Tables:', tableCheck.rows.map(r => r.table_name).join(', '));
    
    // Check columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Notifications Table Structure:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
    // Check notification_milestones table
    const milestoneTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_milestones'
      );
    `);
    
    if (milestoneTable.rows[0].exists) {
      console.log('\n✅ notification_milestones table created successfully');
      
      const milestoneColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'notification_milestones'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Milestone Tracking Table:');
      milestoneColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Check constraint
    const constraint = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%notification_type%';
    `);
    
    if (constraint.rows.length > 0) {
      console.log('\n✅ Notification types updated:');
      console.log(`   ${constraint.rows[0].check_clause}`);
    }
    
    console.log('\n✨ Migration completed successfully!');
    console.log('🎯 Your notification system now supports:');
    console.log('   ✨ Product notifications (expired, low_stock, new_product, supplier_added, stock_updated)');
    console.log('   🛒 Order notifications (order_placed, order_cancelled)');
    console.log('   🏆 Milestone notifications (milestone_earnings, milestone_orders)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
