import { CartModel } from '../models/CartModel';
import { CartWithItems, AddToCartRequest } from '../../../types/entities';

export class CartService {
  /**
   * Get user's cart with items and totals
   */
  static async getCart(userId: number): Promise<CartWithItems> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      return await CartModel.getCartWithItems(userId);
    } catch (error) {
      console.error('Error in CartService.getCart:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve cart');
    }
  }

  /**
   * Add item to cart
   */
  static async addItem(userId: number, request: AddToCartRequest): Promise<CartWithItems> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      if (!request.productId || request.productId <= 0) {
        throw new Error('Valid product ID is required');
      }

      const qty = request.qty && request.qty > 0 ? request.qty : 1;
      
      if (qty > 100) {
        throw new Error('Quantity cannot exceed 100 items');
      }

      return await CartModel.addItem(userId, request.productId, qty);
    } catch (error) {
      console.error('Error in CartService.addItem:', error);
      throw error instanceof Error ? error : new Error('Failed to add item to cart');
    }
  }

  /**
   * Update item quantity in cart
   */
  static async updateItemQuantity(userId: number, itemId: number, qty: number): Promise<CartWithItems> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      if (!itemId || itemId <= 0) {
        throw new Error('Valid item ID is required');
      }

      if (qty < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (qty > 100) {
        throw new Error('Quantity cannot exceed 100 items');
      }

      return await CartModel.updateQty(userId, itemId, qty);
    } catch (error) {
      console.error('Error in CartService.updateItemQuantity:', error);
      throw error instanceof Error ? error : new Error('Failed to update item quantity');
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId: number, itemId: number): Promise<CartWithItems> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      if (!itemId || itemId <= 0) {
        throw new Error('Valid item ID is required');
      }

      return await CartModel.removeItem(userId, itemId);
    } catch (error) {
      console.error('Error in CartService.removeItem:', error);
      throw error instanceof Error ? error : new Error('Failed to remove item from cart');
    }
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(userId: number): Promise<CartWithItems> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Valid user ID is required');
      }

      return await CartModel.clearCart(userId);
    } catch (error) {
      console.error('Error in CartService.clearCart:', error);
      throw error instanceof Error ? error : new Error('Failed to clear cart');
    }
  }

  /**
   * Get cart configuration constants
   */
  static getCartConfig() {
    return CartModel.getConstants();
  }
}