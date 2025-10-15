import { Router } from 'express';
import * as AdminController from '../controllers/AdminController';

const router = Router();

// GET /api/admin/orders - list orders for admin dashboard
router.get('/orders', AdminController.getAdminOrders);

// DELETE /api/admin/orders/:orderId - hard delete an order (admin)
router.delete('/orders/:orderId', AdminController.deleteOrderById);

// GET /api/admin/drivers/available - list available drivers with remaining capacity
router.get('/drivers/available', AdminController.getAvailableDriversWithCapacity);

export default router;