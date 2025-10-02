import database from '../../../config/database';
import { Order, OrderItem } from '../../../types/entities';

export class OrderModel {
  /**
   * Create a new order with items
   */
  static async createOrder(
    userId: number,
    cartId: number,
    contact: any,
    shipping: any,
    totals: { subtotal: number; tax: number; shippingFee: number; total: number },
    paymentMethod: 'COD' | 'CARD'
  ): Promise<Order> {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert order (schema uses no order_no column in sql/00-database-schema.sql)
      const orderResult = await client.query(
        `INSERT INTO orders 
         (user_id, subtotal, tax, shipping_fee, total, status, contact, shipping, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          userId,
          totals.subtotal,
          totals.tax,
          totals.shippingFee,
          totals.total,
          'pending',
          JSON.stringify(contact),
          JSON.stringify(shipping)
        ]
      );

      const order = orderResult.rows[0] as Order;

      // Get cart items
      const cartItemsResult = await client.query(
        `SELECT ci.product_id, ci.qty, p.product_name, p.final_price as price
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = $1`,
        [cartId]
      );

      if (cartItemsResult.rows.length === 0) {
        throw new Error('No items found in cart');
      }

      // Insert order items and update stock
      for (const item of cartItemsResult.rows) {
        // Check stock before creating order item
        const stockCheck = await client.query(
          `SELECT current_stock FROM products WHERE id = $1`,
          [item.product_id]
        );

        if (!stockCheck.rows[0] || Number(stockCheck.rows[0].current_stock) < item.qty) {
          throw new Error(`Insufficient stock for product: ${item.product_name}`);
        }

        // Insert order item (schema uses 'name' column to store product name at time of order)
        await client.query(
          `INSERT INTO order_items 
           (order_id, product_id, name, price, qty)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.product_name || item.name || null, item.price, item.qty]
        );

