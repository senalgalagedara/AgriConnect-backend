const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agriconnect',
  user: 'postgres',
  password: '1234'
});

async function testOrderDeletion() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Order Deletion Notification...\n');
    
    // Get an existing order
    const orderResult = await client.query(`
      SELECT id, order_no, total, status 
      FROM orders 
      WHERE status != 'cancelled'
      LIMIT 1
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ No active orders found to test deletion.');
      console.log('   Create an order first, then run this test again.');
      process.exit(0);
    }
    
    const order = orderResult.rows[0];
    console.log(`📦 Found Order #${order.order_no || order.id}:`);
    console.log(`   - ID: ${order.id}`);
    console.log(`   - Total: Rs ${order.total}`);
    console.log(`   - Status: ${order.status}`);
    
    // Count current notifications
    const beforeCount = await client.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE notification_type = 'order_cancelled' AND order_id = $1
    `, [order.id]);
    
    console.log(`\n📊 Current notifications for this order: ${beforeCount.rows[0].count}`);
    console.log('\n⚠️  NOTE: This is just a test query. The notification will be created when you:');
    console.log('   1. Delete the order through the admin panel, OR');
    console.log('   2. Cancel the order through the order management page');
    console.log('\n✨ The backend code has been updated to send notifications on order deletion!');
    console.log('\n🔄 Make sure to restart your backend server to apply the changes:');
    console.log('   1. Stop the backend (Ctrl+C)');
    console.log('   2. Run: npm run dev');
    console.log('   3. Then try deleting an order from the frontend');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testOrderDeletion();
