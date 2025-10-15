import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();

// Trigger notification check
router.post('/check', NotificationController.checkNotifications);

// Get unread notification count
router.get('/count', NotificationController.getUnreadCount);

// Get unread notifications
router.get('/unread', NotificationController.getUnreadNotifications);

// Get all notifications
router.get('/', NotificationController.getAllNotifications);

// Mark notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

export default router;
