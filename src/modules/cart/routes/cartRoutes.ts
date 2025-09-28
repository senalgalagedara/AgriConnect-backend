import { Router } from 'express';
import { body, param } from 'express-validator';
import * as CartController from '../controllers/CartController';

const router = Router();

// Validation middleware for user ID parameter
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

// Validation middleware for item ID parameter
const validateItemId = [
  param('itemId')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer')
];

// Validation middleware for adding items
const validateAddItem = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('qty')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

// Validation middleware for updating quantity
const validateUpdateQty = [
  body('qty')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
];

// Routes
router.get('/:userId', validateUserId, CartController.getCart);
router.post('/:userId/items', validateUserId, validateAddItem, CartController.addItem);
router.patch('/:userId/items/:itemId', validateUserId, validateItemId, validateUpdateQty, CartController.updateQty);
router.delete('/:userId/items/:itemId', validateUserId, validateItemId, CartController.removeItem);
router.delete('/:userId/clear', validateUserId, CartController.clearCart);
router.get('/config/constants', CartController.getCartConfig);

export default router;