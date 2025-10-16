import database from '../../../config/database';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  avgOrderValue: number;
  userGrowth: number;
  revenueGrowth: number;
  orderGrowth: number;
  recentActivity: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export class AnalyticsService {
  static async getAnalytics(): Promise<AnalyticsData> {
    try {
      // Get total orders and revenue
      const totalsResult = await database.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_revenue
        FROM orders
      `);
      
      const totalOrders = parseInt(totalsResult.rows[0]?.total_orders || '0', 10);
      const totalRevenue = parseFloat(totalsResult.rows[0]?.total_revenue || '0');

      // Get pending and completed orders
      const statusResult = await database.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        GROUP BY status
      `);

      let pendingOrders = 0;
      let completedOrders = 0;

      statusResult.rows.forEach((row: any) => {
        const count = parseInt(row.count, 10);
        if (row.status === 'pending' || row.status === 'assigned' || row.status === 'dispatched' || row.status === 'processing' || row.status === 'shipped') {
          pendingOrders += count;
        } else if (row.status === 'delivered') {
          completedOrders += count;
        }
      });

      // Calculate average order value
      const avgOrderValue = totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

      // Get current month stats
      const currentMonthResult = await database.query(`
        SELECT 
          COUNT(*) as order_count,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT user_id) as user_count
        FROM orders
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `);

      const currentMonthOrders = parseInt(currentMonthResult.rows[0]?.order_count || '0', 10);
      const currentMonthRevenue = parseFloat(currentMonthResult.rows[0]?.revenue || '0');

      // Get previous month stats
      const previousMonthResult = await database.query(`
        SELECT 
          COUNT(*) as order_count,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT user_id) as user_count
        FROM orders
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      `);

      const previousMonthOrders = parseInt(previousMonthResult.rows[0]?.order_count || '0', 10);
      const previousMonthRevenue = parseFloat(previousMonthResult.rows[0]?.revenue || '0');

      // Calculate growth percentages
      const orderGrowth = previousMonthOrders > 0 
        ? parseFloat((((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(1))
        : 0;

      const revenueGrowth = previousMonthRevenue > 0
        ? parseFloat((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1))
        : 0;

      // Get user growth (current month vs previous month)
      const currentMonthUsers = await database.query(`
        SELECT COUNT(*) as user_count
        FROM users
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `);

      const previousMonthUsers = await database.query(`
        SELECT COUNT(*) as user_count
        FROM users
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      `);

      const currentUsers = parseInt(currentMonthUsers.rows[0]?.user_count || '0', 10);
      const previousUsers = parseInt(previousMonthUsers.rows[0]?.user_count || '0', 10);

      const userGrowth = previousUsers > 0
        ? parseFloat((((currentUsers - previousUsers) / previousUsers) * 100).toFixed(1))
        : 0;

      // Get recent activity (last 7 days)
      const recentActivityResult = await database.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      const recentActivity = recentActivityResult.rows.map((row: any) => ({
        date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        orders: parseInt(row.orders, 10),
        revenue: parseFloat(parseFloat(row.revenue).toFixed(2))
      }));

      return {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingOrders,
        completedOrders,
        avgOrderValue,
        userGrowth,
        revenueGrowth,
        orderGrowth,
        recentActivity
      };

    } catch (error) {
      console.error('Error in AnalyticsService.getAnalytics:', error);
      
      // Return zero values on error (as per requirements)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        avgOrderValue: 0,
        userGrowth: 0,
        revenueGrowth: 0,
        orderGrowth: 0,
        recentActivity: []
      };
    }
  }
}
