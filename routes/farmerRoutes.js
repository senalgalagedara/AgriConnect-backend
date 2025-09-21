const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const FarmerController = require('../controllers/farmerController');

// Validation middleware
const validateFarmer = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Farmer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Farmer name must be between 2 and 100 characters'),
  body('province_id')
    .isInt({ min: 1 })
    .withMessage('Valid province ID is required'),
  body('contact_number')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid contact number is required'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('registration_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Registration number must be between 3 and 50 characters')
];

const validateFarmerUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Farmer name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Farmer name must be between 2 and 100 characters'),
  body('province_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid province ID is required'),
  body('contact_number')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid contact number is required'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('registration_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Registration number must be between 3 and 50 characters')
];

// Routes
// GET /api/farmers - Get all farmers
router.get('/', FarmerController.getAllFarmers);

// GET /api/farmers/search - Search farmers
router.get('/search', FarmerController.searchFarmers);

// GET /api/farmers/province/:provinceId - Get farmers by province
router.get('/province/:provinceId', FarmerController.getFarmersByProvince);

// GET /api/farmers/:id - Get farmer by ID
router.get('/:id', FarmerController.getFarmerById);

// GET /api/farmers/:id/supplies - Get farmer supplies
router.get('/:id/supplies', FarmerController.getFarmerSupplies);

// POST /api/farmers - Create new farmer
router.post('/', validateFarmer, FarmerController.createFarmer);

// PUT /api/farmers/:id - Update farmer
router.put('/:id', validateFarmerUpdate, FarmerController.updateFarmer);

// DELETE /api/farmers/:id - Delete farmer
router.delete('/:id', FarmerController.deleteFarmer);

module.exports = router;