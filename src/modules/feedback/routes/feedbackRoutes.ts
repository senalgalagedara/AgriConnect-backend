import { Router } from 'express';
import { body } from 'express-validator';
import { FeedbackController } from '../controllers/FeedbackController';

const router = Router();

// Normalization middleware: map legacy / frontend variant fields before validation
router.use((req, _res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    const body: any = req.body || {};
    // message -> comment
    if (!body.comment && typeof body.message === 'string') {
      body.comment = body.message;
    }
    // feedbackType -> feedback_type
    if (!body.feedback_type && typeof body.feedbackType === 'string') {
      body.feedback_type = body.feedbackType;
    }
    // Accept label variants (e.g. "User experience") and normalize to snake_case
    if (typeof body.feedback_type === 'string') {
      const v = body.feedback_type.trim().toLowerCase();
      const map: Record<string,string> = {
        'user experience': 'user_experience',
        'user_experience': 'user_experience',
        'performance': 'performance',
        'product / service': 'product_service',
        'product-service': 'product_service',
        'product_service': 'product_service',
        'service': 'product_service',
        'feature_request': 'product_service',
        'feature request': 'product_service',
        'bug_report': 'performance',
        'bug report': 'performance',
        'transactional': 'transactional'
      };
      if (map[v]) body.feedback_type = map[v];
    }
    // Coerce rating to int if provided as string
    if (body.rating !== undefined && typeof body.rating === 'string' && /^(\d+)$/.test(body.rating)) {
      body.rating = parseInt(body.rating, 10);
    }
    req.body = body;
  }
  next();
});

// Validation middleware for creating feedback
const validateCreateFeedback = [
  // Rating is required from frontend
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  
  // Comment now optional; if present, validate length
  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Comment must be under 5000 characters'),
  
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
  ,
  body('feedback_type')
    .optional()
    .isIn(['user_experience','performance','product_service','transactional'])
    .withMessage('Invalid feedback_type')
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