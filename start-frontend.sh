#!/bin/bash

echo "🚀 Starting Foreign Fits Frontend (Angular)..."
echo "📍 Frontend will run on: http://localhost:4200"
echo "🔗 Backend API: http://localhost:8080/api"
echo "🗄️  Database: H2 Console at http://localhost:8080/api/h2-console"
echo ""

# Navigate to frontend directory
cd frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    echo "📥 Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "🟢 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8080"
else
    echo "⚠️  Backend not detected on port 8080"
    echo "   Please start the backend first using: ./start-backend.sh"
    echo "   Or run: cd backend && ./mvnw spring-boot:run"
    echo ""
fi

echo "🔄 Installing dependencies and starting frontend..."
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    echo ""
fi

# Start the Angular development server
echo "🌐 Starting Angular development server..."
echo ""
echo "🎯 Application Modes:"
echo "   Management Portal: http://localhost:4200"
echo ""
echo "👥 Demo Accounts (All use password: admin123):"
echo "   Admin: admin@foreignfits.com / admin123"
echo "   Sales: sales@foreignfits.com / admin123"
echo "   Warehouse: warehouse@foreignfits.com / admin123"
echo ""
echo "⚠️  NOTE: Login simplified for testing - all accounts use password \"admin123\""
echo ""

npm start
