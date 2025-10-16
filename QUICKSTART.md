# 🎯 Quick Start Guide - Docker Setup

## For the Person Receiving This Project

### What You Need
1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop/
2. **The Project Files** - Get from GitHub or ZIP file

### Step-by-Step Setup (5 minutes)

#### Windows Users:
```cmd
1. Install Docker Desktop
2. Extract/Clone the project
3. Open PowerShell in AgriConnect-backend folder
4. Run: .\start-docker.bat
5. Wait for "Setup complete!"
6. Open browser: http://localhost:3000
```

#### Mac/Linux Users:
```bash
1. Install Docker Desktop
2. Extract/Clone the project
3. Open Terminal in AgriConnect-backend folder
4. Run: chmod +x start-docker.sh && ./start-docker.sh
5. Wait for "Setup complete!"
6. Open browser: http://localhost:3000
```

### Manual Setup (if script doesn't work)

```bash
cd AgriConnect-backend
docker-compose up -d
```

Wait 1-2 minutes, then open http://localhost:3000

### Stopping the Application

```bash
docker-compose down
```

### Accessing the Database

1. Open http://localhost:5050
2. Login:
   - Email: `admin@agriconnect.com`  
   - Password: `admin123`
3. Add Server:
   - Name: `AgriConnect`
   - Host: `postgres`
   - Port: `5432`
   - Database: `agriconnect_db`
   - Username: `postgres`
   - Password: `postgres`

### Common Issues

**"Docker is not running"**
→ Start Docker Desktop application

**"Port 3000/5000 already in use"**
→ Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
  - "5001:5000"  # Change 5000 to 5001
```

**"Services not starting"**
→ Check logs:
```bash
docker-compose logs -f
```

**"Database connection error"**
→ Restart everything:
```bash
docker-compose down
docker-compose up -d
```

### URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | (Your app login) |
| Backend API | http://localhost:5000 | - |
| pgAdmin | http://localhost:5050 | admin@agriconnect.com / admin123 |
| Database | localhost:5432 | postgres / postgres |

### That's It! 🎉

Your entire application (frontend, backend, database, and database management tool) is now running in Docker containers and can be moved to any computer with Docker installed.

### Sharing with Others

Just share:
1. The GitHub repository link, OR
2. ZIP file of the project

They follow the same steps above!
