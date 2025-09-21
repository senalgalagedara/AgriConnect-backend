const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const SupplierController = require('../controllers/supplierController');

// Validation middleware
const validateSupplier = [
  body('farmer_id')
    .isInt({ min: 1 })
    .withMessage('Valid farmer ID is required'),
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('price_per_unit')
    .isFloat({ min: 0.01 })
    .withMessage('Price per unit must be greater than 0'),
  body('supply_date')
    .optional()
    .isISO8601()
    .withMessage('Valid supply date is required (YYYY-MM-DD)')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const validateSupplierUpdate = [
  body('quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('price_per_unit')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price per unit must be greater than 0'),
  body('supply_date')
    .optional()
    .isISO8601()
    .withMessage('Valid supply date is required (YYYY-MM-DD)')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Routes
// GET /api/suppliers - Get all suppliers
router.get('/', SupplierController.getAllSuppliers);

// GET /api/suppliers/search - Search suppliers
router.get('/search', SupplierController.searchSuppliers);

// GET /api/suppliers/statistics - Get supplier statistics
router.get('/statistics', SupplierController.getSupplierStatistics);

// GET /api/suppliers/recent - Get recent supplies
router.get('/recent', SupplierController.getRecentSupplies);

// GET /api/suppliers/product/:productId - Get suppliers by product
router.get('/product/:productId', SupplierController.getSuppliersByProduct);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', SupplierController.getSupplierById);

// POST /api/suppliers - Create new supplier entry
router.post('/', validateSupplier, SupplierController.createSupplier);

// PUT /api/suppliers/:id - Update supplier entry
router.put('/:id', validateSupplierUpdate, SupplierController.updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier entry
router.delete('/:id', SupplierController.deleteSupplier);

module.exports = router;