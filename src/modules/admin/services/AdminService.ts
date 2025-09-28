import { OrderModel } from '../../order/models/OrderModel';
import { Order, OrderFilter } from '../../../types/entities';
import { PaginationOptions } from '../../../types/database';

export class AdminService {
  /**
   * Get all transactions (paid orders) with search and pagination
   */
  static async getTransactions(
    searchQuery?: string,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[], total: number }> {
    try {
      // Set default pagination
      const paginationOptions: PaginationOptions = {
        page: pagination?.page || 1,
        limit: Math.min(pagination?.limit || 50, 100), // Max 100 items per page
        sortBy: pagination?.sortBy || 'created_at',
        sortOrder: pagination?.sortOrder || 'DESC'
      };

      // Build filters for search
      const filters: OrderFilter = {};
      
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.trim();
        
        // Check if it looks like an order number (numeric)
        if (/^\d+$/.test(query)) {
          filters.order_no = query;
        } else if (query.includes('@')) {
          // Looks like an email
          filters.customer_email = query;
        } else {
          // For other searches, use email search (most flexible)
          filters.customer_email = query;
        }
      }

      return await OrderModel.findPaidOrders(filters, paginationOptions);
    } catch (error) {
      console.error('Error in AdminService.getTransactions:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve transactions');
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(): Promise<any> {
    try {
      // This would typically query for various statistics
      // For now, we'll return basic stats structure
      const { orders } = await OrderModel.findPaidOrders();
      
      const totalRevenue = orders.reduce((sum: number, order: Order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue: +totalRevenue.toFixed(2),
        totalOrders,
        averageOrderValue: +averageOrderValue.toFixed(2),
        currency: 'USD'
      };
    } catch (error) {
      console.error('Error in AdminService.getTransactionStats:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve transaction statistics');
    }
  }

  /**
   * Search transactions with flexible criteria
   */
  static async searchTransactions(
    query: string,
    filters?: {
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[], total: number }> {
    try {
      const orderFilters: OrderFilter = {
        created_from: filters?.dateFrom,
        created_to: filters?.dateTo
      };

      // Determine search type based on query format
      if (query && query.trim()) {
        const cleanQuery = query.trim();
        
        if (/^\d+$/.test(cleanQuery)) {
          orderFilters.order_no = cleanQuery;
        } else if (cleanQuery.includes('@')) {
          orderFilters.customer_email = cleanQuery;
        } else {
          orderFilters.customer_email = cleanQuery;
        }
      }

      const paginationOptions: PaginationOptions = {
        page: pagination?.page || 1,
        limit: Math.min(pagination?.limit || 50, 100),
        sortBy: pagination?.sortBy || 'created_at',
        sortOrder: pagination?.sortOrder || 'DESC'
      };

      const result = await OrderModel.findPaidOrders(orderFilters, paginationOptions);

      // Apply amount filters if needed (post-processing for now)
      let filteredOrders = result.orders;
      
      if (filters?.minAmount !== undefined) {
        filteredOrders = filteredOrders.filter((order: Order) => order.total >= filters.minAmount!);
      }
      
      if (filters?.maxAmount !== undefined) {
        filteredOrders = filteredOrders.filter((order: Order) => order.total <= filters.maxAmount!);
      }

      return {
        orders: filteredOrders,
        total: filteredOrders.length // Note: This would need adjustment for proper pagination with amount filters
      };
    } catch (error) {
      console.error('Error in AdminService.searchTransactions:', error);
      throw error instanceof Error ? error : new Error('Failed to search transactions');
    }
  }
}