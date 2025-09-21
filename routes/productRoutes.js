const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');

// Validation middleware
const validateProduct = [
  body('product_name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('province_id')
    .isInt({ min: 1 })
    .withMessage('Valid province ID is required'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
  body('daily_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be a positive number'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit must not exceed 20 characters')
];

const validateProductUpdate = [
  body('product_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
  body('daily_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be a positive number'),
  body('final_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Final price must be a positive number'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit must not exceed 20 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Routes
// GET /api/products/province/:provinceId - Get products by province
router.get('/province/:provinceId', ProductController.getProductsByProvince);

// GET /api/products/province/:provinceId/search - Search products in province
router.get('/province/:provinceId/search', ProductController.searchProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', ProductController.getProductById);

// GET /api/products/:id/suppliers - Get product with suppliers
router.get('/:id/suppliers', ProductController.getProductWithSuppliers);

// GET /api/products/name/:productName - Get product by name
router.get('/name/:productName', ProductController.getProductByName);

// POST /api/products - Create new product
router.post('/', validateProduct, ProductController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', validateProductUpdate, ProductController.updateProduct);

// PATCH /api/products/:id/daily-limit - Update daily limit
router.patch('/:id/daily-limit', ProductController.updateDailyLimit);

// DELETE /api/products/:id - Delete product
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;