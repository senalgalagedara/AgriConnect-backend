import { Router } from 'express';
import { body } from 'express-validator';
import { ProvinceController } from '../controllers/ProvinceController';

const router = Router();

// Validation middleware for creating provinces
const validateProvince = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Province name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Province name must be between 2 and 100 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a positive integer'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('manager_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manager name must not exceed 100 characters')
];

// Validation middleware for updating provinces
const validateProvinceUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Province name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Province name must be between 2 and 100 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a positive integer'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('manager_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manager name must not exceed 100 characters')
];

// Routes
router.get('/', ProvinceController.getAllProvinces);
router.get('/:id/statistics', ProvinceController.getProvinceStatistics);
router.get('/:id', ProvinceController.getProvinceById);
router.post('/', validateProvince, ProvinceController.createProvince);
router.put('/:id', validateProvinceUpdate, ProvinceController.updateProvince);
router.delete('/:id', ProvinceController.deleteProvince);

export default router;