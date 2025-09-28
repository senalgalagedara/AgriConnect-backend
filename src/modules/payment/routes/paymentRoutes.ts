import { Router } from 'express';
import { body } from 'express-validator';
import * as PaymentController from '../controllers/PaymentController';

const router = Router();

// Validation middleware for payment processing
const validatePayment = [
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('method')
    .isIn(['COD', 'CARD'])
    .withMessage('Payment method must be COD or CARD'),
  body('cardNumber')
    .optional()
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13-19 digits')
    .matches(/^\d+$/)
    .withMessage('Card number must contain only digits')
];

// Validation middleware for card validation
const validateCardNumber = [
  body('cardNumber')
    .notEmpty()
    .withMessage('Card number is required')
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13-19 digits')
];

// Routes
router.post('/pay', validatePayment, PaymentController.processPayment);
router.get('/methods', PaymentController.getPaymentMethods);
router.post('/validate-card', validateCardNumber, PaymentController.validateCard);

export default router;