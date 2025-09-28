import { Router } from 'express';
import { body } from 'express-validator';
import { FeedbackController } from '../controllers/FeedbackController';

const router = Router();

// Validation middleware for creating feedback
const validateCreateFeedback = [
  body('user_type')
    .isIn(['farmer', 'supplier', 'driver', 'admin', 'anonymous'])
    .withMessage('Invalid user type'),
  
  body('category')
    .isIn(['general', 'technical', 'service', 'suggestion', 'complaint'])
    .withMessage('Invalid category'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Subject must be between 5 and 255 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
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
router.get('/', FeedbackController.getAllFeedback);
router.get('/statistics', FeedbackController.getFeedbackStatistics);
router.get('/user/:userType/:userId', FeedbackController.getFeedbackByUser);
router.get('/:id', FeedbackController.getFeedbackById);
router.post('/', validateCreateFeedback, FeedbackController.createFeedback);
router.put('/:id', validateUpdateFeedback, FeedbackController.updateFeedback);
router.delete('/:id', FeedbackController.deleteFeedback);

export default router;