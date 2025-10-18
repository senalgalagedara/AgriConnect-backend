import { NotificationModel, ProductNotification } from '../models/NotificationModel';
import { ProductModel } from '../models/ProductModel';

export class NotificationService {

  /**
   * Check and create notifications for expired and low stock products
   */
  static async checkAndCreateNotifications(): Promise<void> {
    try {
      // Check for expired products (created more than 5 days ago)
      await this.checkExpiredProducts();
      
      // Check for low stock products
      await this.checkLowStockProducts();
    } catch (error) {
      console.error('Error in NotificationService.checkAndCreateNotifications:', error);
      throw error;
    }
  }

  /**
   * Check for expired products and create notifications
   */
  private static async checkExpiredProducts(): Promise<void> {
    try {
      // Get all active products
      const expiredProducts = await ProductModel.findAll(
        { status: 'active' }
      );

      for (const product of expiredProducts.products) {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation >= 5) {
          const message = `Product "${product.product_name}" has expired (${daysSinceCreation} days old). Added on ${new Date(product.created_at).toLocaleDateString()}.`;
          
          await NotificationModel.create(product.id, 'expired', message);
        }
      }
    } catch (error) {
      console.error('Error checking expired products:', error);
      throw error;
    }
  }

  /**
   * Check for low stock products and create notifications
   */
  private static async checkLowStockProducts(): Promise<void> {
    try {
      const lowStockProducts = await ProductModel.findLowStock();

      for (const product of lowStockProducts) {
        const stockPercentage = (product.current_stock / product.daily_limit) * 100;
        const message = `Low stock alert for "${product.product_name}". Current stock: ${product.current_stock} ${product.unit} (${stockPercentage.toFixed(1)}% of daily limit).`;
        
        await NotificationModel.create(product.id, 'low_stock', message);
      }
    } catch (error) {
      console.error('Error checking low stock products:', error);
      throw error;
    }
  }

  /**
   * Get all unread notifications
   */
  static async getUnreadNotifications(): Promise<ProductNotification[]> {
    try {
      return await NotificationModel.getUnreadNotifications();
    } catch (error) {
      console.error('Error in NotificationService.getUnreadNotifications:', error);
      throw error;
    }
  }

  /**
   * Get all notifications
   */
  static async getAllNotifications(limit?: number): Promise<ProductNotification[]> {
    try {
      return await NotificationModel.getAllNotifications(limit);
    } catch (error) {
      console.error('Error in NotificationService.getAllNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: number): Promise<ProductNotification | null> {
    try {
      return await NotificationModel.markAsRead(id);
    } catch (error) {
      console.error('Error in NotificationService.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<number> {
    try {
      return await NotificationModel.markAllAsRead();
    } catch (error) {
      console.error('Error in NotificationService.markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: number): Promise<boolean> {
    try {
      return await NotificationModel.delete(id);
    } catch (error) {
      console.error('Error in NotificationService.deleteNotification:', error);
      throw error;
    }
  }

  
  static async getUnreadCount(): Promise<number> {
    try {
      return await NotificationModel.getUnreadCount();
    } catch (error) {
      console.error('Error in NotificationService.getUnreadCount:', error);
      throw error;
    }
  }


  static async cleanupOldNotifications(days: number = 30): Promise<number> {
    try {
      return await NotificationModel.deleteOldReadNotifications(days);
    } catch (error) {
      console.error('Error in NotificationService.cleanupOldNotifications:', error);
      throw error;
    }
  }


  static async notifyNewProduct(productId: number, productName: string, provinceName: string): Promise<void> {
    try {
      const message = `New product "${productName}" has been added to ${provinceName} province inventory.`;
      await NotificationModel.create(productId, 'new_product', message);
    } catch (error) {
      console.error('Error in NotificationService.notifyNewProduct:', error);
      // Don't throw error - notification failure shouldn't break product creation
    }
  }


  static async notifySupplierAddedStock(
    productId: number, 
    productName: string, 
    farmerName: string,
    quantity: number,
    unit: string
  ): Promise<void> {
    try {
      const message = `${farmerName} supplied ${quantity} ${unit} of "${productName}" to inventory.`;
      await NotificationModel.create(productId, 'supplier_added', message);
    } catch (error) {
      console.error('Error in NotificationService.notifySupplierAddedStock:', error);
    }
  }

 
  static async notifyStockUpdated(
    productId: number,
    productName: string,
    oldStock: number,
    newStock: number,
    unit: string
  ): Promise<void> {
    try {
      const change = newStock - oldStock;
      const changeText = change > 0 ? `increased by ${change}` : `decreased by ${Math.abs(change)}`;
      const message = `Stock for "${productName}" ${changeText} ${unit}. Current stock: ${newStock} ${unit}.`;
      await NotificationModel.create(productId, 'stock_updated', message);
    } catch (error) {
      console.error('Error in NotificationService.notifyStockUpdated:', error);
    }
  }

  static async notifyOrderPlaced(
    orderId: number,
    orderNo: number,
    totalAmount: number,
    itemCount: number
  ): Promise<void> {
    try {
      const message = `🛒 Order #${orderNo} has been placed successfully! Total: Rs ${totalAmount.toFixed(2)} (${itemCount} item${itemCount > 1 ? 's' : ''})`;
      await NotificationModel.createOrderNotification(orderId, 'order_placed', message);
    } catch (error) {
      console.error('Error in NotificationService.notifyOrderPlaced:', error);
    }
  }

  static async notifyOrderCancelled(
    orderId: number,
    orderNo: number,
    totalAmount: number
  ): Promise<void> {
    try {
      const message = `❌ Order #${orderNo} has been cancelled. Amount: Rs ${totalAmount.toFixed(2)}`;
      await NotificationModel.createOrderNotification(orderId, 'order_cancelled', message);
    } catch (error) {
      console.error('Error in NotificationService.notifyOrderCancelled:', error);
    }
  }


  static async checkEarningsMilestones(userId: string, totalEarnings: number): Promise<void> {
    try {
      const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
      
      for (const milestone of milestones) {
        if (totalEarnings >= milestone) {
          // Check if milestone hasn't been achieved before
          const alreadyAchieved = await NotificationModel.hasMilestoneBeenAchieved(
            userId,
            'earnings',
            milestone
          );
          
          if (!alreadyAchieved) {
            const message = `🎉 Congratulations! You've earned Rs ${milestone.toLocaleString()}+ in total sales!`;
            await NotificationModel.createMilestoneNotification('milestone_earnings', message);
            await NotificationModel.recordMilestone(userId, 'earnings', milestone);
          }
        }
      }
    } catch (error) {
      console.error('Error in NotificationService.checkEarningsMilestones:', error);
      // Don't throw error - notification failure shouldn't break payment processing
    }
  }

  /**
   * Check and create milestone notifications for completed orders
   */
  static async checkOrderMilestones(userId: string, completedOrderCount: number): Promise<void> {
    try {
      const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
      
      for (const milestone of milestones) {
        if (completedOrderCount >= milestone) {
          // Check if milestone hasn't been achieved before
          const alreadyAchieved = await NotificationModel.hasMilestoneBeenAchieved(
            userId,
            'orders',
            milestone
          );
          
          if (!alreadyAchieved) {
            const message = `🏆 Amazing! You've completed ${milestone.toLocaleString()}+ orders!`;
            await NotificationModel.createMilestoneNotification('milestone_orders', message);
            await NotificationModel.recordMilestone(userId, 'orders', milestone);
          }
        }
      }
    } catch (error) {
      console.error('Error in NotificationService.checkOrderMilestones:', error);
      // Don't throw error - notification failure shouldn't break payment processing
    }
  }

  /**
   * Create notification when driver is assigned to order
   */
  static async notifyDriverAssigned(
    orderId: number,
    orderNo: number,
    driverName: string,
    driverPhone: string
  ): Promise<void> {
    try {
      const message = `🚗 Driver assigned! ${driverName} (${driverPhone}) has been assigned to Order #${orderNo}.`;
      await NotificationModel.createOrderNotification(orderId, 'driver_assigned', message);
    } catch (error) {
      console.error('Error in NotificationService.notifyDriverAssigned:', error);
      // Don't throw error - notification failure shouldn't break assignment
    }
  }
}
