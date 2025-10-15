import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { ApiResponse } from '../../../types';

export class NotificationController {

  /**
   * Trigger notification check (can be called manually or via cron)
   */
  static async checkNotifications(req: Request, res: Response): Promise<void> {
    try {
      await NotificationService.checkAndCreateNotifications();

      const response: ApiResponse = {
        success: true,
        message: 'Notification check completed successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.checkNotifications:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error checking notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get all unread notifications
   */
  static async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await NotificationService.getUnreadNotifications();

      const response: ApiResponse = {
        success: true,
        data: notifications,
        message: 'Unread notifications retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.getUnreadNotifications:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get all notifications
   */
  static async getAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await NotificationService.getAllNotifications(limit);

      const response: ApiResponse = {
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.getAllNotifications:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationService.getUnreadCount();

      const response: ApiResponse = {
        success: true,
        data: { count },
        message: 'Unread count retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.getUnreadCount:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving unread count',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid notification ID'
        };
        res.status(400).json(response);
        return;
      }

      const notification = await NotificationService.markAsRead(id);

      if (!notification) {
        const response: ApiResponse = {
          success: false,
          message: 'Notification not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: notification,
        message: 'Notification marked as read'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.markAsRead:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error marking notification as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationService.markAllAsRead();

      const response: ApiResponse = {
        success: true,
        data: { count },
        message: `${count} notification(s) marked as read`
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.markAllAsRead:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error marking all notifications as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid notification ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await NotificationService.deleteNotification(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Notification not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Notification deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in NotificationController.deleteNotification:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}
