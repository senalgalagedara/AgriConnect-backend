import { Router } from 'express';
import { body } from 'express-validator';
import { FeedbackController } from '../controllers/FeedbackController';

// instantiate controller
const controller = new FeedbackController();

const router = Router();

// Validation middleware for creating feedback
const validateCreateFeedback = [
  // Rating is required from frontend
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  
  // Comment is required from frontend (maps to message in backend)
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters'),

  // Feedback type (new column)
  body('feedback_type')
    .optional()
    .isIn(['user-experience', 'performance', 'product-service', 'transactional'])
    .withMessage('Invalid feedback_type'),
  
  // Meta data is optional
  body('meta')
    .optional()
    .isObject()
    .withMessage('Meta must be an object'),
  
  // Backend fields are optional with defaults
  body('user_type')
    .optional()
    .isIn(['farmer', 'supplier', 'driver', 'admin', 'anonymous'])
    .withMessage('Invalid user type'),
  
  body('category')
    .optional()
    .isIn(['general', 'technical', 'service', 'suggestion', 'complaint'])
    .withMessage('Invalid category'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

// Validation middleware for updating feedback
const validateUpdateFeedback = [
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),

  body('feedback_type')
    .optional()
    .isIn(['user-experience', 'performance', 'product-service', 'transactional'])
    .withMessage('Invalid feedback_type'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Admin notes must not exceed 2000 characters'),
  
  body('resolved_by')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Resolved by must be a positive integer')
];

// Routes
router.get('/', controller.getAllFeedback.bind(controller));
router.get('/statistics', controller.getFeedbackStatistics.bind(controller));
router.get('/user/:userType/:userId', controller.getFeedbackByUser.bind(controller));
router.get('/:id', controller.getFeedbackById.bind(controller));
router.post('/', validateCreateFeedback, controller.createFeedback.bind(controller));
router.put('/:id', validateUpdateFeedback, controller.updateFeedback.bind(controller));
router.delete('/:id', controller.deleteFeedback.bind(controller));

export default router;