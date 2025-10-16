import { Router } from 'express';
import * as AnalyticsController from '../controllers/AnalyticsController';

const router = Router();

// GET /api/analytics - Get dashboard analytics
router.get('/', AnalyticsController.getAnalytics);

export default router;
