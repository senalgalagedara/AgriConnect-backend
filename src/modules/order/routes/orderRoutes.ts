import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as OrderController from '../controllers/OrderController';
import { AssignmentService } from '../../assignment/services/AssignmentService';

const router = Router();

// Middleware to handle validation errors
const handleValidationErrors = (req: any, res: any, next: any) => {
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
    .isIn(['pending', 'assigned', 'dispatched', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'])
    .withMessage('Invalid order status'),
  body('paymentMethod')
    .optional()
    .isIn(['COD', 'CARD'])
    .withMessage('Payment method must be either COD or CARD'),
];


// Checkout endpoint (alternative - accepts userId in body)
router.post('/checkout', validateCheckout, OrderController.checkout);

// Create order for user (primary endpoint - userId is integer param)
router.post('/:userId', validateUserId, validateCreateOrder, OrderController.createOrder);

// Get all orders for user
router.get('/user/:userId', validateUserId, OrderController.getUserOrders);

// Get user order statistics
router.get('/user/:userId/stats', validateUserId, OrderController.getUserOrderStats);

// Get specific order by ID (numeric)
router.get('/:orderId', validateOrderId, OrderController.getOrderById);

// Update order status
router.patch('/:orderId/status', validateOrderId, validateUpdateStatus, handleValidationErrors, OrderController.updateOrderStatus);

// Assign a driver to an order (compatibility endpoint for frontend)
router.post(
  '/:orderId/assign',
  [
    param('orderId').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
    // accept both camelCase and snake_case
    body(['driverId', 'driver_id']).isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
    body(['scheduleTime', 'schedule_time']).isISO8601().withMessage('scheduleTime must be ISO8601 date')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const orderId = parseInt(req.params.orderId, 10);
      const driverId = req.body.driverId ?? req.body.driver_id;
      const scheduleTime = req.body.scheduleTime ?? req.body.schedule_time;
      const specialNotes = req.body.specialNotes ?? req.body.special_notes;

      const assignment = await AssignmentService.createAssignment({ orderId, driverId, scheduleTime, specialNotes });
      return res.status(201).json({ success: true, message: 'Driver assigned successfully', data: assignment });
    } catch (err) {
      console.error('Error in POST /orders/:orderId/assign:', err);
      return res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Failed to assign driver' });
    }
  }
);

// Cancel order
router.delete('/:orderId', validateOrderId, OrderController.cancelOrder);

export default router;
