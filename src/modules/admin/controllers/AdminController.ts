import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { Order } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';

/**
 * List all transactions (paid orders)
 */
export const listTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters
    const searchQuery = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // For backward compatibility, use offset if provided, otherwise calculate from page
    const actualPage = offset > 0 ? Math.floor(offset / limit) + 1 : page;

    const pagination = { 
      page: actualPage, 
      limit 
    };

    const { orders, total } = await AdminService.getTransactions(searchQuery, pagination);

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: orders,
      pagination: {
        currentPage: actualPage,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    } as ApiResponse<Order[]>);
  } catch (error) {
    console.error('Error in AdminController.listTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await AdminService.getTransactionStats();

    res.status(200).json({
      success: true,
      message: 'Transaction statistics retrieved successfully',
      data: stats
    } as ApiResponse);
  } catch (error) {
    console.error('Error in AdminController.getTransactionStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Advanced search for transactions
 */
export const searchTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    // Date filters
    const dateFrom = req.query.date_from ? new Date(req.query.date_from as string) : undefined;
    const dateTo = req.query.date_to ? new Date(req.query.date_to as string) : undefined;
    
    // Amount filters
    const minAmount = req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined;
    const maxAmount = req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined;

    const filters = {
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
    };

    const pagination = { page, limit };

    const { orders, total } = await AdminService.searchTransactions(query, filters, pagination);

    res.status(200).json({
      success: true,
      message: 'Transaction search completed successfully',
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    } as ApiResponse<Order[]>);
  } catch (error) {
    console.error('Error in AdminController.searchTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};