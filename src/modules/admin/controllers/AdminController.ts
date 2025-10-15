import { Request, Response } from 'express';
import { OrderModel } from '../../order/models/OrderModel';
import database from '../../../config/database';
import { ApiResponse } from '../../../types/database';
import { NotificationService } from '../../product/services/NotificationService';

/**
 * Get orders for admin order list
 */
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await OrderModel.findForAdmin();

    res.status(200).json({
      success: true,
      message: 'Orders for admin retrieved successfully',
      data: orders
    } as ApiResponse);
  } catch (error) {
    console.error('Error in AdminController.getAdminOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get available drivers with remaining capacity
 */
export const getAvailableDriversWithCapacity = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use your actual drivers table columns and map to expected API fields
    const query = `
      SELECT d.id, d.first_name, d.last_name, d.contact_number, d.vehicle_type, d.vehicle_capacity::int,
        d.is_available, d.created_at, d.updated_at, d.address,
        (COALESCE(d.vehicle_capacity::int,0) - COALESCE(sub.assigned_qty,0)) as remaining_capacity
      FROM drivers d
      LEFT JOIN (
        SELECT a.driver_id, COALESCE(SUM(oi.qty),0) as assigned_qty
        FROM assignments a
        LEFT JOIN order_items oi ON oi.order_id = a.order_id
        WHERE a.status IN ('pending','in_progress')
        GROUP BY a.driver_id
      ) sub ON sub.driver_id = d.id
      WHERE d.is_available = true AND (COALESCE(d.vehicle_capacity::int,0) - COALESCE(sub.assigned_qty,0)) > 0
      ORDER BY d.created_at DESC
    `;

    let result;
    try {
      result = await database.query(query);
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string' && /relation .* does not exist/.test((err as any).message)) {
        res.status(200).json({ success: true, message: 'No assignments/order_items table', data: [] });
        return;
      }
      throw err;
    }

    // Map DB columns to API fields expected by frontend
    const drivers = result.rows.map((row: any) => ({
      id: row.id,
      name: row.first_name + ' ' + row.last_name,
      phone_number: row.contact_number,
      location: row.address,
      vehicle_type: row.vehicle_type,
      capacity: row.vehicle_capacity,
      availability_status: row.is_available ? 'available' : 'busy',
      status: 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      remaining_capacity: row.remaining_capacity
    }));

    res.status(200).json({
      success: true,
      message: 'Available drivers retrieved successfully',
      data: drivers
    } as ApiResponse);
  } catch (error) {
    console.error('Error in AdminController.getAvailableDriversWithCapacity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available drivers',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Hard delete an order by ID (admin only)
 * This permanently removes the order and its related rows via FK cascades.
 */
export const deleteOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    if (!orderId || Number.isNaN(orderId) || orderId <= 0) {
      res.status(400).json({ success: false, message: 'Valid order ID is required' } as ApiResponse);
      return;
    }

    // Get order details before deletion for notification
    const orderResult = await database.query(`
      SELECT id, order_no, total FROM orders WHERE id = $1
    `, [orderId]);

    if (orderResult.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Order not found' } as ApiResponse);
      return;
    }

    const order = orderResult.rows[0];

    // Send notification before deleting (since cascade will remove it)
    NotificationService.notifyOrderCancelled(
      order.id,
      order.order_no || order.id,
      Number(order.total || 0)
    ).catch(err => console.error('Failed to send cancellation notification:', err));

    // Attempt delete; rely on ON DELETE CASCADE for payments/order_items
    const result = await database.query(`DELETE FROM orders WHERE id = $1 RETURNING id`, [orderId]);

    res.status(204).send();
  } catch (error) {
    console.error('Error in AdminController.deleteOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export default {
  getAdminOrders,
  getAvailableDriversWithCapacity,
  deleteOrderById
};
