const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agriconnect',
  user: 'postgres',
  password: '1234'
});

async function createTestNotifications() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Creating comprehensive test notifications...\n');
    
    // Get a product and order
    const productResult = await client.query('SELECT * FROM products LIMIT 1');
    const orderResult = await client.query('SELECT * FROM orders LIMIT 1');
    
    if (productResult.rows.length === 0) {
      console.log('❌ No products found. Please add a product first.');
      process.exit(1);
    }
    
    const product = productResult.rows[0];
    console.log(`📦 Using product: ${product.product_name} (ID: ${product.id})`);
    
    // Create all types of product notifications
    const productNotifications = [
      {
        type: 'new_product',
        message: `✨ New product "${product.product_name}" has been added to the inventory system.`
      },
      {
        type: 'low_stock',
        message: `📦 Low stock alert for "${product.product_name}". Current stock: ${product.current_stock} ${product.unit}. Please restock soon!`
      },
      {
        type: 'stock_updated',
        message: `🔄 Stock for "${product.product_name}" has been updated. Current stock: ${product.current_stock} ${product.unit}.`
      },
      {
        type: 'supplier_added',
        message: `🚚 Farmer John supplied 50 ${product.unit} of "${product.product_name}" to inventory.`
      },
      {
        type: 'expired',
        message: `⚠️ Product "${product.product_name}" has expired (7 days old). Please remove from inventory.`
      }
    ];
    
    console.log('\n🎨 Creating Product Notifications:');
    for (const notif of productNotifications) {
      await client.query(
        'INSERT INTO notifications (product_id, notification_type, message, is_read) VALUES ($1, $2, $3, false)',
        [product.id, notif.type, notif.message]
      );
      console.log(`   ✅ ${notif.type}: ${notif.message.substring(0, 60)}...`);
    }
    
    // Create order notifications if order exists
    if (orderResult.rows.length > 0) {
      const order = orderResult.rows[0];
      console.log(`\n📝 Using order: #${order.order_no || order.id} (ID: ${order.id})`);
      
      const orderNotifications = [
        {
          type: 'order_placed',
          message: `🛒 Order #${order.order_no || order.id} has been placed successfully! Total: Rs ${order.total} (3 items)`
        },
        {
          type: 'order_cancelled',
          message: `❌ Order #${order.order_no || order.id} has been cancelled. Amount: Rs ${order.total}`
        }
      ];
      
      console.log('\n🛍️ Creating Order Notifications:');
      for (const notif of orderNotifications) {
        await client.query(
          'INSERT INTO notifications (order_id, notification_type, message, is_read) VALUES ($1, $2, $3, false)',
          [order.id, notif.type, notif.message]
        );
        console.log(`   ✅ ${notif.type}: ${notif.message.substring(0, 60)}...`);
      }
    } else {
      console.log('\n⚠️  No orders found. Skipping order notifications.');
    }
    
    // Create milestone notifications
    const milestoneNotifications = [
      {
        type: 'milestone_earnings',
        message: `🎉 Congratulations! You've earned Rs 10,000+ in total sales!`
      },
      {
        type: 'milestone_orders',
        message: `🏆 Amazing! You've completed 50+ orders!`
      }
    ];
    
    console.log('\n🏆 Creating Milestone Notifications:');
    for (const notif of milestoneNotifications) {
      await client.query(
        'INSERT INTO notifications (notification_type, message, is_read) VALUES ($1, $2, false)',
        [notif.type, notif.message]
      );
      console.log(`   ✅ ${notif.type}: ${notif.message}`);
    }
    
    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = false'
    );
    
    console.log(`\n🎉 Success! Created test notifications.`);
    console.log(`📊 Total unread notifications: ${countResult.rows[0].count}`);
    console.log('\n📋 Notification Types Created:');
    console.log('   🎨 Product Notifications (5):');
    console.log('      ✨ new_product - New product added');
    console.log('      📦 low_stock - Low stock alert');
    console.log('      🔄 stock_updated - Stock quantity changed');
    console.log('      🚚 supplier_added - Supplier added stock');
    console.log('      ⚠️  expired - Product expired (>5 days)');
    console.log('   🛍️  Order Notifications (2):');
    console.log('      🛒 order_placed - New order created');
    console.log('      ❌ order_cancelled - Order was cancelled');
    console.log('   🏆 Milestone Notifications (2):');
    console.log('      💰 milestone_earnings - Earnings milestone reached');
    console.log('      🎯 milestone_orders - Order count milestone reached');
    console.log('\n🔔 Now check your frontend - you should see all notification types!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestNotifications();
