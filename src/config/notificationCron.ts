import cron from 'node-cron';
import { NotificationService } from '../modules/product/services/NotificationService';

/**
 * Set up cron jobs for notification checking
 */
export function setupNotificationCron() {
  // Run notification check every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled notification check...');
    try {
      await NotificationService.checkAndCreateNotifications();
      console.log('Notification check completed successfully');
    } catch (error) {
      console.error('Error in scheduled notification check:', error);
    }
  });

  // Clean up old read notifications every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled notification cleanup...');
    try {
      const deleted = await NotificationService.cleanupOldNotifications(30);
      console.log(`Cleaned up ${deleted} old notifications`);
    } catch (error) {
      console.error('Error in scheduled notification cleanup:', error);
    }
  });

  console.log('Notification cron jobs scheduled:');
  console.log('- Notification check: Every hour');
  console.log('- Cleanup old notifications: Daily at 2 AM');
}
