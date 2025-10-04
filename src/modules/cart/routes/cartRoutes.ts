import { Router } from 'express';
import { body, param } from 'express-validator';
import * as CartController from '../controllers/CartController';

const router = Router();

const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const validateItemId = [
  param('itemId')
    .isString()
    .notEmpty()
    .withMessage('Item ID is required')
];

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
router.get('/:userId', validateUserId, CartController.getCart);
router.get('/:userId/items', validateUserId, CartController.getCartItems);
router.post('/:userId/items', validateUserId, validateAddItem, CartController.addItem);
router.patch('/:userId/items/:itemId', validateUserId, validateItemId, validateUpdateQty, CartController.updateQty);
router.delete('/:userId/items/:itemId', validateUserId, validateItemId, CartController.removeItem);
router.delete('/:userId/clear', validateUserId, CartController.clearCart);

export default router;