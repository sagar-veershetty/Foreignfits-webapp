# Foreign Fits Backend - Spring Boot API

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Maven (included via wrapper)

### 🏃‍♂️ Running the Backend

**Option 1: Using Maven Wrapper (Recommended)**
```bash
./mvnw spring-boot:run
```

**Option 2: From Project Root**
```bash
# Windows
start-backend.bat

# Linux/Mac
./start-backend.sh
```

The backend will start on **http://localhost:8080**

## 🗄️ Database

This application uses **H2 in-memory database** - no external database setup required!

- Database is automatically created on startup
- Sample data is loaded from `data.sql`
- H2 Console: http://localhost:8080/api/h2-console

**H2 Console Login:**
- JDBC URL: `jdbc:h2:mem:foreignfits`
- Username: `sa`
- Password: (leave empty)

## 🌐 API Endpoints

**Base URL:** `http://localhost:8080/api`

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user info

### Products
- `GET /products` - Get all products
- `POST /products` - Create product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `GET /products/sku/{sku}` - Get by SKU
- `GET /products/barcode/{barcode}` - Get by barcode
- `GET /products/low-stock` - Get low stock items

### Sales
- `GET /sales` - Get all sales
- `POST /sales` - Create sale
- `GET /sales/today` - Today's sales
- `GET /sales/revenue/today` - Today's revenue

### Stock Management
- `GET /stock/movements` - Get stock movements
- `POST /stock/adjust` - Adjust stock levels
- `GET /stock/movements/product/{id}` - Get product movements

## 👥 Demo Accounts

Pre-configured test accounts:

- **Admin:** admin@foreignfits.com / admin123
- **Sales:** sales@foreignfits.com / sales123
- **Warehouse:** warehouse@foreignfits.com / warehouse123
- **Customer:** customer@example.com / customer123

## 🔧 Configuration

Configuration file: `src/main/resources/application.yml`

**Key Settings:**
- Port: `8080`
- Context Path: `/api`
- Database: H2 in-memory
- JWT Secret: Configured for authentication
- JWT Expiration: 24 hours

## 🔍 Health Check

Check if backend is running:
```bash
curl http://localhost:8080/api/actuator/health
```

Test login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foreignfits.com","password":"admin123"}'
```

## 🏗️ Project Structure

```
backend/
├── src/main/java/com/foreignfits/
│   ├── entity/          # JPA entities
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   ├── controller/      # REST API endpoints
│   ├── dto/            # Data transfer objects
│   ├── security/       # JWT & Spring Security
│   └── config/         # Configuration classes
├── src/main/resources/
│   ├── application.yml # App configuration
│   └── data.sql       # Sample data
└── pom.xml            # Maven dependencies
```

## 🚨 Troubleshooting

**Port 8080 already in use:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**Compilation errors:**
```bash
./mvnw clean compile
./mvnw spring-boot:run
```

**Data not loading:**
- Check `data.sql` file exists
- Review application logs for SQL errors
- Database is recreated on each restart (in-memory)
