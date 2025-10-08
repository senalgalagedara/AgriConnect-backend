import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as CartController from '../controllers/CartController';

const router = Router();

const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const validateItemId = [
  // itemId should be a positive integer (cart_item id)
  param('itemId')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer')
];

// Middleware to check results of validators and return a 400 with errors if any
const handleValidation = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const validateAddItem = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('qty')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

const validateUpdateQty = [
  body('qty')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
];

// Static routes first to avoid being captured by :userId
router.get('/config/constants', CartController.getCartConfig);
// Param routes
router.get('/:userId', validateUserId, handleValidation, CartController.getCart);
router.get('/:userId/items', validateUserId, handleValidation, CartController.getCartItems);
router.post('/:userId/items', validateUserId, validateAddItem, handleValidation, CartController.addItem);
router.patch('/:userId/items/:itemId', validateUserId, validateItemId, validateUpdateQty, handleValidation, CartController.updateQty);
router.delete('/:userId/items/:itemId', validateUserId, validateItemId, handleValidation, CartController.removeItem);
router.delete('/:userId/clear', validateUserId, handleValidation, CartController.clearCart);

export default router;