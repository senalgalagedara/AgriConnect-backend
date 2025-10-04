import { Request, Response } from 'express';
import database from '../../../config/database';
import { ApiResponse } from '../../../types/database';

export class DashboardController {
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          (COALESCE((SELECT COUNT(*)::int FROM farmers),0) + COALESCE((SELECT COUNT(*)::int FROM drivers),0)) as total_users,
          COALESCE((SELECT COUNT(*)::int FROM orders),0) as total_orders,
          -- Prefer payments sum for revenue if payments table exists, fall back to paid orders total
          COALESCE((SELECT SUM(amount)::numeric FROM payments WHERE status = 'succeeded'), (SELECT SUM(total) FROM orders WHERE status = 'paid'), 0) as total_revenue,
          COALESCE((SELECT COUNT(*)::int FROM orders WHERE status IN ('pending','processing','shipped')),0) as pending_deliveries,
          COALESCE((SELECT COUNT(*)::int FROM feedback),0) as total_feedback,
          COALESCE((SELECT COUNT(*)::int FROM payments),0) as total_payments
      `;

      let result;
      try {
        result = await database.query(query);
      } catch (err: any) {
        // If some optional tables don't exist, try a safer query using only orders/farmers/drivers
        if (err && err.message && /relation .* does not exist/.test(err.message)) {
          const fallback = `
            SELECT
              COALESCE((SELECT COUNT(*)::int FROM farmers),0) + COALESCE((SELECT COUNT(*)::int FROM drivers),0) as total_users,
              COALESCE((SELECT COUNT(*)::int FROM orders),0) as total_orders,
              COALESCE((SELECT SUM(total) FROM orders WHERE status = 'paid'),0) as total_revenue,
              COALESCE((SELECT COUNT(*)::int FROM orders WHERE status IN ('pending','processing','shipped')),0) as pending_deliveries,
              0 as total_feedback,
              0 as total_payments
          `;
          result = await database.query(fallback);
        } else {
          throw err;
        }
      }

      const row = result.rows[0] || {};

      const response: ApiResponse = {
        success: true,
        data: {
          totalUsers: Number(row.total_users) || 0,
          totalOrders: Number(row.total_orders) || 0,
          totalRevenue: Number(row.total_revenue) || 0,
          pendingDeliveries: Number(row.pending_deliveries) || 0,
          totalFeedback: Number(row.total_feedback) || 0,
          totalPayments: Number(row.total_payments) || 0,
        },
        message: 'Dashboard stats retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error in DashboardController.getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard stats',
        error: error instanceof Error ? error.message : String(error)
      } as ApiResponse);
    }
  }
}

export default DashboardController;
