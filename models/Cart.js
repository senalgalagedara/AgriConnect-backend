// models/Cart.js
const pool = require('../config/database');

const TAX_RATE = 0.065;
const SHIPPING_FEE = 0;

async function ensureActiveCart(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId]
  );
  if (rows[0]) return rows[0];

  const inserted = await pool.query(
    `INSERT INTO carts (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return inserted.rows[0];
}

async function getCartWithItems(userId) {
  const cart = await ensureActiveCart(userId);
  const items = await pool.query(
    `SELECT ci.id, ci.qty, p.id AS product_id, p.name, p.price
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1 ORDER BY p.name`,
    [cart.id]
  );
  const subtotal = items.rows.reduce((s, r) => s + Number(r.price) * r.qty, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax + SHIPPING_FEE).toFixed(2);
  return { cart, items: items.rows, totals: { subtotal, tax, shippingFee: SHIPPING_FEE, total } };
}

async function addItem(userId, productId, qty = 1) {
  const cart = await ensureActiveCart(userId);
  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, qty)
     VALUES ($1,$2,$3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`,
    [cart.id, productId, qty]
  );
  return getCartWithItems(userId);
}

async function updateQty(userId, itemId, qty) {
  const cart = await ensureActiveCart(userId);
  if (qty <= 0) {
    await pool.query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`, [itemId, cart.id]);
  } else {
    await pool.query(`UPDATE cart_items SET qty = $1 WHERE id = $2 AND cart_id = $3`, [qty, itemId, cart.id]);
  }
  return getCartWithItems(userId);
}

async function removeItem(userId, itemId) {
  const cart = await ensureActiveCart(userId);
  await pool.query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`, [itemId, cart.id]);
  return getCartWithItems(userId);
}

module.exports = { ensureActiveCart, getCartWithItems, addItem, updateQty, removeItem, TAX_RATE, SHIPPING_FEE };
