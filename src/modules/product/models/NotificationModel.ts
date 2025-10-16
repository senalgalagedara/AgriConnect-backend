import database from '../../../config/database';

export interface ProductNotification {
  id: number;
  product_id: number | null;
  order_id?: number | null;
  notification_type: 
    | 'expired' 
    | 'low_stock' 
    | 'new_product' 
    | 'supplier_added' 
    | 'stock_updated'
    | 'order_placed'
    | 'order_cancelled'
    | 'driver_assigned'
    | 'milestone_earnings'
    | 'milestone_orders';
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  product_name?: string;
  province_name?: string;
  current_stock?: number;
  supplier_name?: string;
  farmer_name?: string;
  order_no?: number;
  order_total?: number;
  driver_name?: string;
  driver_phone?: string;
}

export class NotificationModel {
  
  /**
   * Create a new product notification
   */
  static async create(
    productId: number,
    type: 'expired' | 'low_stock' | 'new_product' | 'supplier_added' | 'stock_updated',
    message: string
  ): Promise<ProductNotification> {
    try {
      // For new_product, supplier_added, and stock_updated, always create new notification
      // For expired and low_stock, use ON CONFLICT to avoid duplicates
      const shouldUseDuplicateCheck = ['expired', 'low_stock'].includes(type);
      
      let result;
      if (shouldUseDuplicateCheck) {
        result = await database.query(`
          INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
          VALUES ($1, $2, $3, false, NOW(), NOW())
          ON CONFLICT (product_id, notification_type, is_read)
          WHERE product_id IS NOT NULL
          DO UPDATE SET 
            message = EXCLUDED.message,
            updated_at = NOW()
          RETURNING *
        `, [productId, type, message]);
      } else {
        // Always create new notification for events
        result = await database.query(`
          INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
          VALUES ($1, $2, $3, false, NOW(), NOW())
          RETURNING *
        `, [productId, type, message]);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in NotificationModel.create:', error);
      throw error;
    }
  }

  /**
   * Create a new order notification
   */
  static async createOrderNotification(
    orderId: number,
    type: 'order_placed' | 'order_cancelled' | 'driver_assigned' | 'milestone_earnings' | 'milestone_orders',
    message: string
  ): Promise<ProductNotification> {
    try {
      const result = await database.query(`
        INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
        VALUES ($1, $2, $3, false, NOW(), NOW())
        RETURNING *
      `, [orderId, type, message]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in NotificationModel.createOrderNotification:', error);
      throw error;
    }
  }

  /**
   * Create a milestone notification (no order_id or product_id)
   */
  static async createMilestoneNotification(
    type: 'milestone_earnings' | 'milestone_orders',
    message: string
  ): Promise<ProductNotification> {
    try {
      const result = await database.query(`
        INSERT INTO notifications (notification_type, message, is_read, created_at, updated_at)
        VALUES ($1, $2, false, NOW(), NOW())
        RETURNING *
      `, [type, message]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in NotificationModel.createMilestoneNotification:', error);
      throw error;
    }
  }

  /**
   * Record milestone achievement to prevent duplicates
   */
  static async recordMilestone(
    userId: string,
    milestoneType: 'earnings' | 'orders',
    milestoneValue: number
  ): Promise<boolean> {
    try {
      await database.query(`
        INSERT INTO notification_milestones (user_id, milestone_type, milestone_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, milestone_type, milestone_value) DO NOTHING
      `, [userId, milestoneType, milestoneValue]);
      
      return true;
    } catch (error) {
      console.error('Error in NotificationModel.recordMilestone:', error);
      return false;
    }
  }

  /**
   * Check if milestone has been achieved
   */
  static async hasMilestoneBeenAchieved(
    userId: string,
    milestoneType: 'earnings' | 'orders',
    milestoneValue: number
  ): Promise<boolean> {
    try {
      const result = await database.query(`
        SELECT EXISTS(
          SELECT 1 FROM notification_milestones
          WHERE user_id = $1 AND milestone_type = $2 AND milestone_value = $3
        ) as exists
      `, [userId, milestoneType, milestoneValue]);
      
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error in NotificationModel.hasMilestoneBeenAchieved:', error);
      return true; // Return true to avoid duplicate notifications on error
    }
  }

  /**
   * Get all unread notifications with product, order and driver details
   */
  static async getUnreadNotifications(): Promise<ProductNotification[]> {
    try {
      const result = await database.query(`
        SELECT
          n.id,
          n.product_id,
          n.order_id,
          n.notification_type,
          n.message,
          n.is_read,
          n.created_at,
          n.updated_at,
          p.product_name,
          p.current_stock,
          prov.name as province_name,
          o.order_no,
          o.total as order_total,
          CONCAT(d.first_name, ' ', d.last_name) as driver_name,
          d.contact_number as driver_phone
        FROM notifications n
        LEFT JOIN products p ON n.product_id = p.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        LEFT JOIN orders o ON n.order_id = o.id
        LEFT JOIN LATERAL (
          SELECT driver_id 
          FROM assignments 
          WHERE order_id = n.order_id 
            AND status != 'cancelled'
          ORDER BY created_at DESC 
          LIMIT 1
        ) a ON true
        LEFT JOIN drivers d ON a.driver_id = d.id
        WHERE n.is_read = false
        ORDER BY n.created_at DESC, n.id DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error in NotificationModel.getUnreadNotifications:', error);
      throw error;
    }
  }

  /**
   * Get all notifications (read and unread)
   */
  static async getAllNotifications(limit: number = 50): Promise<ProductNotification[]> {
    try {
      const result = await database.query(`
        SELECT
          n.id,
          n.product_id,
          n.order_id,
          n.notification_type,
          n.message,
          n.is_read,
          n.created_at,
          n.updated_at,
          p.product_name,
          p.current_stock,
          prov.name as province_name,
          o.order_no,
          o.total as order_total,
          CONCAT(d.first_name, ' ', d.last_name) as driver_name,
          d.contact_number as driver_phone
        FROM notifications n
        LEFT JOIN products p ON n.product_id = p.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        LEFT JOIN orders o ON n.order_id = o.id
        LEFT JOIN LATERAL (
          SELECT driver_id 
          FROM assignments 
          WHERE order_id = n.order_id 
            AND status != 'cancelled'
          ORDER BY created_at DESC 
          LIMIT 1
        ) a ON true
        LEFT JOIN drivers d ON a.driver_id = d.id
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error in NotificationModel.getAllNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: number): Promise<ProductNotification | null> {
    try {
      const result = await database.query(`
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error in NotificationModel.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<number> {
    try {
      const result = await database.query(`
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE is_read = false
      `);
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error in NotificationModel.markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await database.query(`
        DELETE FROM notifications
        WHERE id = $1
      `, [id]);
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error in NotificationModel.delete:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const result = await database.query(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE is_read = false
      `);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error in NotificationModel.getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Delete read notifications older than specified days
   */
  static async deleteOldReadNotifications(days: number = 30): Promise<number> {
    try {
      const result = await database.query(`
        DELETE FROM notifications
        WHERE is_read = true 
        AND updated_at < NOW() - INTERVAL '${days} days'
      `);
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error in NotificationModel.deleteOldReadNotifications:', error);
      throw error;
    }
  }
}
