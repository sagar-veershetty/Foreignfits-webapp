# Foreign Fits - Global Fashion Inventory Management

A comprehensive inventory management system for fashion retail with **Angular** frontend and **Spring Boot** backend.

## 📁 Project Structure

```
Foreignfits-webapp/
├── backend/          # Spring Boot API (Java 17, H2 Database)
├── frontend/         # Angular App (Angular 17, TypeScript)
├── docker-compose.yml
└── start scripts (.bat & .sh)
```

> 📖 **Detailed Documentation:**
> - [Backend Documentation](backend/README.md) - API endpoints, database setup, configuration
> - [Frontend Documentation](frontend/README.md) - Angular app structure, development guide

## 🚀 Quick Start

### Prerequisites

**Option 1: Local Development**
- Node.js 16+ and Java 17+
- Maven (included via wrapper)

**Option 2: Docker (Recommended)**
- Docker Desktop only

### ⚡ Fastest Way - Using Start Scripts

**Windows:**
```bash
start-backend.bat   # Terminal 1
start-frontend.bat  # Terminal 2
```

**Linux/Mac:**
```bash
./start-backend.sh   # Terminal 1
./start-frontend.sh  # Terminal 2
```

## 🐳 Docker Deployment

### Start Everything with One Command

```bash
docker-compose up -d
```

### Access the Application
- **Frontend:** http://localhost
- **Backend API:** http://localhost:8080/api
- **H2 Console:** http://localhost:8080/api/h2-console

### Docker Management

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

## 🏃‍♂️ Manual Local Development

### Backend
```bash
cd backend
./mvnw spring-boot:run
# Runs on: http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on: http://localhost:4200
```

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foreignfits.com | admin123 |
| Sales | sales@foreignfits.com | sales123 |
| Warehouse | warehouse@foreignfits.com | warehouse123 |
| Customer | customer@example.com | customer123 |

## 📡 Application URLs

| Environment | Frontend | Backend API | H2 Console |
|-------------|----------|-------------|------------|
| **Local Dev** | http://localhost:4200 | http://localhost:8080/api | http://localhost:8080/api/h2-console |
| **Docker** | http://localhost | http://localhost:8080/api | http://localhost:8080/api/h2-console |

## 🗄️ Database

- **H2 In-Memory Database** - No external database setup needed
- Automatically created on startup with sample data
- Database resets on application restart

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 17, TypeScript, Tailwind CSS |
| **Backend** | Spring Boot 3.5, Spring Security (JWT) |
| **Database** | H2 In-Memory Database |
| **DevOps** | Docker, Docker Compose, Nginx |

## ✨ Features

- 🔐 JWT Authentication & Role-based Access
- 📦 Inventory Management with Barcode Support
- 💰 Point of Sale (POS) System
- 🧾 Receipt Printing
- 📊 Sales Analytics & Reports
- 📱 Barcode Scanning (Camera & Manual)
- 🏪 Multi-location Stock Management
- 👥 User & Role Management

## 🔍 Troubleshooting

**Port conflicts:**
```bash
# Backend (8080) or Frontend (4200) already in use
# Windows: taskkill /F /IM java.exe
# Linux/Mac: lsof -ti:8080 | xargs kill -9
```

**Docker issues:**
```bash
# Clean restart
docker-compose down
docker-compose up -d --build
```

**Dependencies issues:**
```bash
# Frontend
cd frontend && rm -rf node_modules && npm install

# Backend
cd backend && ./mvnw clean install
```

## 📚 Additional Resources

- [Backend API Documentation](backend/README.md) - Detailed API endpoints and configuration
- [Frontend Development Guide](frontend/README.md) - Component structure and development tips
- [Docker Architecture](#-docker-deployment) - Container orchestration details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

**Made with ❤️ for Fashion Retail Management**
