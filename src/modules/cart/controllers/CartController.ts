import { CartItem } from '../../../types/entities';

export const getCartItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }
    const cartData = await CartService.getCart(userId);
    res.status(200).json({
      success: true,
      message: 'Cart items retrieved successfully',
      data: cartData.items
    } as ApiResponse<CartItem[]>);
  } catch (error) {
    console.error('Error in CartController.getCartItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart items',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
import { Request, Response } from 'express';
import { CartService } from '../services/CartService';
import { AddToCartRequest, UpdateCartItemRequest, CartWithItems } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';


export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    const cartData = await CartService.getCart(userId);

    res.status(200).json(cartData);
  } catch (error) {
    console.error('Error in CartController.getCart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Add item to cart
 */
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const { productId, qty }: AddToCartRequest = req.body;

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    if (!productId || productId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      } as ApiResponse);
      return;
    }

    const cartData = await CartService.addItem(userId, { productId, qty });

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartData
    } as ApiResponse<CartWithItems>);
  } catch (error) {
    console.error('Error in CartController.addItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Update item quantity in cart
 */
export const updateQty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const itemId = req.params.itemId;
    const { qty }: UpdateCartItemRequest = req.body;

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Valid item ID is required'
      } as ApiResponse);
      return;
    }

    if (qty === undefined || qty === null) {
      res.status(400).json({
        success: false,
        message: 'Quantity is required'
      } as ApiResponse);
      return;
    }

    const cartData = await CartService.updateItemQuantity(userId, itemId, qty);

    res.status(200).json(cartData);
  } catch (error) {
    console.error('Error in CartController.updateQty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item quantity',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Remove item from cart
 */
export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const itemId = req.params.itemId;

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Valid item ID is required'
      } as ApiResponse);
      return;
    }

    const cartData = await CartService.removeItem(userId, itemId);

    res.status(200).json(cartData);
  } catch (error) {
    console.error('Error in CartController.removeItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      } as ApiResponse);
      return;
    }

    const cartData = await CartService.clearCart(userId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cartData
    } as ApiResponse<CartWithItems>);
  } catch (error) {
    console.error('Error in CartController.clearCart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get cart configuration
 */
export const getCartConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = CartService.getCartConfig();

    res.status(200).json({
      success: true,
      message: 'Cart configuration retrieved successfully',
      data: config
    } as ApiResponse);
  } catch (error) {
    console.error('Error in CartController.getCartConfig:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};