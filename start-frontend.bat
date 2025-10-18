@echo off
echo Starting Foreign Fits Frontend (Angular)...
echo Frontend will run on: http://localhost:4200
echo Backend API: http://localhost:8080/api
echo Database: H2 Console at http://localhost:8080/api/h2-console
echo.

REM Navigate to frontend directory
cd frontend

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js 16 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies and starting frontend...
echo.

REM Install dependencies
echo Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies. Please check your internet connection.
    pause
    exit /b 1
)
echo.

REM Start the Angular development server
echo Starting Angular development server...
echo.
echo Application Modes:
echo    Management Portal: http://localhost:4200
echo.
echo Demo Accounts (All use password: admin123):
echo    Admin: admin@foreignfits.com / admin123
echo    Sales: sales@foreignfits.com / admin123
echo    Warehouse: warehouse@foreignfits.com / admin123
echo.
echo NOTE: Login simplified for testing - all accounts use password "admin123"
echo.

npm start
pause
