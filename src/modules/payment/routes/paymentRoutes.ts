import { Router } from 'express';
import { body } from 'express-validator';
import * as PaymentController from '../controllers/PaymentController';

const router = Router();

const validatePayment = [
  body('orderId')
    .exists()
    .withMessage('Order ID is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),

  body('method')
    .exists()
    .withMessage('Payment method is required')
    .bail()
    .isIn(['COD', 'CARD'])
    .withMessage('Payment method must be COD or CARD'),

  // cardNumber is only required for CARD payments; still validate format if present
  body('cardNumber')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '') : v))
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13-19 digits')
    .matches(/^\d+$/)
    .withMessage('Card number must contain only digits'),
];

// Validation middleware for card validation
const validateCardNumber = [
  body('cardNumber')
    .exists()
    .withMessage('Card number is required')
    .bail()
    .customSanitizer((v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '') : v))
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13-19 digits')
    .matches(/^\d+$/)
    .withMessage('Card number must contain only digits'),
];

// Routes
router.post('/pay', validatePayment, PaymentController.processPayment);
router.get('/methods', PaymentController.getPaymentMethods);
router.post('/validate-card', validateCardNumber, PaymentController.validateCard);

export default router;