        // Update product stock
        await client.query(
          `UPDATE products 
           SET current_stock = current_stock - $1 
           WHERE id = $2`,
          [item.qty, item.product_id]
        );
      }

      // Clear cart items after order creation
      await client.query(
        `DELETE FROM cart_items WHERE cart_id = $1`,
        [cartId]
      );

      // Mark cart as completed
      await client.query(
        `UPDATE carts SET status = 'completed' WHERE id = $1`,
        [cartId]
      );

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in OrderModel.createOrder:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      client.release();
    }
  }

  /**
   * Get order by ID with items
   */
  static async getOrderById(orderId: number, userId?: number): Promise<any> {
    try {
      const orderQuery = userId
        ? `SELECT * FROM orders WHERE id = $1 AND user_id = $2`
        : `SELECT * FROM orders WHERE id = $1`;
      
      const params = userId ? [orderId, userId] : [orderId];
      const orderResult = await database.query(orderQuery, params);

      if (!orderResult.rows[0]) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Parse JSON fields
      if (typeof order.contact === 'string') {
        order.contact = JSON.parse(order.contact);
      }
      if (typeof order.shipping === 'string') {
        order.shipping = JSON.parse(order.shipping);
      }

      // Get order items
      const itemsResult = await database.query(
        `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`,
        [orderId]
      );

      return {
        ...order,
        items: itemsResult.rows
      };
    } catch (error) {
      console.error('Error in OrderModel.getOrderById:', error);
      throw error;
    }
  }

  /**
   * Get all orders for a user
   */
  static async getUserOrders(userId: number): Promise<Order[]> {
    try {
      const result = await database.query(
        `SELECT * FROM orders 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );

      // Parse JSON fields for each order
      const orders = result.rows.map(order => {
        if (typeof order.contact === 'string') {
          order.contact = JSON.parse(order.contact);
        }
        if (typeof order.shipping === 'string') {
          order.shipping = JSON.parse(order.shipping);
        }
        return order;
      });

      return orders as Order[];
    } catch (error) {
      console.error('Error in OrderModel.getUserOrders:', error);
      throw new Error('Failed to retrieve user orders');
    }
  }

  /**
   * Mark an order as paid and create a payment record
   */
  static async markPaid(orderId: number, method: 'COD' | 'CARD', cardLast4?: string, amount?: number): Promise<any> {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Update order status to confirmed (or 'paid')
      const updateRes = await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
        ['confirmed', orderId]
      );

      if (!updateRes.rows[0]) {
        throw new Error('Order not found');
      }

      const order = updateRes.rows[0];

      // Insert payment record. Aligns with sql/00-database-schema.sql payments table
      const paymentRes = await client.query(
        `INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_id, processed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
        [orderId, amount ?? order.total ?? 0, method === 'CARD' ? 'card' : 'cash', 'completed', cardLast4 ? `CARD-${cardLast4}` : null]
      );

      await client.query('COMMIT');
      return paymentRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in OrderModel.markPaid:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get order with its items (wrapper)
   */
  static async getOrderWithItems(orderId: number): Promise<{ order: any; items: any[] } | null> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) return null;
      return { order, items: order.items || [] };
    } catch (error) {
      console.error('Error in OrderModel.getOrderWithItems:', error);
      throw error;
    }
  }

  /**
   * Find paid/confirmed orders with optional filters and pagination
   */
  static async findPaidOrders(filters: any = {}, pagination: any = { page: 1, limit: 50, sortBy: 'created_at', sortOrder: 'DESC' }): Promise<{ orders: Order[]; total: number }> {
    try {
      const whereClauses: string[] = [`status IN ('confirmed','paid')`];
      const params: any[] = [];
      let idx = 1;

      if (filters.order_no) {
        whereClauses.push(`order_no = $${idx++}`);
        params.push(filters.order_no);
      }

      if (filters.customer_email) {
        whereClauses.push(`(contact->>'email') ILIKE $${idx++}`);
        params.push(`%${filters.customer_email}%`);
      }

      if (filters.created_from) {
        whereClauses.push(`created_at >= $${idx++}`);
        params.push(filters.created_from);
      }

      if (filters.created_to) {
        whereClauses.push(`created_at <= $${idx++}`);
        params.push(filters.created_to);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const limit = Math.min(pagination.limit || 50, 100);
      const offset = ((pagination.page || 1) - 1) * limit;

      const orderBy = `${pagination.sortBy || 'created_at'} ${pagination.sortOrder || 'DESC'}`;

      const query = `SELECT * FROM orders ${whereSql} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);

      const result = await database.query(query, params);

      // Count total (use same where clauses)
      const countParams = params.slice(0, params.length - 2);
      const countQuery = `SELECT COUNT(*) as total FROM orders ${whereSql}`;
      const countRes = await database.query(countQuery, countParams);

      const orders = result.rows.map((o: any) => {
        if (typeof o.contact === 'string') o.contact = JSON.parse(o.contact);
        if (typeof o.shipping === 'string') o.shipping = JSON.parse(o.shipping);
        return o as Order;
      });

      return { orders, total: Number(countRes.rows[0]?.total || orders.length) };
    } catch (error) {
      console.error('Error in OrderModel.findPaidOrders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    try {
      const result = await database.query(
        `UPDATE orders 
         SET status = $1 
         WHERE id = $2 
         RETURNING *`,
        [status, orderId]
      );

      if (!result.rows[0]) {
        throw new Error('Order not found');
      }

      const order = result.rows[0];

      // Parse JSON fields
      if (typeof order.contact === 'string') {
        order.contact = JSON.parse(order.contact);
      }
      if (typeof order.shipping === 'string') {
        order.shipping = JSON.parse(order.shipping);
      }

      return order as Order;
    } catch (error) {
      console.error('Error in OrderModel.updateOrderStatus:', error);
      throw new Error('Failed to update order status');
    }
  }
}