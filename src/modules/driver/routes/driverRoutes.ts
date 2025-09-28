import { Router } from 'express';
import { body, param } from 'express-validator';
import * as DriverController from '../controllers/DriverController';

const router = Router();

// Validation middleware for driver ID parameter
const validateDriverId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Driver ID must be a positive integer')
];

// Validation middleware for creating drivers
const validateCreateDriver = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Driver name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Driver name must be between 2 and 100 characters'),
  body('phone_number')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9\-\(\)\s]+$/)
    .withMessage('Invalid phone number format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('vehicle_type')
    .trim()
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle type must be between 2 and 50 characters'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer')
];

// Validation middleware for updating drivers
const validateUpdateDriver = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Driver name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Driver name must be between 2 and 100 characters'),
  body('phone_number')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .matches(/^[\+]?[0-9\-\(\)\s]+$/)
    .withMessage('Invalid phone number format'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('vehicle_type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle type cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle type must be between 2 and 50 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('availability_status')
    .optional()
    .isIn(['available', 'busy', 'offline'])
    .withMessage('Invalid availability status'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status')
];

// Validation middleware for availability status update
const validateAvailabilityUpdate = [
  body('availability_status')
    .notEmpty()
    .withMessage('Availability status is required')
    .isIn(['available', 'busy', 'offline'])
    .withMessage('Invalid availability status')
];

// Routes
router.get('/', DriverController.getAllDrivers);
router.get('/available', DriverController.getAvailableDrivers);
router.get('/:id', validateDriverId, DriverController.getDriverById);
router.post('/', validateCreateDriver, DriverController.createDriver);
router.put('/:id', validateDriverId, validateUpdateDriver, DriverController.updateDriver);
router.patch('/:id/availability', validateDriverId, validateAvailabilityUpdate, DriverController.updateDriverAvailability);
router.delete('/:id', validateDriverId, DriverController.deleteDriver);

export default router;