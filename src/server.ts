// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
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

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Ensure auth tables exist (lightweight safety net if migrations not run)
async function ensureAuthTables() {
  try {
    await database.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await database.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      contact_number TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await database.query(`CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    console.log('Auth tables ensured');
  } catch (e) {
    console.error('Failed ensuring auth tables', e);
  }
}
ensureAuthTables();

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