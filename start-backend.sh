#!/bin/bash

echo "🚀 Starting Foreign Fits Backend (Spring Boot)..."
echo "📍 Backend will run on: http://localhost:8080"
echo "📊 API Base URL: http://localhost:8080/api"
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    echo "📥 Download from: https://adoptium.net/"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found. Please ensure MySQL is installed and running."
    echo "📥 Download from: https://dev.mysql.com/downloads/mysql/"
    echo ""
fi

echo "☕ Java version: $(java -version 2>&1 | head -n 1)"
echo "🗄️  Database: H2 In-Memory (foreign_fits_db)"
echo "🔐 Demo Accounts:"
echo "   Admin: admin@foreignfits.com / admin123"
echo "   Sales: sales@foreignfits.com / admin123"
echo "   Warehouse: warehouse@foreignfits.com / admin123"
echo ""
echo "🔄 Starting backend server..."
echo ""
# Navigate to backend directory and start
cd backend

# Check if mvnw exists
if [ ! -f "./mvnw" ]; then
    echo "❌ Maven wrapper not found. Using system Maven..."
    if ! command -v mvn &> /dev/null; then
        echo "❌ Maven is not installed. Please install Maven."
        exit 1
    fi
    mvn spring-boot:run
else
    ./mvnw spring-boot:run
fi