# 🌾 AgriConnect Backend

> A comprehensive **Agricultural Inventory Management System** backend built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL**.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

AgriConnect is a modern agricultural supply chain management platform that connects farmers, suppliers, drivers, and customers in an integrated ecosystem. This backend API powers the entire platform with robust inventory management, order processing, delivery assignments, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- 🏪 **Multi-Province Product Catalog** - Manage products across different agricultural regions
- 👨‍🌾 **Farmer Management** - Registration, profiles, and supply tracking
- 🚛 **Supplier Network** - Supply chain management with pricing and inventory
- 🛒 **Shopping Cart & Orders** - Complete e-commerce functionality
- 🚗 **Driver & Delivery System** - Assignment-based delivery management
- 💳 **Payment Processing** - Multi-gateway payment support with full transaction tracking
- 💬 **Feedback System** - Customer satisfaction and issue tracking
- 👨‍💼 **Admin Dashboard** - Comprehensive system management and analytics

### Technical Features
- 🔧 **Modular Architecture** - Clean separation of concerns with TypeScript
- 🔐 **Type Safety** - Comprehensive TypeScript interfaces and validation
- 📊 **Advanced Analytics** - Business intelligence queries and reporting
- 🎯 **RESTful API** - Well-structured endpoints with proper HTTP methods
- 🔍 **Advanced Search** - Filtering, pagination, and search capabilities
- 📈 **Real-time Monitoring** - System health checks and performance metrics
- 🛡️ **Security** - Input validation, parameterized queries, and error handling
- 📚 **Comprehensive SQL Library** - 1000+ optimized queries for all operations

## 🏗️ Architecture

### Project Structure
```
📦 agriconnect-backend/
├── 📁 src/
│   ├── 📁 config/           # Database configuration
│   ├── 📁 types/            # TypeScript interfaces and types
│   ├── 📁 modules/          # Feature-based modules
│   │   ├── 📁 admin/        # Admin management
│   │   ├── 📁 assignment/   # Delivery assignments
│   │   ├── 📁 cart/         # Shopping cart
│   │   ├── 📁 driver/       # Driver management
│   │   ├── 📁 farmer/       # Farmer profiles
│   │   ├── 📁 feedback/     # Customer feedback
│   │   ├── 📁 order/        # Order processing
│   │   ├── 📁 payment/      # Payment processing
│   │   ├── 📁 product/      # Product catalog
│   │   ├── 📁 province/     # Regional management
│   │   └── 📁 supplier/     # Supply chain
│   └── 📄 server.ts         # Application entry point
├── 📁 sql/                  # Complete SQL query library
├── 📁 scripts/              # Database setup and migration scripts
├── 📄 package.json          # Dependencies and scripts
└── 📄 tsconfig.json         # TypeScript configuration
```

### Module Architecture
Each module follows a consistent **MVC pattern**:
```
📁 module-name/
├── 📁 controllers/    # Request handling and business logic
├── 📁 models/         # Data access layer with SQL queries
├── 📁 services/       # Business logic and validation
└── 📁 routes/         # API route definitions
```

## 🛠️ Installation

### Prerequisites
- **Node.js** v18+ 
- **PostgreSQL** v13+
- **npm** v8+

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/senalgalagedara/AgriConnect-backend.git
   cd AgriConnect-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup**
   ```bash
   # Create database and tables
   npm run db:setup
   
   # Setup feedback table (if needed)
   npm run db:feedback
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables
Create a `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agriconnect
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (if implementing auth)
JWT_SECRET=your_jwt_secret

# Payment Gateway Configuration
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_id
```

### Database Schema
The system includes a comprehensive database schema with:
- **12 main tables** (farmers, products, orders, drivers, etc.)
- **Relational integrity** with foreign keys and constraints
- **Performance indexes** for optimal query speed
- **Audit trails** with timestamp tracking
- **Flexible JSON fields** for metadata storage

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Core Endpoints

#### 🏪 Products
```http
GET    /api/products              # Get all products
GET    /api/products/:id          # Get product by ID
POST   /api/products              # Create new product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
```

#### 👨‍🌾 Farmers
```http
GET    /api/farmers               # Get all farmers
GET    /api/farmers/:id           # Get farmer by ID
POST   /api/farmers               # Register new farmer
PUT    /api/farmers/:id           # Update farmer profile
```

#### 🛒 Shopping & Orders
```http
GET    /api/cart/:userId          # Get user's cart
POST   /api/cart/add              # Add item to cart
POST   /api/orders/create         # Create order from cart
GET    /api/orders/:id            # Get order details
```

#### 🚗 Delivery Management
```http
GET    /api/drivers               # Get available drivers
POST   /api/assignments           # Create delivery assignment
PUT    /api/assignments/:id/start # Start delivery
PUT    /api/assignments/:id/complete # Complete delivery
```

#### 💳 Payments
```http
POST   /api/payments              # Process payment
GET    /api/payments/:id          # Get payment status
POST   /api/payments/:id/refund   # Process refund
```

#### 💬 Feedback
```http
GET    /api/feedback              # Get all feedback
POST   /api/feedback              # Submit feedback
PUT    /api/feedback/:id/resolve  # Resolve feedback (admin)
```

### Request/Response Examples

#### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Tomatoes",
    "category_id": 1,
    "province_id": 1,
    "daily_limit": 100,
    "final_price": 5.99,
    "unit": "kg"
  }'
```

