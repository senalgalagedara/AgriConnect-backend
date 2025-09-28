import database from '../../../config/database';
import { Cart, CartItem, CartWithItems, CartTotals } from '../../../types/entities';

const TAX_RATE = 0.065;
const SHIPPING_FEE = 0;

export class CartModel {
  /**
   * Ensure user has an active cart
   */
  static async ensureActiveCart(userId: number): Promise<Cart> {
    try {
      const { rows } = await database.query(
        `SELECT id::text, user_id, status 
         FROM carts 
         WHERE user_id = $1 AND status = 'active' 
         LIMIT 1`,
        [userId]
      );
      
      if (rows[0]) {
        return rows[0] as Cart;
      }

      // Create new cart if none exists
      const inserted = await database.query(
        `INSERT INTO carts (user_id) VALUES ($1) RETURNING id::text, user_id, status`,
        [userId]
      );
      return inserted.rows[0] as Cart;
    } catch (error) {
      console.error('Error in CartModel.ensureActiveCart:', error);
      throw new Error('Failed to ensure active cart');
    }
  }

  /**
   * Get cart with all items and totals
   */
  static async getCartWithItems(userId: number): Promise<CartWithItems> {
    try {
      const cart = await this.ensureActiveCart(userId);
      
      const items = await database.query(
        `SELECT ci.id::text, ci.cart_id::text, ci.qty, p.id AS product_id, p.product_name as name, p.final_price as price
         FROM cart_items ci 
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = $1 
         ORDER BY p.product_name`,
        [cart.id]
      );

      const cartItems = items.rows as CartItem[];
      const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const total = +(subtotal + tax + SHIPPING_FEE).toFixed(2);

      const totals: CartTotals = {
        subtotal,
        tax,
        shippingFee: SHIPPING_FEE,
        total
      };

      return { cart, items: cartItems, totals };
    } catch (error) {
      console.error('Error in CartModel.getCartWithItems:', error);
      throw new Error('Failed to retrieve cart with items');
    }
  }

  /**
   * Add item to cart
   */
  static async addItem(userId: number, productId: number, qty: number = 1): Promise<CartWithItems> {
    try {
      const cart = await this.ensureActiveCart(userId);

      // Check product existence, status, and stock
      const productRes = await database.query(
        `SELECT id, status, current_stock, product_name FROM products WHERE id = $1`,
        [productId]
      );
      if (!productRes.rows[0]) {
        throw new Error('Product not found');
      }
      const product = productRes.rows[0];
      if (product.status !== 'active') {
        throw new Error('Product is not available for sale');
      }
      if (Number(product.current_stock) < qty) {
        throw new Error(`Not enough stock for product: ${product.product_name}`);
      }

      // Insert or update cart item, set added_at
      await database.query(
        `INSERT INTO cart_items (cart_id, product_id, qty, added_at)
         VALUES ($1::uuid, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (cart_id, product_id) 
         DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty, added_at = CURRENT_TIMESTAMP`,
        [cart.id, productId, qty]
      );

      return this.getCartWithItems(userId);
    } catch (error) {
      console.error('Error in CartModel.addItem:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  }

  /**
   * Update item quantity
   */
  static async updateQty(userId: number, itemId: number, qty: number): Promise<CartWithItems> {
    try {
      const cart = await this.ensureActiveCart(userId);
      
      if (qty <= 0) {
        await database.query(
          `DELETE FROM cart_items WHERE id::text = $1 AND cart_id = $2`,
          [itemId, cart.id]
        );
      } else {
        await database.query(
          `UPDATE cart_items SET qty = $1 WHERE id::text = $2 AND cart_id = $3`,
          [qty, itemId, cart.id]
        );
      }

      return this.getCartWithItems(userId);
    } catch (error) {
      console.error('Error in CartModel.updateQty:', error);
      throw new Error('Failed to update item quantity');
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId: number, itemId: number): Promise<CartWithItems> {
    try {
      const cart = await this.ensureActiveCart(userId);
      
      await database.query(
        `DELETE FROM cart_items WHERE id::text = $1 AND cart_id = $2`,
        [itemId, cart.id]
      );

      return this.getCartWithItems(userId);
    } catch (error) {
      console.error('Error in CartModel.removeItem:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(userId: number): Promise<CartWithItems> {
    try {
      const cart = await this.ensureActiveCart(userId);
      
      await database.query(
        `DELETE FROM cart_items WHERE cart_id = $1`,
        [cart.id]
      );

      return this.getCartWithItems(userId);
    } catch (error) {
      console.error('Error in CartModel.clearCart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Get cart constants
   */
  static getConstants() {
    return {
      TAX_RATE,
      SHIPPING_FEE
    };
  }
}