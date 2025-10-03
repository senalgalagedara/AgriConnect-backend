// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import database config instead of creating new pool
const db = require('./config/database');

// Import routes
const provinceRoutes = require('./routes/provinceRoutes');
const productRoutes = require('./routes/productRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());  // Allow all origins for debugging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
db.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Routes
app.use('/api/provinces', provinceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/cart', cartRoutes);
// Backward/forward compatibility: support plural route
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Dashboard stats endpoint (quick add for the JS entrypoint)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const query = `
      SELECT
        (COALESCE((SELECT COUNT(*)::int FROM farmers),0) + COALESCE((SELECT COUNT(*)::int FROM drivers),0)) as total_users,
        COALESCE((SELECT COUNT(*)::int FROM orders),0) as total_orders,
        COALESCE((SELECT SUM(amount)::numeric FROM payments WHERE status = 'succeeded'), (SELECT SUM(total) FROM orders WHERE status = 'paid'), 0) as total_revenue,
        COALESCE((SELECT COUNT(*)::int FROM orders WHERE status IN ('pending','processing','shipped')),0) as pending_deliveries,
        COALESCE((SELECT COUNT(*)::int FROM feedback),0) as total_feedback,
        COALESCE((SELECT COUNT(*)::int FROM payments),0) as total_payments
    `;

    let result;
    try {
      result = await db.query(query);
    } catch (err) {
      // fallback for missing optional tables (payments, feedback)
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
        result = await db.query(fallback);
      } else {
        throw err;
      }
    }

    const row = result.rows[0] || {};
    res.json({
      success: true,
      data: {
        totalUsers: Number(row.total_users) || 0,
        totalOrders: Number(row.total_orders) || 0,
        totalRevenue: Number(row.total_revenue) || 0,
        pendingDeliveries: Number(row.pending_deliveries) || 0,
        totalFeedback: Number(row.total_feedback) || 0,
        totalPayments: Number(row.total_payments) || 0,
      },
      message: 'Dashboard stats retrieved'
    });
  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats', error: error && error.message ? error.message : String(error) });
  }
});


// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      message: 'AgriConnect Backend is running',
      db_time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});