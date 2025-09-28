import { Router } from 'express';
import { query } from 'express-validator';
import * as AdminController from '../controllers/AdminController';

const router = Router();

// Validation middleware for transaction listing
const validateTransactionQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

// Validation middleware for advanced search
const validateAdvancedSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date_from format'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date_to format'),
  query('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
];

// Routes
router.get('/transactions', validateTransactionQuery, AdminController.listTransactions);
router.get('/transactions/stats', AdminController.getTransactionStats);
router.get('/transactions/search', validateAdvancedSearch, AdminController.searchTransactions);

export default router;