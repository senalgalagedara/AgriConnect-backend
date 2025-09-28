import { Router } from 'express';
import { body } from 'express-validator';
import { SupplierController } from '../controllers/SupplierController';

const router = Router();

// Validation middleware for creating supplier records
const validateCreateSupplier = [
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
    .isISO8601({ strict: true })
    .withMessage('Supply date must be a valid date in ISO format (YYYY-MM-DD)'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'completed'])
    .withMessage('Status must be active, inactive, pending, or completed')
];

// Validation middleware for updating supplier records
const validateUpdateSupplier = [
  body('farmer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Farmer ID must be a positive integer'),
  
  body('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  
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
    .isISO8601({ strict: true })
    .withMessage('Supply date must be a valid date in ISO format (YYYY-MM-DD)'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'completed'])
    .withMessage('Status must be active, inactive, pending, or completed')
];

// Routes
router.get('/', SupplierController.getAllSuppliers);
router.get('/farmer/:farmerId', SupplierController.getSuppliersByFarmer);
router.get('/product/:productId', SupplierController.getSuppliersByProduct);
router.get('/:id', SupplierController.getSupplierById);
router.post('/', validateCreateSupplier, SupplierController.createSupplier);
router.put('/:id', validateUpdateSupplier, SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

export default router;