#### Submit Feedback
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Great service and fresh products!",
    "rating": 5,
    "category": "service",
    "meta": {
      "orderId": "12345"
    }
  }'
```

## 🗄️ Database Operations

### Available Scripts
```bash
# Database setup and management
npm run db:setup              # Create database and tables
npm run db:feedback           # Setup feedback table
npm run db:migrate-feedback   # Migrate feedback table structure

# Development
npm run dev                   # Start development server
npm run build                # Build TypeScript to JavaScript
npm run type-check           # Check TypeScript types
npm start                    # Start production server
```

### SQL Query Library
The `/sql` directory contains **1000+ optimized queries** organized by module:

- **Complete CRUD operations** for all entities
- **Advanced reporting queries** with analytics
- **Performance-optimized joins** and aggregations
- **Business intelligence queries** for dashboards
- **Maintenance and cleanup scripts**

Example usage:
```sql
-- Get top-performing farmers (from 02-farmer-queries.sql)
SELECT f.name, COUNT(s.id) as supplies, SUM(s.quantity * s.price_per_unit) as revenue
FROM farmers f
LEFT JOIN suppliers s ON f.id = s.farmer_id
WHERE s.supply_date >= NOW() - INTERVAL '3 months'
GROUP BY f.id, f.name
ORDER BY revenue DESC
LIMIT 10;
```

## 📊 Analytics & Reporting

### Business Intelligence Features
- **Real-time Dashboard** - System overview with key metrics
- **Sales Analytics** - Daily/weekly/monthly revenue reports
- **Inventory Management** - Stock levels and reorder alerts
- **Performance Metrics** - Driver efficiency and farmer productivity
- **Customer Insights** - Order patterns and satisfaction scores
- **Financial Reports** - Payment processing and refund analytics

### Sample Metrics Available
```typescript
// Dashboard overview
{
  active_farmers: 156,
  active_drivers: 23,
  pending_orders: 45,
  revenue_today: 2340.50,
  low_stock_alerts: 8,
  pending_feedback: 12
}
```

## 🔐 Security Features

- **Input Validation** - Express-validator for all endpoints
- **SQL Injection Prevention** - Parameterized queries only
- **Type Safety** - TypeScript interfaces for data validation
- **Error Handling** - Comprehensive error responses
- **Database Security** - Connection pooling and timeout management
- **Audit Trails** - Admin action logging for accountability

## 🚦 Testing

### Manual Testing
Use the provided test scripts to verify functionality:

```bash
# Test provinces API
node test-provinces-api.js

# Test specific module functionality
npm run dev
# Then use curl or Postman to test endpoints
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## 🔧 Development

### Code Style
- **TypeScript** for type safety
- **Modular architecture** with clear separation
- **RESTful API design** following best practices
- **Comprehensive error handling**
- **Consistent naming conventions**

### Adding New Modules
1. Create module directory: `src/modules/new-module/`
2. Add controllers, models, services, and routes
3. Define TypeScript interfaces in `src/types/entities.ts`
4. Create SQL queries in `sql/XX-new-module-queries.sql`
5. Register routes in `src/server.ts`

### Database Migrations
```bash
# Create new migration
cp scripts/migrate-feedback-table.js scripts/migrate-new-feature.js
# Edit the migration file
npm run db:migrate-new-feature
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start:prod
```

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Considerations
- Use environment variables for all configuration
- Set up database connection pooling
- Configure proper logging
- Set up monitoring and health checks
- Use reverse proxy (nginx) for static files

## 📈 Performance

### Optimizations Included
- **Database Indexing** - Strategic indexes for fast queries
- **Connection Pooling** - Efficient database connections
- **Query Optimization** - Tested and optimized SQL queries
- **Pagination** - Large dataset handling
- **Caching Ready** - Structure supports Redis implementation

### Monitoring
The system includes built-in monitoring queries for:
- Query performance tracking
- Database connection health
- API response times
- Error rate monitoring
- Resource usage tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add appropriate type definitions
- Include SQL queries in the appropriate module file
- Update documentation for API changes
- Test all endpoints before submitting PR

## 📚 Documentation

- **API Documentation** - Available in this README
- **SQL Query Documentation** - See `/sql/README.md`
- **Database Schema** - See `/sql/00-database-schema.sql`
- **Module Documentation** - Each module includes inline comments

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env file
cat .env
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>
```

**TypeScript Compilation Errors**
```bash
# Check TypeScript configuration
npm run type-check

# Clean build
npm run clean
npm run build
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/senalgalagedara/AgriConnect-backend/issues)
- **Documentation**: Available in `/sql/README.md`
- **Email**: [Your email for support]

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Upcoming Features
- [ ] **Authentication & Authorization** - JWT-based user authentication
- [ ] **Real-time Notifications** - WebSocket support for live updates
- [ ] **Advanced Analytics** - Machine learning for demand forecasting
- [ ] **Mobile API** - Optimized endpoints for mobile applications
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Search** - Elasticsearch integration
- [ ] **File Upload** - Image and document management
- [ ] **API Rate Limiting** - Request throttling and abuse prevention

### Long-term Vision
- Microservices architecture
- Cloud deployment (AWS/Azure)
- Advanced caching with Redis
- Message queue integration
- GraphQL API option
- Blockchain supply chain tracking

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

**Built with ❤️ for the Agricultural Community**