const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agriconnect',
  user: 'postgres',
  password: '1234'
});

async function cleanupTestMilestones() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning up test milestone notifications...\n');
    
    // Delete milestone notifications (they were created as tests, not real achievements)
    const deleteResult = await client.query(`
      DELETE FROM notifications 
      WHERE notification_type IN ('milestone_earnings', 'milestone_orders')
      RETURNING id, notification_type, message
    `);
    
    console.log(`✅ Deleted ${deleteResult.rowCount} milestone notifications:`);
    deleteResult.rows.forEach(row => {
      console.log(`   - ID ${row.id}: ${row.notification_type}`);
    });
    
    // Also clear milestone tracking table
    const clearMilestones = await client.query(`
      DELETE FROM notification_milestones
      RETURNING id, milestone_type, milestone_value
    `);
    
    if (clearMilestones.rowCount > 0) {
      console.log(`\n✅ Cleared ${clearMilestones.rowCount} milestone records from tracking table`);
    }
    
    // Show remaining notifications
    const remaining = await client.query(`
      SELECT COUNT(*) as count, notification_type
      FROM notifications
      WHERE is_read = false
      GROUP BY notification_type
      ORDER BY notification_type
    `);
    
    console.log('\n📊 Remaining unread notifications:');
    remaining.rows.forEach(row => {
      console.log(`   - ${row.notification_type}: ${row.count}`);
    });
    
    const total = await client.query(`
      SELECT COUNT(*) as count FROM notifications WHERE is_read = false
    `);
    
    console.log(`\n📋 Total unread: ${total.rows[0].count}`);
    console.log('\n✨ Cleanup complete! Milestone notifications will now only appear when you actually reach the milestones.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupTestMilestones();
