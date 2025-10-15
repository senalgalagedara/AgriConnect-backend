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
    console.log('🧪 Creating test notifications...\n');
    
    // Get a product to create notifications for
    const productResult = await client.query('SELECT * FROM products LIMIT 1');
    
    if (productResult.rows.length === 0) {
      console.log('❌ No products found. Please add a product first.');
      process.exit(1);
    }
    
    const product = productResult.rows[0];
    console.log(`📦 Using product: ${product.product_name} (ID: ${product.id})`);
    
    // Create test notifications
    const notifications = [
      {
        type: 'new_product',
        message: `✨ New product "${product.product_name}" has been added to the inventory.`
      },
      {
        type: 'low_stock',
        message: `📦 Low stock alert for "${product.product_name}". Current stock: ${product.current_stock} ${product.unit}.`
      },
      {
        type: 'stock_updated',
        message: `🔄 Stock for "${product.product_name}" has been updated to ${product.current_stock} ${product.unit}.`
      }
    ];
    
    for (const notif of notifications) {
      await client.query(
        'INSERT INTO product_notifications (product_id, notification_type, message, is_read) VALUES ($1, $2, $3, false)',
        [product.id, notif.type, notif.message]
      );
      console.log(`✅ Created: ${notif.type} notification`);
    }
    
    // Get count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM product_notifications WHERE is_read = false'
    );
    
    console.log(`\n🎉 Success! Created 3 test notifications.`);
    console.log(`📊 Total unread notifications: ${countResult.rows[0].count}`);
    console.log('\n🔔 Now check your frontend - you should see the notification bell with a badge!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestNotifications();
