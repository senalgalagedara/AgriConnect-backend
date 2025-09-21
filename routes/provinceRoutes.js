const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ProvinceController = require('../controllers/provinceController');

// Validation middleware
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
// GET /api/provinces - Get all provinces
router.get('/', ProvinceController.getAllProvinces);

// GET /api/provinces/:id - Get province by ID
router.get('/:id', ProvinceController.getProvinceById);

// GET /api/provinces/:id/statistics - Get province statistics
router.get('/:id/statistics', ProvinceController.getProvinceStatistics);

// POST /api/provinces - Create new province
router.post('/', validateProvince, ProvinceController.createProvince);

// PUT /api/provinces/:id - Update province
router.put('/:id', validateProvinceUpdate, ProvinceController.updateProvince);

// DELETE /api/provinces/:id - Delete province
router.delete('/:id', ProvinceController.deleteProvince);

module.exports = router;