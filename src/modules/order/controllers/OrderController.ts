import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { ApiResponse } from '../../../types/database';
import { Order } from '../../../types/entities';

/**
 * Create a new order (checkout)
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10); 
    const { contact, shipping, paymentMethod } = req.body;

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    if (!contact || !shipping) {
      res.status(400).json({
        success: false,
        message: 'Contact information and shipping information are required'
      } as ApiResponse);
      return;
    }

    const method = paymentMethod || 'COD';

    const order = await OrderService.createOrder(userId, contact, shipping, method);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: order.id,
        order: order
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Error in OrderController.createOrder:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Checkout - Create order from cart (alternative endpoint)
 */
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, contact, shipping, paymentMethod } = req.body;

    if (!userId || !contact || !shipping) {
      res.status(400).json({
        success: false,
        message: 'User ID, contact information, and shipping information are required'
      } as ApiResponse);
      return;
    }

    const method = paymentMethod || 'COD';

    const order = await OrderService.createOrder(userId, contact, shipping, method);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: order.id,
        order: order
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Error in OrderController.checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

    if (!orderId || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      } as ApiResponse);
      return;
    }

    const order = await OrderService.getOrderById(orderId, userId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order
    } as ApiResponse);
  } catch (error) {
    console.error('Error in OrderController.getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get all orders for a user
 */
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    const orders = await OrderService.getUserOrders(userId);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: orders.length,
        itemsPerPage: orders.length
      }
    } as ApiResponse<Order[]>);
  } catch (error) {
    console.error('Error in OrderController.getUserOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get user order statistics
 */
export const getUserOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    const stats = await OrderService.getUserOrderStats(userId);

    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: stats
    } as ApiResponse);
  } catch (error) {
    console.error('Error in OrderController.getUserOrderStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const { status, paymentMethod, cardLast4 } = req.body;

    if (!orderId || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      } as ApiResponse);
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Order status is required'
      } as ApiResponse);
      return;
    }

  const updatedOrder = await OrderService.updateOrderStatus(orderId, status, paymentMethod, cardLast4);

    if (!updatedOrder) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    } as ApiResponse<Order>);
  } catch (error) {
    console.error('Error in OrderController.updateOrderStatus:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to update order status';
    // Map known messages to better status codes
    const lower = errMsg.toLowerCase();
    const statusCode = lower.includes('not found') ? 404
      : (lower.includes('invalid') || lower.includes('required')) ? 400
      : 500;
    res.status(statusCode).json({
      success: false,
      message: errMsg,
      error: errMsg
    } as ApiResponse);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId, 10);

    if (!orderId || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      } as ApiResponse);
      return;
    }

    const cancelledOrder = await OrderService.cancelOrder(orderId);

    if (!cancelledOrder) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder
    } as ApiResponse<Order>);
  } catch (error) {
    console.error('Error in OrderController.cancelOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export default {
  createOrder,
  checkout,
  getOrderById,
  getUserOrders,
  getUserOrderStats,
  updateOrderStatus,
  cancelOrder
};