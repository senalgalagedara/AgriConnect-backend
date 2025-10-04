// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import database from './config/database';

// Import TypeScript routes
import feedbackRoutes from './modules/feedback/routes/feedbackRoutes';
import provinceRoutes from './modules/province/routes/provinceRoutes';
import productRoutes from './modules/product/routes/productRoutes';
import farmerRoutes from './modules/farmer/routes/farmerRoutes';
import supplierRoutes from './modules/supplier/routes/supplierRoutes';

// Import TypeScript routes
import cartRoutes from './modules/cart/routes/cartRoutes';
import orderRoutes from './modules/order/routes/orderRoutes';
import paymentRoutes from './modules/payment/routes/paymentRoutes';
import adminRoutes from './modules/admin/routes/adminRoutes';
import driverRoutes from './modules/driver/routes/driverRoutes';
import assignmentRoutes from './modules/assignment/routes/assignmentRoutes';
import dashboardRoutes from './modules/dashboard/routes/dashboardRoutes';
import authRoutes from './modules/auth/routes/authRoutes';
import { sessionMiddleware } from './modules/auth/middleware/session';
import { FeedbackModel } from './modules/feedback/models/FeedbackModel';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Allow multiple dev origins (comma separated) e.g. FRONTEND_URL="http://localhost:3000,http://127.0.0.1:3000"
const rawOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim());
const allowedOrigins = new Set(rawOrigins);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow same-origin / curl
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS: Origin not allowed')); 
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Attach session middleware early so downstream routes have currentUser
app.use(sessionMiddleware);

// Test database connection
database.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch((err: Error) => console.error('Database connection error:', err));

// NOTE: Runtime table creation removed. Schema is now managed exclusively via SQL migrations.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes); // New TypeScript feedback routes
app.use('/api/provinces', provinceRoutes); // New TypeScript province routes
app.use('/api/products', productRoutes); // New TypeScript product routes
app.use('/api/farmers', farmerRoutes); // New TypeScript farmer routes
app.use('/api/suppliers', supplierRoutes); // New TypeScript supplier routes
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Debug endpoint to verify active feedback INSERT template (should not contain category)
app.get('/api/debug/feedback-insert', (req: Request, res: Response) => {
  const template = FeedbackModel.getInsertTemplate();
  res.json({ success: true, template, containsCategory: /category/i.test(template) });
});

// Health check route
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await database.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      server: 'Running',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      server: 'Running',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'AgriConnect Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      feedback: '/api/feedback',
      provinces: '/api/provinces',
      products: '/api/products',
      farmers: '/api/farmers',
      suppliers: '/api/suppliers',
      cart: '/api/cart',
      orders: '/api/orders',
      payment: '/api/payment',
      admin: '/api/admin',
      drivers: '/api/drivers',
      assignments: '/api/assignments'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Diagnostics: log unexpected exits
['beforeExit','exit','SIGINT','SIGTERM','uncaughtException','unhandledRejection'].forEach(ev => {
  process.on(ev as any, (arg: any) => {
    console.log(`[process:${ev}]`, arg instanceof Error ? { message: arg.message, stack: arg.stack } : arg);
  });
});

export default app;