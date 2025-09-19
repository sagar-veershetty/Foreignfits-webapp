# Foreign Fits - Global Fashion Inventory Management

A comprehensive inventory management system for fashion retail with React frontend and Spring Boot backend.

## 🚀 Quick Start Guide

### Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Java 17** - [Download here](https://adoptium.net/)
- **Maven** (v3.6 or higher) - [Download here](https://maven.apache.org/download.cgi)


## 🏃‍♂️ Running the Application

### Method 1: Run Both Services Simultaneously

**Terminal 1 - Start Backend:**
```bash
# Navigate to backend directory
cd backend

# Install dependencies and run
./mvnw spring-boot:run

# Or if you have Maven installed globally
mvn spring-boot:run
```

**Terminal 2 - Start Frontend:**
```bash
# Navigate to project root (where package.json is)
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

### Method 2: Using Scripts (Recommended)

Create these helper scripts in your project root:

**start-backend.sh** (macOS/Linux):
```bash
#!/bin/bash
echo "🚀 Starting Spring Boot Backend..."
cd backend
./mvnw spring-boot:run
```

**start-frontend.sh** (macOS/Linux):
```bash
#!/bin/bash
echo "🚀 Starting React Frontend..."
npm install
npm run dev
```

**start-backend.bat** (Windows):
```batch
@echo off
echo 🚀 Starting Spring Boot Backend...
cd backend
mvnw.cmd spring-boot:run
```

**start-frontend.bat** (Windows):
```batch
@echo off
echo 🚀 Starting React Frontend...
npm install
npm run dev
```

## 🔧 Development Workflow

### 1. First Time Setup
```bash
# Clone/download the project
# Navigate to project directory

# Install frontend dependencies
npm install

# Start MySQL service
# Update database credentials in application.yml if needed

# Start backend (Terminal 1)
cd backend
./mvnw spring-boot:run

# Start frontend (Terminal 2)
cd ..
npm run dev
```

### 2. Daily Development
```bash
# Terminal 1 - Backend
cd backend && ./mvnw spring-boot:run

# Terminal 2 - Frontend  
npm run dev
```

## 🌐 Access URLs

- **Frontend (React):** http://localhost:5173
- **Backend API:** http://localhost:8080/api
- **API Documentation:** http://localhost:8080/api/actuator/health

## 👥 Demo Accounts

The application comes with pre-configured demo accounts:

### Staff Accounts (Management Portal)
- **Admin:** admin@foreignfits.com / admin123
- **Sales:** sales@foreignfits.com / sales123  
- **Warehouse:** warehouse@foreignfits.com / warehouse123

### Customer Account (Shopping Portal)
- **Customer:** customer@example.com / customer123
- **Access:** Add `?mode=customer` to URL

## 🏪 Application Modes

### Management Portal (Default)
- **URL:** http://localhost:5173
- **Features:** Inventory, Sales, Stock Management
- **Users:** Admin, Sales, Warehouse staff

### Customer Shopping Portal
- **URL:** http://localhost:5173?mode=customer
- **Features:** Product catalog, Shopping cart, Orders
- **Users:** Customers

## 🛠️ Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or change port in application.yml
server:
  port: 8081
```

**Database Connection Failed:**
```bash
# Check MySQL is running
brew services list | grep mysql  # macOS
sudo systemctl status mysql     # Linux

# Verify credentials in application.yml
# Check database exists: SHOW DATABASES;
```

**Maven Build Failed:**
```bash
# Clean and rebuild
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or Vite will automatically use next available port
```

**API Connection Failed:**
- Ensure backend is running on port 8080
- Check CORS configuration in SecurityConfig.java
- Verify API_BASE_URL in src/services/api.ts

**Dependencies Issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📊 Database Schema

The application automatically creates these tables:
- `users` - Authentication and user management
- `locations` - Warehouses and stores
- `products` - Product catalog
- `sales` - Sales transactions
- `sale_items` - Individual sale items
- `stock_movements` - Inventory tracking
- `stock_transfers` - Inter-location transfers
- `product_images` - Product image URLs

## 🔄 Development Tips

### Hot Reload
- **Frontend:** Automatic reload on file changes
- **Backend:** Use Spring Boot DevTools for auto-restart

### API Testing
```bash
# Test backend health
curl http://localhost:8080/api/actuator/health

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foreignfits.com","password":"admin123"}'
```

### Database Management
```bash
# Connect to MySQL
mysql -u root -p

# Use the database
USE foreign_fits_db;

# View tables
SHOW TABLES;

# Check sample data
SELECT * FROM products LIMIT 5;
```

## 🚀 Production Deployment

### Backend
```bash
# Build JAR file
cd backend
./mvnw clean package

# Run production JAR
java -jar target/inventory-management-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
# Build for production
npm run build

# Serve static files (dist folder)
```

## 📝 Environment Variables

Create `.env` file in project root for custom configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=foreign_fits_db
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400000

# API
VITE_API_BASE_URL=http://localhost:8080/api
```

## 🎯 Next Steps

1. **Start MySQL** service
2. **Run Backend** in Terminal 1
3. **Run Frontend** in Terminal 2
4. **Access Application** at http://localhost:5173
5. **Login** with demo accounts
6. **Start Managing** your fashion inventory!

---

**Need Help?** Check the troubleshooting section or ensure all prerequisites are installed correctly.