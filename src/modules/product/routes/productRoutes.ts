import { Router } from 'express';
import { body } from 'express-validator';
import { ProductController } from '../controllers/ProductController';

const router = Router();

const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('final_price')
    .isFloat({ min: 0 })
    .withMessage('Final price must be a positive number'),
  
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a positive integer'),
  
  body('daily_limit')
    .isInt({ min: 0 })
    .withMessage('Daily limit must be a positive integer'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit must be between 1 and 10 characters'),
  
  body('province_id')
    .isInt({ min: 1 })
    .withMessage('Valid province ID is required'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Status must be active, inactive, or discontinued')
];

const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('final_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Final price must be a positive number'),
  
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a positive integer'),
  
  body('daily_limit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Daily limit must be a positive integer'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit must be between 1 and 10 characters'),
  
  body('province_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Province ID must be a positive integer'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Status must be active, inactive, or discontinued')
];

const validateStockUpdate = [
  body('stockChange')
    .isNumeric()
    .withMessage('Stock change must be a number')
    .custom((value) => {
      if (value === 0) {
        throw new Error('Stock change cannot be zero');
      }
      return true;
    })
];

router.get('/', ProductController.getAllProducts);
router.get('/low-stock', ProductController.getLowStockProducts);
router.get('/province/:provinceId', ProductController.getProductsByProvince);
router.get('/:id/availability', ProductController.checkProductAvailability);
router.get('/:id', ProductController.getProductById);
router.post('/', validateCreateProduct, ProductController.createProduct);
router.put('/:id', validateUpdateProduct, ProductController.updateProduct);
router.patch('/:id/stock', validateStockUpdate, ProductController.updateProductStock);
router.delete('/:id', ProductController.deleteProduct);

export default router;