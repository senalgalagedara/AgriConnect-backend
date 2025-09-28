import { Router } from 'express';
import { body } from 'express-validator';
import { FarmerController } from '../controllers/FarmerController';

const router = Router();

// Validation middleware for creating farmers
const validateCreateFarmer = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Farmer name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Farmer name must be between 2 and 255 characters'),
  
  body('contact_number')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact number must be between 10 and 15 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('province_id')
    .isInt({ min: 1 })
    .withMessage('Valid province ID is required'),
  
  body('registration_number')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Registration number must be between 2 and 100 characters')
];

// Validation middleware for updating farmers
const validateUpdateFarmer = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Farmer name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Farmer name must be between 2 and 255 characters'),
  
  body('contact_number')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact number must be between 10 and 15 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('province_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Province ID must be a positive integer'),
  
  body('registration_number')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Registration number must be between 2 and 100 characters')
];

// Routes
router.get('/', FarmerController.getAllFarmers);
router.get('/province/:provinceId', FarmerController.getFarmersByProvince);
router.get('/:id', FarmerController.getFarmerById);
router.post('/', validateCreateFarmer, FarmerController.createFarmer);
router.put('/:id', validateUpdateFarmer, FarmerController.updateFarmer);
router.delete('/:id', FarmerController.deleteFarmer);

export default router;