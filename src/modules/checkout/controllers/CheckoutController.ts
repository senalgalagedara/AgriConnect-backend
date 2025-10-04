import { Request, Response } from 'express';
import { CartService } from '../../cart/services/CartService';

/**
 * Return checkout data (cart, totals, contact, shipping) for a user.
 * The frontend expects a plain object with any of { cart, contact, shipping, totals }.
 */
export const getCheckoutForUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || userId <= 0) {
      res.status(400).json({ message: 'Valid user ID is required' });
      return;
    }

    const cartData = await CartService.getCart(userId);

    // Return a minimal checkout shape. Contact/shipping may be provided by other services; return null for now.
    const response = {
      cart: cartData.items,
      totals: cartData.totals,
      contact: null,
      shipping: null,
    };

    // Return raw object (frontend expects fields directly)
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in CheckoutController.getCheckoutForUser:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to retrieve checkout' });
  }
};

export default {
  getCheckoutForUser,
};
