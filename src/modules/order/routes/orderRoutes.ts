import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as OrderController from '../controllers/OrderController';

const router = Router();

// Validation middleware for order ID parameter
const validateOrderId = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer')
];

// Validation middleware for checkout
const validateCheckout = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('contact.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('contact.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('contact.email')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('contact.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('shipping.address')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shipping.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shipping.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shipping.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required')
];

// Validation middleware for marking as paid
const validateMarkPaid = [
  body('method')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'])
    .withMessage('Invalid payment method'),
  body('cardLast4')
    .optional()
    .matches(/^\d{4}$/)
    .withMessage('Card last 4 digits must be exactly 4 numeric characters')
];

// Validation middleware for status update
const validateStatusUpdate = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
];

// Validation middleware for paid orders query
const validatePaidOrdersQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('order_no')
    .optional()
    .trim(),
  query('customer_email')
    .optional()
    .trim(),
  query('created_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid created_from date format'),
  query('created_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid created_to date format')
];

// Routes
router.post('/checkout', validateCheckout, OrderController.checkout);
router.get('/paid', validatePaidOrdersQuery, OrderController.getPaidOrders);
router.get('/:orderId', validateOrderId, OrderController.getOrder);
router.patch('/:orderId/paid', validateOrderId, validateMarkPaid, OrderController.markPaid);
router.patch('/:orderId/status', validateOrderId, validateStatusUpdate, OrderController.updateOrderStatus);

export default router;