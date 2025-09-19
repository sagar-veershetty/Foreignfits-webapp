@echo off
echo 🚀 Starting Foreign Fits Frontend (React + Vite)...
echo 📍 Frontend will run on: http://localhost:5173
echo 🔗 Backend API: http://localhost:8080/api
echo 🗄️  Database: H2 Console at http://localhost:8080/api/h2-console
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo 🟢 Node.js version:
node -v
echo 📦 npm version:
npm -v
echo.

echo 🔍 Checking if backend is running...
curl -s http://localhost:8080/api/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running on port 8080
) else (
    echo ⚠️  Backend not detected on port 8080
    echo    Please start the backend first using: start-backend.bat
    echo    Or run: cd backend ^&^& mvnw.cmd spring-boot:run
    echo.
)

echo 🔄 Installing dependencies and starting frontend...
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    npm install
    echo.
)

REM Start the development server
echo 🌐 Starting Vite development server...
echo.
echo 🎯 Application Modes:
echo    Management Portal: http://localhost:5173
echo    Customer Store: http://localhost:5173?mode=customer
echo.
echo 👥 Demo Accounts:
echo    Admin: admin@foreignfits.com / admin123
echo    Sales: sales@foreignfits.com / sales123
echo    Warehouse: warehouse@foreignfits.com / warehouse123
echo    Customer: customer@example.com / customer123
echo.

npm run dev
pause