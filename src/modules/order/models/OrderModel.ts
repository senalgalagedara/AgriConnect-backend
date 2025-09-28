import database from '../../../config/database';
import { Order, OrderItem, OrderWithItems, ContactInfo, ShippingInfo, OrderFilter } from '../../../types/entities';
import { PaginationOptions } from '../../../types/database';

const TAX_RATE = 0.065;
const SHIPPING_FEE = 0;

export class OrderModel {
  /**
   * Create order from user's active cart
   */
  static async createFromCart(userId: number, contact: ContactInfo, shipping: ShippingInfo): Promise<Order> {
    try {
      await database.query('BEGIN');

      // Get active cart
      const cartRes = await database.query(
        `SELECT c.id FROM carts c WHERE c.user_id = $1 AND c.status = 'active'`,
        [userId]
      );
      
      if (!cartRes.rows[0]) {
        throw new Error('No active cart found');
      }
      
      const cartId = cartRes.rows[0].id;

      // Get cart items with product info
      const items = await database.query(
        `SELECT p.id, p.product_name as name, p.final_price as price, ci.qty
         FROM cart_items ci 
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = $1`,
        [cartId]
      );

      if (!items.rows.length) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      const subtotal = items.rows.reduce((sum: number, item: any) => sum + Number(item.price) * item.qty, 0);
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const total = +(subtotal + tax + SHIPPING_FEE).toFixed(2);

      // Create order
      const orderResult = await database.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping_fee, total, contact, shipping)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, subtotal, tax, SHIPPING_FEE, total, JSON.stringify(contact), JSON.stringify(shipping)]
      );

      const order = orderResult.rows[0] as Order;

      // Create order items
      const insertItemPromises = items.rows.map((item: any) =>
        database.query(
          `INSERT INTO order_items (order_id, product_id, name, price, qty) 
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.id, item.name, item.price, item.qty]
        )
      );
      
      await Promise.all(insertItemPromises);

      // Mark cart as converted and clear items
      await database.query(`UPDATE carts SET status = 'completed' WHERE id = $1`, [cartId]);
      await database.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

      await database.query('COMMIT');
      return order;
    } catch (error) {
      await database.query('ROLLBACK');
      console.error('Error in OrderModel.createFromCart:', error);
      throw error instanceof Error ? error : new Error('Failed to create order from cart');
    }
  }

  /**
   * Get order with all items
   */
  static async getOrderWithItems(orderId: number): Promise<OrderWithItems | null> {
    try {
      const orderResult = await database.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      
      if (!orderResult.rows[0]) {
        return null;
      }

      const order = orderResult.rows[0] as Order;

      // Parse JSON fields if they're strings
      if (typeof order.contact === 'string') {
        order.contact = JSON.parse(order.contact);
      }
      if (typeof order.shipping === 'string') {
        order.shipping = JSON.parse(order.shipping);
      }

      const itemsResult = await database.query(
        `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`,
        [orderId]
      );

      const items = itemsResult.rows as OrderItem[];

      return { order, items };
    } catch (error) {
      console.error('Error in OrderModel.getOrderWithItems:', error);
      throw new Error('Failed to retrieve order with items');
    }
  }

  /**
   * Mark order as paid
   */
  static async markPaid(orderId: number, method: string, cardLast4?: string): Promise<any> {
    try {
      await database.query('BEGIN');

      await database.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [orderId]);
      
      const paymentResult = await database.query(
        `INSERT INTO payments (order_id, method, status, card_last4) 
         VALUES ($1, $2, 'paid', $3) 
         RETURNING *`,
        [orderId, method, cardLast4 || null]
      );

      await database.query('COMMIT');
      return paymentResult.rows[0];
    } catch (error) {
      await database.query('ROLLBACK');
      console.error('Error in OrderModel.markPaid:', error);
      throw new Error('Failed to mark order as paid');
    }
  }

  /**
   * List paid orders with filtering and pagination
   */
  static async findPaidOrders(
    filters?: OrderFilter,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[], total: number }> {
    try {
      let query = `
        SELECT o.*, 
               (o.contact->>'firstName' || ' ' || o.contact->>'lastName') AS customer_name,
               o.contact->>'email' AS email
        FROM orders o
        WHERE o.status = 'paid'
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters?.order_no) {
        query += ` AND o.order_no::text ILIKE $${paramIndex}`;
        params.push(`%${filters.order_no}%`);
        paramIndex++;
      }

      if (filters?.customer_email) {
        query += ` AND o.contact->>'email' ILIKE $${paramIndex}`;
        params.push(`%${filters.customer_email}%`);
        paramIndex++;
      }

      if (filters?.created_from) {
        query += ` AND o.created_at >= $${paramIndex}`;
        params.push(filters.created_from);
        paramIndex++;
      }

      if (filters?.created_to) {
        query += ` AND o.created_at <= $${paramIndex}`;
        params.push(filters.created_to);
        paramIndex++;
      }

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM orders o WHERE o.status = 'paid'` + 
        (filters ? query.substring(query.indexOf('AND')) : '');
      const countResult = await database.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0');

      // Apply sorting
      query += ` ORDER BY o.created_at DESC`;

      // Apply pagination
      if (pagination?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(pagination.limit);
        paramIndex++;
        
        if (pagination.page && pagination.page > 1) {
          const offset = (pagination.page - 1) * pagination.limit;
          query += ` OFFSET $${paramIndex}`;
          params.push(offset);
        }
      }

      const result = await database.query(query, params);
      return { orders: result.rows as Order[], total };
    } catch (error) {
      console.error('Error in OrderModel.findPaidOrders:', error);
      throw new Error('Failed to retrieve paid orders');
    }
  }

  /**
   * Get order by ID (simple)
   */
  static async findById(orderId: number): Promise<Order | null> {
    try {
      const result = await database.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      
      if (!result.rows[0]) {
        return null;
      }

      const order = result.rows[0] as Order;

      // Parse JSON fields if they're strings
      if (typeof order.contact === 'string') {
        order.contact = JSON.parse(order.contact);
      }
      if (typeof order.shipping === 'string') {
        order.shipping = JSON.parse(order.shipping);
      }

      return order;
    } catch (error) {
      console.error('Error in OrderModel.findById:', error);
      throw new Error('Failed to retrieve order');
    }
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId: number, status: Order['status']): Promise<Order | null> {
    try {
      const result = await database.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, orderId]
      );

      if (!result.rows[0]) {
        return null;
      }

      const order = result.rows[0] as Order;

      // Parse JSON fields if they're strings
      if (typeof order.contact === 'string') {
        order.contact = JSON.parse(order.contact);
      }
      if (typeof order.shipping === 'string') {
        order.shipping = JSON.parse(order.shipping);
      }

      return order;
    } catch (error) {
      console.error('Error in OrderModel.updateStatus:', error);
      throw new Error('Failed to update order status');
    }
  }
}