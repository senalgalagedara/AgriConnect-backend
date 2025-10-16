@echo off
echo 🚀 Starting AgriConnect Docker Setup...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if frontend directory exists
if not exist "..\AgriConnect-frontend\" (
    echo ⚠️  Warning: Frontend directory not found at ..\AgriConnect-frontend
    echo    Please ensure both backend and frontend are in the same parent directory
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

echo 📦 Building and starting containers...
echo.

REM Start services
docker-compose up -d --build

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 📊 Service Status:
docker-compose ps

echo.
echo ✅ AgriConnect is starting up!
echo.
echo 🌐 Access your application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:5000
echo    pgAdmin:   http://localhost:5050
echo.
echo 📝 Default Credentials:
echo    pgAdmin Email: admin@agriconnect.com
echo    pgAdmin Password: admin123
echo.
echo 📋 Useful commands:
echo    View logs:     docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart:       docker-compose restart
echo.
echo ✨ Setup complete!
echo.
pause
