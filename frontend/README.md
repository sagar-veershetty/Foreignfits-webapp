# Foreign Fits Frontend - Angular Application

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm (comes with Node.js)

### 🏃‍♂️ Running the Frontend

**Option 1: Using npm**
```bash
npm install
npm start
```

**Option 2: Using Angular CLI**
```bash
npm install
ng serve
```

**Option 3: From Project Root**
```bash
# Windows
start-frontend.bat

# Linux/Mac
./start-frontend.sh
```

The frontend will start on **http://localhost:4200**

## 🎯 Application Features

### User Roles
- **Admin** - Full system access
- **Sales** - POS and sales management
- **Warehouse** - Inventory management
- **Customer** - Customer-facing store

### Main Modules
- **Dashboard** - Overview and analytics
- **Inventory** - Product management with barcode scanning
- **Sales/POS** - Point of sale with receipt printing
- **Analytics** - Sales reports and charts
- **Stock Movement** - Track inventory changes
- **Settings** - User and system configuration

## 🛠️ Tech Stack

- **Angular 17** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Lucide Angular** - Icon library
- **JSBarcode** - Barcode generation
- **Quagga** - Barcode scanning

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/      # Reusable components
│   │   │   ├── auth/        # Login, signup, guards
│   │   │   ├── barcode/     # Barcode input
│   │   │   ├── layout/      # Navbar, etc.
│   │   │   └── sales/       # Receipt printer
│   │   ├── core/            # Core services
│   │   │   ├── guards/      # Route guards
│   │   │   ├── interceptors/# HTTP interceptors
│   │   │   ├── models/      # TypeScript interfaces
│   │   │   └── services/    # API services
│   │   ├── pages/           # Page components
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   └── ...
│   │   └── app.routes.ts    # Application routes
│   ├── environments/        # Environment configs
│   └── styles.scss          # Global styles
├── angular.json             # Angular configuration
├── package.json             # Dependencies
└── tailwind.config.js       # Tailwind configuration
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
ng lint
```

## 🌐 API Integration

The frontend connects to the backend API at:
- **Development:** http://localhost:8080/api
- **Production (Docker):** http://backend:8080/api

API configuration is in `src/environments/`

## 🎨 Styling

This project uses **Tailwind CSS** for styling:
- Configuration: `tailwind.config.js`
- Global styles: `src/styles.scss`
- Component styles: Individual `.scss` files

## 🚨 Troubleshooting

**Port 4200 already in use:**
```bash
# Kill process on port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4200 | xargs kill -9
```

**Dependencies issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
# Clear Angular cache
rm -rf .angular
ng serve
```

**Backend connection failed:**
- Ensure backend is running on port 8080
- Check environment configuration
- Verify API endpoints in browser DevTools

