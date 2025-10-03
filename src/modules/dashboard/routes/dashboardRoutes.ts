import { Router } from 'express';
import DashboardController from '../controllers/DashboardController';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', DashboardController.getStats);

export default router;
