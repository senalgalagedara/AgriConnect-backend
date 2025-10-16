import * as fs from 'fs';
import * as path from 'path';
import database from '../src/config/database';

async function runTriggerMigration() {
  try {
    console.log('🚀 Creating database triggers for real-time notifications...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'scripts', 'migrations', 'create_notification_triggers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Execute the SQL
    await database.query(sql);
    
    console.log('✅ Database triggers created successfully!\n');
    console.log('📋 Triggers installed:');
    console.log('   ✨ trigger_notify_new_product → Fires when product is created');
    console.log('   🔄 trigger_notify_stock_change → Fires when stock is updated');
    console.log('   🗑️  trigger_notify_product_deletion → Fires when product is deleted');
    console.log('   🛒 trigger_notify_order_placed → Fires when order is placed');
    console.log('   📦 trigger_notify_order_status_change → Fires when order status changes');
    console.log('   🚗 trigger_notify_driver_assigned → Fires when driver is assigned');
    console.log('   ⚠️  trigger_notify_assignment_cancelled → Fires when assignment is cancelled');
    console.log('   ❌ trigger_notify_payment_deleted → Fires when payment is deleted\n');
    
    console.log('🎉 Real-time notifications are now active!');
    console.log('💡 Any database changes will automatically create notifications.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating triggers:', error);
    process.exit(1);
  }
}

runTriggerMigration();
