import { Router } from 'express';
import { body, param } from 'express-validator';
import * as OrderController from '../controllers/OrderController';

const router = Router();

/** =========================
 * Validation middleware
 * ======================== */

// userId is an integer
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
];

const validateOrderId = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
];

const validateCreateOrder = [
  body('contact')
    .isObject()
    .withMessage('Contact information is required'),
  body('contact.firstName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('contact.lastName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('contact.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('contact.phone')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('shipping')
    .isObject()
    .withMessage('Shipping information is required'),
  body('shipping.address')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('shipping.city')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shipping.state')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shipping.postalCode')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('paymentMethod')
    .isIn(['COD', 'CARD'])
    .withMessage('Payment method must be either COD or CARD'),
];

const validateCheckout = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  body('contact')
    .isObject()
    .withMessage('Contact information is required'),
  body('contact.firstName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('contact.lastName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('contact.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('contact.phone')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('shipping')
    .isObject()
    .withMessage('Shipping information is required'),
  body('shipping.address')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('shipping.city')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shipping.state')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shipping.postalCode')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('paymentMethod')
    .isIn(['COD', 'CARD'])
    .withMessage('Payment method must be either COD or CARD'),
];

const validateUpdateStatus = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];


// Checkout endpoint (alternative - accepts userId in body)
router.post('/checkout', validateCheckout, OrderController.checkout);

// Create order for user (primary endpoint - userId in params, UUID)
router.post('/:userId', validateUserId, validateCreateOrder, OrderController.createOrder);

// Get all orders for user
router.get('/user/:userId', validateUserId, OrderController.getUserOrders);

// Get user order statistics
router.get('/user/:userId/stats', validateUserId, OrderController.getUserOrderStats);

// Get specific order by ID (numeric)
router.get('/:orderId', validateOrderId, OrderController.getOrderById);

// Update order status
router.patch('/:orderId/status', validateOrderId, validateUpdateStatus, OrderController.updateOrderStatus);

// Cancel order
router.delete('/:orderId', validateOrderId, OrderController.cancelOrder);

export default router;
