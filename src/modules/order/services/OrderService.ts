import { OrderModel } from '../models/OrderModel';
import { Order, OrderWithItems, CheckoutRequest, OrderFilter } from '../../../types/entities';
import { PaginationOptions } from '../../../types/database';

export class OrderService {
  /**
   * Create order from cart (checkout process)
   */
  static async checkout(request: CheckoutRequest): Promise<OrderWithItems> {
    try {
      // Validate request
      if (!request.userId || request.userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      if (!request.contact?.firstName || !request.contact?.lastName) {
        throw new Error('Contact first name and last name are required');
      }

      if (!request.contact?.email || !this.isValidEmail(request.contact.email)) {
        throw new Error('Valid email address is required');
      }

      if (!request.shipping?.address || !request.shipping?.city) {
        throw new Error('Shipping address and city are required');
      }

      // Create order from cart
      const order = await OrderModel.createFromCart(request.userId, request.contact, request.shipping);
      
      // Get the full order with items
      const orderWithItems = await OrderModel.getOrderWithItems(order.id);
      
      if (!orderWithItems) {
        throw new Error('Failed to retrieve created order');
      }

      return orderWithItems;
    } catch (error) {
      console.error('Error in OrderService.checkout:', error);
      throw error instanceof Error ? error : new Error('Failed to process checkout');
    }
  }

  /**
   * Get order by ID with items
   */
  static async getOrderById(orderId: number): Promise<OrderWithItems | null> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      return await OrderModel.getOrderWithItems(orderId);
    } catch (error) {
      console.error('Error in OrderService.getOrderById:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve order');
    }
  }

  /**
   * Get order (simple) by ID
   */
  static async getOrder(orderId: number): Promise<Order | null> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      return await OrderModel.findById(orderId);
    } catch (error) {
      console.error('Error in OrderService.getOrder:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve order');
    }
  }

  /**
   * Mark order as paid
   */
  static async markOrderPaid(orderId: number, method: string, cardLast4?: string): Promise<any> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      if (!method || method.trim().length === 0) {
        throw new Error('Payment method is required');
      }

      // Validate payment method
      const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
      if (!validMethods.includes(method.toLowerCase())) {
        throw new Error('Invalid payment method');
      }

      // Validate card last 4 digits if provided
      if (cardLast4 && (cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4))) {
        throw new Error('Card last 4 digits must be exactly 4 numeric characters');
      }

      return await OrderModel.markPaid(orderId, method, cardLast4);
    } catch (error) {
      console.error('Error in OrderService.markOrderPaid:', error);
      throw error instanceof Error ? error : new Error('Failed to mark order as paid');
    }
  }

  /**
   * Get paid orders with filtering and pagination
   */
  static async getPaidOrders(
    filters?: OrderFilter,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[], total: number }> {
    try {
      // Set default pagination
      const paginationOptions = {
        page: pagination?.page || 1,
        limit: Math.min(pagination?.limit || 50, 100), // Max 100 items per page
        sortBy: pagination?.sortBy || 'created_at',
        sortOrder: pagination?.sortOrder || 'DESC'
      };

      return await OrderModel.findPaidOrders(filters, paginationOptions);
    } catch (error) {
      console.error('Error in OrderService.getPaidOrders:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve paid orders');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: number, status: Order['status']): Promise<Order | null> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      if (!status) {
        throw new Error('Order status is required');
      }

      // Validate status
      const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid order status');
      }

      return await OrderModel.updateStatus(orderId, status);
    } catch (error) {
      console.error('Error in OrderService.updateOrderStatus:', error);
      throw error instanceof Error ? error : new Error('Failed to update order status');
    }
  }

  /**
   * Cancel order (soft delete or status change)
   */
  static async cancelOrder(orderId: number): Promise<Order | null> {
    try {
      if (!orderId || orderId <= 0) {
        throw new Error('Valid order ID is required');
      }
      return await OrderModel.updateStatus(orderId, 'cancelled' as Order['status']);
    } catch (error) {
      console.error('Error in OrderService.cancelOrder:', error);
      throw error instanceof Error ? error : new Error('Failed to cancel order');
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