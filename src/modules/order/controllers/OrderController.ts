import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { CheckoutRequest, OrderWithItems, Order } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';

/**
 * Checkout - Create order from cart
 */
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, contact, shipping }: CheckoutRequest = req.body;

    if (!userId || !contact || !shipping) {
      res.status(400).json({
        success: false,
        message: 'User ID, contact information, and shipping information are required'
      } as ApiResponse);
      return;
    }

    const orderWithItems = await OrderService.checkout({ userId, contact, shipping });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderWithItems
    } as ApiResponse<OrderWithItems>);
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
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (!orderId || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      } as ApiResponse);
      return;
    }

    const orderWithItems = await OrderService.getOrderById(orderId);

    if (!orderWithItems) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: orderWithItems
    } as ApiResponse<OrderWithItems>);
  } catch (error) {
    console.error('Error in OrderController.getOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get paid orders with filtering and pagination
 */
export const getPaidOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const orderNo = req.query.order_no as string;
    const customerEmail = req.query.customer_email as string;
    const createdFrom = req.query.created_from ? new Date(req.query.created_from as string) : undefined;
    const createdTo = req.query.created_to ? new Date(req.query.created_to as string) : undefined;

    const filters = {
      order_no: orderNo,
      customer_email: customerEmail,
      created_from: createdFrom,
      created_to: createdTo
    };

    const pagination = { page, limit };

    const { orders, total } = await OrderService.getPaidOrders(filters, pagination);

    res.status(200).json({
      success: true,
      message: 'Paid orders retrieved successfully',
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    } as ApiResponse<Order[]>);
  } catch (error) {
    console.error('Error in OrderController.getPaidOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve paid orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Mark order as paid
 */
export const markPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { method, cardLast4 } = req.body;

    if (!orderId || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      } as ApiResponse);
      return;
    }

    if (!method) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required'
      } as ApiResponse);
      return;
    }

    const payment = await OrderService.markOrderPaid(orderId, method, cardLast4);

    res.status(200).json({
      success: true,
      message: 'Order marked as paid successfully',
      data: payment
    } as ApiResponse);
  } catch (error) {
    console.error('Error in OrderController.markPaid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as paid',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

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

    const updatedOrder = await OrderService.updateOrderStatus(orderId, status);

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
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};