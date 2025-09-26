// models/Order.js
const pool = require('../config/database');
const { TAX_RATE, SHIPPING_FEE } = require('./Cart');

async function createFromCart(userId, contact, shipping) {
  const cartRes = await pool.query(
    `SELECT c.id FROM carts c WHERE c.user_id = $1 AND c.status='active'`,
    [userId]
  );
  if (!cartRes.rows[0]) throw new Error('No active cart');
  const cartId = cartRes.rows[0].id;

  const items = await pool.query(
    `SELECT p.id, p.name, p.price, ci.qty
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [cartId]
  );
  if (!items.rows.length) throw new Error('Cart empty');

  const subtotal = items.rows.reduce((s, r) => s + Number(r.price) * r.qty, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax + SHIPPING_FEE).toFixed(2);

  const { rows: [order] } = await pool.query(
    `INSERT INTO orders (user_id, subtotal, tax, shipping_fee, total, contact, shipping)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, subtotal, tax, SHIPPING_FEE, total, contact, shipping]
  );

  const insertItems = items.rows.map((r) =>
    pool.query(
      `INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES ($1,$2,$3,$4,$5)`,
      [order.id, r.id, r.name, r.price, r.qty]
    )
  );
  await Promise.all(insertItems);

  // mark cart as converted and clear items
  await pool.query(`UPDATE carts SET status='converted' WHERE id=$1`, [cartId]);
  await pool.query(`DELETE FROM cart_items WHERE cart_id=$1`, [cartId]);

  return order;
}

async function getOrderFull(orderId) {
  const { rows: [order] } = await pool.query(`SELECT * FROM orders WHERE id=$1`, [orderId]);
  if (!order) return null;
  const { rows: items } = await pool.query(`SELECT * FROM order_items WHERE order_id=$1`, [orderId]);
  return { order, items };
}

async function markPaid(orderId, method, cardLast4) {
  await pool.query('BEGIN');
  try {
    await pool.query(`UPDATE orders SET status='paid' WHERE id=$1`, [orderId]);
    const { rows: [payment] } = await pool.query(
      `INSERT INTO payments (order_id, method, status, card_last4) VALUES ($1,$2,'paid',$3) RETURNING *`,
      [orderId, method, cardLast4 || null]
    );
    await pool.query('COMMIT');
    return payment;
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
}

async function listPaidOrders({ q = '', limit = 50, offset = 0 }) {
  const like = `%${q}%`;
  const { rows } = await pool.query(
    `SELECT o.*, (o.contact->>'firstName' || ' ' || o.contact->>'lastName') AS customer_name,
            o.contact->>'email' AS email
     FROM orders o
     WHERE o.status='paid'
       AND ($1 = '%%' OR o.order_no::text ILIKE $1 OR (o.contact->>'email') ILIKE $1)
     ORDER BY o.created_at DESC
     LIMIT $2 OFFSET $3`,
    [like, limit, offset]
  );
  return rows;
}

module.exports = { createFromCart, getOrderFull, markPaid, listPaidOrders };
