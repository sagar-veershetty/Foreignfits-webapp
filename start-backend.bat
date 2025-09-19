@echo off
echo 🚀 Starting Foreign Fits Backend (Spring Boot)...
echo 📍 Backend will run on: http://localhost:8080
echo 📊 API Base URL: http://localhost:8080/api
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java is not installed. Please install Java 17 or higher.
    echo 📥 Download from: https://adoptium.net/
    pause
    exit /b 1
)

echo ☕ Java version:
java -version 2>&1 | findstr "version"
echo 🗄️  Database: H2 In-Memory (foreign_fits_db)
echo 🔐 Demo Accounts:
echo    Admin: admin@foreignfits.com / admin123
echo    Sales: sales@foreignfits.com / sales123
echo    Warehouse: warehouse@foreignfits.com / warehouse123
echo.
echo 🔄 Starting backend server...
echo.

REM Navigate to backend directory and start
cd backend

REM Check if mvnw.cmd exists
if exist "mvnw.cmd" (
    mvnw.cmd spring-boot:run
) else (
    echo ❌ Maven wrapper not found. Using system Maven...
    mvn spring-boot:run
)

pause