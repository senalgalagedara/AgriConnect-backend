import database from '../../../config/database';
import { Order, OrderItem, OrderFilter } from '../../../types/entities';
import { PaginationOptions } from '../../../types/database';

export class OrderModel {
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
          JSON.stringify(shipping),
        ]
      );

      const order = orderResult.rows[0] as Order;

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
        // Check stock (FOR UPDATE to avoid race conditions on hot SKUs)
        const stockCheck = await client.query(
          `SELECT current_stock FROM products WHERE id = $1 FOR UPDATE`,
          [item.product_id]
        );

        if (!stockCheck.rows[0] || Number(stockCheck.rows[0].current_stock) < item.qty) {
          throw new Error(`Insufficient stock for product: ${item.name}`);
        }

        // Insert order item
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, qty)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.name, item.price, item.qty]
        );

        // Update product stock
        await client.query(
          `UPDATE products SET current_stock = current_stock - $1 WHERE id = $2`,
          [item.qty, item.product_id]
        );
      }

      // Clear cart items and close cart
      await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
      await client.query(`UPDATE carts SET status = 'completed' WHERE id = $1`, [cartId]);

      await client.query('COMMIT');

      // Normalize JSON fields before returning
      if (typeof (order as any).contact === 'string') {
        (order as any).contact = JSON.parse((order as any).contact);
      }
      if (typeof (order as any).shipping === 'string') {
        (order as any).shipping = JSON.parse((order as any).shipping);
      }

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
        items: itemsResult.rows,
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

      const orders = result.rows.map((order) => {
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

  /**
   * Mark an order as paid and create a payment record.
   * - For CARD: payment status = 'succeeded' and order becomes 'paid'
   * - For COD:  payment status = 'pending' and order remains 'pending' (or your COD status)
   *
   * Returns the inserted payment row.
   */
  static async markPaid(
    orderId: number,
    method: 'COD' | 'CARD',
    cardLast4?: string
  ): Promise<{
    id: number;
    order_id: number;
    amount: number;
    method: 'COD' | 'CARD';
    card_last4: string | null;
    status: 'succeeded' | 'pending';
    created_at: string;
  }> {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Lock order to prevent race conditions and read total
      const ordRes = await client.query(
        `SELECT id, total, status
           FROM orders
          WHERE id = $1
          FOR UPDATE`,
        [orderId]
      );

      if (!ordRes.rows[0]) {
        throw new Error('Order not found');
      }

      const amount = Number(ordRes.rows[0].total);
      const paymentStatus: 'succeeded' | 'pending' = method === 'CARD' ? 'succeeded' : 'pending';

      // Insert payment row
      const payRes = await client.query(
        `INSERT INTO payments (order_id, amount, method, card_last4, status, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING id, order_id, amount, method, card_last4, status, created_at`,
        [orderId, amount, method, cardLast4 ?? null, paymentStatus]
      );

      // Update order status only if CARD charge succeeded
      if (method === 'CARD') {
        await client.query(
          `UPDATE orders
              SET status = 'paid'
            WHERE id = $1`,
          [orderId]
        );
      }
      // For COD you may keep 'pending' or set a custom status like 'cod_pending'

      await client.query('COMMIT');
      return payRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error in OrderModel.markPaid:', err);
      throw err instanceof Error ? err : new Error('Failed to mark order as paid');
    } finally {
      client.release();
    }
  }

  /**
   * Fetch an order and its items together.
   * Returns { order, items } or null if not found.
   */
  static async getOrderWithItems(
    orderId: number
  ): Promise<{ order: Order; items: OrderItem[] } | null> {
    // Load order
    const orderRes = await database.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );
    if (!orderRes.rows[0]) return null;

    const order = orderRes.rows[0] as Order;

    // Normalize JSON fields
    if (typeof (order as any).contact === 'string') {
      (order as any).contact = JSON.parse((order as any).contact);
    }
    if (typeof (order as any).shipping === 'string') {
      (order as any).shipping = JSON.parse((order as any).shipping);
    }

    // Load items
    const itemsRes = await database.query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
      [orderId]
    );

    // Map DB rows to your OrderItem type if needed
    const items = itemsRes.rows as OrderItem[];

    return { order, items };
  }

  /**
   * NEW: Find paid orders with filters + pagination for AdminService
   */
  static async findPaidOrders(
    filters: OrderFilter = {},
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }> {
    // Defaults
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(Math.max(1, pagination?.limit ?? 50), 100);
    const offset = (page - 1) * limit;

    // Allowlist sort columns to prevent SQL injection
    const sortable = new Set(['created_at', 'total', 'id', 'user_id']);
    const sortBy = sortable.has((pagination?.sortBy ?? 'created_at')) ? (pagination?.sortBy ?? 'created_at') : 'created_at';
    const sortOrder = (pagination?.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where: string[] = [`status = 'paid'`];
    const params: any[] = [];
    let i = 1;

    // Order number: if you don't have an order_no column, use id as "order number"
    if (filters.order_no) {
      where.push(`id = $${i++}`);
      params.push(Number(filters.order_no));
    }

    // Email search: look inside contact JSON (contact->>'email')
    if (filters.customer_email) {
      where.push(`(contact->>'email') ILIKE $${i++}`);
      params.push(`%${filters.customer_email}%`);
    }

    if (filters.created_from) {
      where.push(`created_at >= $${i++}`);
      params.push(filters.created_from);
    }

    if (filters.created_to) {
      where.push(`created_at <= $${i++}`);
      params.push(filters.created_to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*)::int AS count FROM orders ${whereSql}`;
    const countRes = await database.query(countSql, params);
    const total: number = countRes.rows[0]?.count ?? 0;

    // Rows
    const rowsSql = `
      SELECT *
        FROM orders
        ${whereSql}
    ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${i++} OFFSET $${i++}
    `;
    const rowsRes = await database.query(rowsSql, [...params, limit, offset]);

    // Normalize JSON fields
    const orders = (rowsRes.rows as Order[]).map((o: any) => {
      if (typeof o.contact === 'string') {
        o.contact = JSON.parse(o.contact);
      }
      if (typeof o.shipping === 'string') {
        o.shipping = JSON.parse(o.shipping);
      }
      return o as Order;
    });

    return { orders, total };
  }

  /**
   * Get orders for admin dashboard list
   * Returns basic fields: id, order_no (or id), customer_name, customer_phone, customer_address, quantity, status, created_at
   */
  static async findForAdmin(): Promise<any[]> {
    try {
      const query = `
        SELECT
          o.id as order_id,
          o.id as id,
          COALESCE(o.order_no::text, o.id::text) as order_no,
          (o.contact->>'firstName') || ' ' || (o.contact->>'lastName') as customer_name,
          o.contact->>'email' as customer_email,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          COALESCE(SUM(oi.qty)::int, 0) as quantity,
          o.status,
          o.total,
          o.created_at
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, o.order_no, o.contact, o.shipping, o.status, o.created_at, o.total
        ORDER BY o.created_at DESC
      `;

      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in OrderModel.findForAdmin:', error);
      throw new Error('Failed to retrieve orders for admin');
    }
  }

  /**
   * NEW: Find orders for admin listing (all orders with customer/name/address/qty)
   */
  // (duplicate removed)
}
