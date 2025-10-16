#!/bin/bash

echo "🚀 Starting AgriConnect Docker Setup..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if frontend directory exists
if [ ! -d "../AgriConnect-frontend" ]; then
    echo "⚠️  Warning: Frontend directory not found at ../AgriConnect-frontend"
    echo "   Please ensure both backend and frontend are in the same parent directory"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Building and starting containers..."
echo ""

# Start services
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ AgriConnect is starting up!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   pgAdmin:   http://localhost:5050"
echo ""
echo "📝 Default Credentials:"
echo "   pgAdmin Email: admin@agriconnect.com"
echo "   pgAdmin Password: admin123"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo "✨ Setup complete!"
