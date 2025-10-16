# 🐳 AgriConnect Docker Setup

Complete Docker configuration for running AgriConnect (Frontend, Backend, Database, and pgAdmin) in containers.

## 📋 Prerequisites

- **Docker Desktop** installed ([Download](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** (included with Docker Desktop)
- **Git** (to clone the project)

## 📁 Project Structure

```
AgriConnect/
├── AgriConnect-backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   ├── .env.docker
│   └── ... (backend code)
└── AgriConnect-frontend/
    ├── Dockerfile
    └── ... (frontend code)
```

## 🚀 Quick Start

### 1. Clone Both Repositories

```bash
# Create a parent directory
mkdir AgriConnect
cd AgriConnect

# Clone backend
git clone https://github.com/senalgalagedara/AgriConnect-backend.git

# Clone frontend (adjust URL if different)
git clone https://github.com/yourusername/AgriConnect-frontend.git
```

### 2. Create Frontend Dockerfile

Create `AgriConnect-frontend/Dockerfile`:

```dockerfile
# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start Next.js
CMD ["npm", "start"]
```

### 3. Create Frontend .dockerignore

Create `AgriConnect-frontend/.dockerignore`:

```
node_modules
.next
npm-debug.log
.env.local
.git
.gitignore
README.md
*.md
.vscode
.idea
coverage
.DS_Store
```

### 4. Update Frontend API URL

In your frontend `.env` or config, ensure API URL points to:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 5. Start All Services

From the **backend directory**:

```bash
cd AgriConnect-backend
docker-compose up -d
```

This will start:
- ✅ PostgreSQL Database (port 5432)
- ✅ pgAdmin (port 5050)
- ✅ Backend API (port 5000)
- ✅ Frontend (port 3000)

### 6. Wait for Services to Initialize

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Wait for "Database connected successfully" message
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **pgAdmin**: http://localhost:5050
  - Email: `admin@agriconnect.com`
  - Password: `admin123`

## 🗄️ Database Setup

### Option 1: Automatic (Recommended)

The database schema is automatically created from `sql/00-database-schema.sql` when the container starts for the first time.

### Option 2: Manual

If you need to run migrations:

```bash
# Access backend container
docker exec -it agriconnect-backend sh

# Run migrations
npm run migrate

# Exit
exit
```

## 🔧 Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### Restart a Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild Containers
```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Access Container Shell
```bash
# Backend
docker exec -it agriconnect-backend sh

# Frontend
docker exec -it agriconnect-frontend sh

# Database
docker exec -it agriconnect-db psql -U postgres -d agriconnect_db
```

## 📊 pgAdmin Configuration

### First Time Setup

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@agriconnect.com`
   - Password: `admin123`
3. Add server:
   - **General > Name**: AgriConnect DB
   - **Connection > Host**: `postgres`
   - **Connection > Port**: `5432`
   - **Connection > Database**: `agriconnect_db`
   - **Connection > Username**: `postgres`
   - **Connection > Password**: `postgres`

## 🌐 Moving to Another PC

### Export Project

1. **Commit all changes**:
```bash
cd AgriConnect-backend
git add .
git commit -m "Docker setup"
git push

cd ../AgriConnect-frontend
git add .
git commit -m "Docker setup"
git push
```

2. **Export database (optional)**:
```bash
docker exec agriconnect-db pg_dump -U postgres agriconnect_db > backup.sql
```

### Import on New PC

1. **Install Docker Desktop**
2. **Clone repositories**:
```bash
mkdir AgriConnect
cd AgriConnect
git clone https://github.com/senalgalagedara/AgriConnect-backend.git
git clone https://github.com/yourusername/AgriConnect-frontend.git
```

3. **Start services**:
```bash
cd AgriConnect-backend
docker-compose up -d
```

4. **Import database (if needed)**:
```bash
docker exec -i agriconnect-db psql -U postgres agriconnect_db < backup.sql
```

## 🔒 Production Deployment

### Update Environment Variables

Edit `.env.docker` with production values:

```env
NODE_ENV=production
DB_PASSWORD=strong-password-here
SESSION_SECRET=generate-random-secret-key
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Use Production Dockerfile

Modify `docker-compose.yml`:

```yaml
backend:
  command: npm start  # Instead of npm run dev
  
frontend:
  environment:
    NEXT_PUBLIC_API_URL: https://api.your-domain.com
```

### SSL/HTTPS Setup

Add nginx reverse proxy:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
```

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up -d --build backend
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Frontend
  - "5001:5000"  # Backend
```

### Clear Everything and Start Fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 📝 Notes

- **Data Persistence**: Database data is stored in Docker volumes (`postgres_data`, `pgadmin_data`)
- **Development Mode**: Backend runs with `nodemon` for hot-reload
- **Network**: All services communicate through `agriconnect-network`
- **Health Checks**: Backend waits for database to be healthy before starting

## 🎯 Development vs Production

### Development (Current Setup)
- Hot-reload enabled
- Source code mounted as volumes
- Debug logging enabled
- Running with `npm run dev`

### Production
- Built artifacts only
- No source mounting
- Optimized builds
- Running with `npm start`
- Environment-specific configs

## 🤝 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Ensure ports are not in use: `netstat -ano | findstr "3000 5000 5432 5050"`
4. Rebuild containers: `docker-compose up -d --build`

## ✅ Success Checklist

- [ ] Docker Desktop installed and running
- [ ] Both repositories cloned
- [ ] Frontend Dockerfile created
- [ ] `docker-compose up -d` executed successfully
- [ ] All 4 services showing as "Up" in `docker-compose ps`
- [ ] Can access frontend at http://localhost:3000
- [ ] Can access backend at http://localhost:5000
- [ ] Can access pgAdmin at http://localhost:5050
- [ ] Database tables created successfully

🎉 **Your AgriConnect project is now fully containerized and portable!**
