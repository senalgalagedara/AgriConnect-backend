import { Router } from 'express';
import * as ConsumerController from '../controllers/ConsumerController';

const router = Router();

// GET /api/consumers/user/:userId - Get consumer profile by user ID
router.get('/user/:userId', ConsumerController.getConsumerByUserId);

export default router;
