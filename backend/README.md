# Foreign Fits Backend - Spring Boot API

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6+ (or use included wrapper)

### 🗄️ Database Setup

1. **Start MySQL:**
```bash
# macOS with Homebrew
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows - Start MySQL service
```

2. **Create Database (Optional - Auto-created):**
```sql
-- The application will create this automatically
CREATE DATABASE foreign_fits_db;
```

3. **Update Configuration (if needed):**
Edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    username: root  # Your MySQL username
    password: password  # Your MySQL password
```

### 🏃‍♂️ Running the Backend

**Option 1: Using Maven Wrapper (Recommended)**
```bash
./mvnw spring-boot:run
```

**Option 2: Using System Maven**
```bash
mvn spring-boot:run
```

**Option 3: Using Helper Script**
```bash
# From project root
./start-backend.sh
```

### 🌐 API Endpoints

**Base URL:** `http://localhost:8080/api`

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

#### Products
- `GET /products` - Get all products
- `POST /products` - Create product (Admin/Warehouse)
- `PUT /products/{id}` - Update product (Admin/Warehouse)
- `DELETE /products/{id}` - Delete product (Admin only)
- `GET /products/sku/{sku}` - Get by SKU
- `GET /products/barcode/{barcode}` - Get by barcode
- `GET /products/low-stock` - Get low stock items

#### Sales
- `GET /sales` - Get all sales (Admin/Sales)
- `POST /sales` - Create sale (Admin/Sales)
- `GET /sales/today` - Today's sales
- `GET /sales/revenue/today` - Today's revenue

#### Stock Management
- `GET /stock/movements` - Get stock movements
- `POST /stock/adjust` - Adjust stock levels
- `GET /stock/movements/product/{id}` - Product movements

### 👥 Demo Accounts

The application comes with pre-configured demo accounts:

```
Admin: admin@foreignfits.com / admin123
Sales: sales@foreignfits.com / sales123
Warehouse: warehouse@foreignfits.com / warehouse123
```

### 🔧 Configuration

**Database Configuration:**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/foreign_fits_db?createDatabaseIfNotExist=true
    username: root
    password: password
```

**JWT Configuration:**
```yaml
jwt:
  secret: foreignFitsSecretKeyForJWTTokenGeneration2024
  expiration: 86400000 # 24 hours
```

### 📊 Database Schema

The application automatically creates these tables:
- `users` - User authentication and roles
- `locations` - Warehouses and stores
- `products` - Product catalog with images
- `sales` - Sales transactions
- `sale_items` - Individual sale line items
- `stock_movements` - Inventory change tracking
- `stock_transfers` - Inter-location transfers
- `product_images` - Product image URLs

### 🛠️ Development

**Hot Reload:**
The application uses Spring Boot DevTools for automatic restart on code changes.

**Database Reset:**
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS foreign_fits_db; CREATE DATABASE foreign_fits_db;"
./mvnw spring-boot:run
```

**Logs:**
```bash
# View application logs
tail -f logs/application.log

# Or check console output
```

### 🔍 Health Check

**Check if backend is running:**
```bash
curl http://localhost:8080/api/actuator/health
```

**Test login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foreignfits.com","password":"admin123"}'
```

### 🚨 Troubleshooting

**Port 8080 in use:**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

**Database connection failed:**
- Ensure MySQL is running
- Check credentials in application.yml
- Verify database exists

**Compilation errors:**
```bash
./mvnw clean compile
./mvnw spring-boot:run
```

### 🏗️ Project Structure

```
backend/
├── src/main/java/com/foreignfits/
│   ├── entity/          # JPA entities
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   ├── controller/      # REST controllers
│   ├── dto/            # Data transfer objects
│   ├── security/       # JWT & security config
│   └── config/         # Spring configuration
├── src/main/resources/
│   ├── application.yml # Configuration
│   └── data.sql       # Sample data
└── pom.xml            # Maven dependencies
```

The backend is production-ready with proper security, validation, and error handling!