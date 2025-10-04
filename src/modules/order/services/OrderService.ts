import { OrderModel } from '../models/OrderModel';
import { CartModel } from '../../cart/models/CartModel';
import { Order } from '../../../types/entities';

export class OrderService {
  /**
   * Create order from cart
   */
  static async createOrder(
    userId: number,
    contact: any,
    shipping: any,
    paymentMethod: 'COD' | 'CARD'
  ): Promise<Order> {
    try {
      // Validate inputs
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      if (!contact || !contact.firstName || !contact.lastName) {
        throw new Error('Contact first name and last name are required');
      }

      if (!contact.email || !this.isValidEmail(contact.email)) {
        throw new Error('Valid email address is required');
      }

      if (!contact.phone) {
        throw new Error('Phone number is required');
      }

      if (!shipping || !shipping.address || !shipping.city) {
        throw new Error('Shipping address and city are required');
      }

      if (!shipping.state) {
        throw new Error('Shipping state is required');
      }

      if (!shipping.postalCode) {
        throw new Error('Postal code is required');
      }

      if (!paymentMethod || !['COD', 'CARD'].includes(paymentMethod)) {
        throw new Error('Valid payment method is required (COD or CARD)');
      }

      // Get user's cart
      const cartData = await CartModel.getCartWithItems(userId);

      if (!cartData.items || cartData.items.length === 0) {
        throw new Error('Cart is empty. Please add items to your cart before checkout.');
      }

      // Create order
      const order = await OrderModel.createOrder(
        userId,
        cartData.cart.id,
        contact,
        shipping,
        cartData.totals,
        paymentMethod
      );

      return order;
    } catch (error) {
      console.error('Error in OrderService.createOrder:', error);
      throw error instanceof Error ? error : new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID with items
   */
  static async getOrderById(orderId: number, userId?: number): Promise<any> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      const order = await OrderModel.getOrderById(orderId, userId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('Error in OrderService.getOrderById:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve order');
    }
  }

  /**
   * Get all orders for a user
   */
  static async getUserOrders(userId: number): Promise<Order[]> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      return await OrderModel.getUserOrders(userId);
    } catch (error) {
      console.error('Error in OrderService.getUserOrders:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve user orders');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      if (!status) {
        throw new Error('Order status is required');
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid order status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updatedOrder = await OrderModel.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error in OrderService.updateOrderStatus:', error);
      throw error instanceof Error ? error : new Error('Failed to update order status');
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: number): Promise<Order> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      // Check if order exists and can be cancelled
      const order = await OrderModel.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      if (order.status === 'delivered') {
        throw new Error('Cannot cancel a delivered order');
      }

      return await OrderModel.updateOrderStatus(orderId, 'cancelled');
    } catch (error) {
      console.error('Error in OrderService.cancelOrder:', error);
      throw error instanceof Error ? error : new Error('Failed to cancel order');
    }
  }

  /**
   * Get order statistics for a user
   */
  static async getUserOrderStats(userId: number): Promise<any> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      const orders = await OrderModel.getUserOrders(userId);

      const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + Number(order.total), 0),
        ordersByStatus: {
          pending: orders.filter(o => o.status === 'pending').length,
          processing: orders.filter(o => o.status === 'processing').length,
          shipped: orders.filter(o => o.status === 'shipped').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
        },
        latestOrder: orders.length > 0 ? orders[0] : null
      };

      return stats;
    } catch (error) {
      console.error('Error in OrderService.getUserOrderStats:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve order statistics');
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}