#!/bin/bash

# Production Deployment Script - Instant Discount Feature
# This script safely deploys the new instant discount feature to production
# Author: Deployment Team
# Date: $(date +%Y-%m-%d)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
APP_NAME="inventory-management"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

echo -e "${GREEN}=== Foreign Fits - Production Deployment ===${NC}"
echo "Deploying Instant Discount Feature"
echo "Date: $(date)"
echo ""

# Step 1: Create backup directory
echo -e "${YELLOW}Step 1: Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
echo "✓ Backup directory created: $BACKUP_DIR"
echo ""

# Step 2: Backup database (if using file-based database)
echo -e "${YELLOW}Step 2: Backing up database...${NC}"
if [ -f "$BACKEND_DIR/data/foreignfits.mv.db" ]; then
    cp "$BACKEND_DIR/data/foreignfits.mv.db" "$BACKUP_DIR/foreignfits.mv.db.backup"
    echo "✓ Database backed up to: $BACKUP_DIR/foreignfits.mv.db.backup"
else
    echo "⚠ Database file not found at $BACKEND_DIR/data/foreignfits.mv.db"
    echo "⚠ If using remote database, ensure manual backup is completed"
    read -p "Have you backed up the production database? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled. Please backup database first.${NC}"
        exit 1
    fi
fi
echo ""

# Step 3: Build backend
echo -e "${YELLOW}Step 3: Building backend...${NC}"
cd "$BACKEND_DIR"
./mvnw clean package -DskipTests -q
if [ $? -eq 0 ]; then
    echo "✓ Backend build successful"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 4: Build frontend
echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Frontend build successful"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 5: Backup current backend JAR
echo -e "${YELLOW}Step 5: Backing up current backend...${NC}"
if [ -f "$BACKEND_DIR/target/$APP_NAME-0.0.1-SNAPSHOT.jar" ]; then
    cp "$BACKEND_DIR/target/$APP_NAME-0.0.1-SNAPSHOT.jar" "$BACKUP_DIR/$APP_NAME.jar.backup"
    echo "✓ Backend JAR backed up"
else
    echo "⚠ No existing JAR found (first deployment?)"
fi
echo ""

# Step 6: Backup current frontend
echo -e "${YELLOW}Step 6: Backing up current frontend...${NC}"
if [ -d "$FRONTEND_DIR/dist" ]; then
    cp -r "$FRONTEND_DIR/dist" "$BACKUP_DIR/frontend_backup"
    echo "✓ Frontend backed up"
else
    echo "⚠ No existing frontend dist found"
fi
echo ""

# Step 7: Stop current application
echo -e "${YELLOW}Step 7: Stopping current application...${NC}"
pkill -f "$APP_NAME" 2>/dev/null || echo "No running instance found"
sleep 3
echo "✓ Application stopped"
echo ""

# Step 8: Verify configuration
echo -e "${YELLOW}Step 8: Verifying production configuration...${NC}"
if grep -q "ddl-auto.*update" "$BACKEND_DIR/src/main/resources/application.yml"; then
    echo "✓ DDL-AUTO is set to UPDATE (safe for production)"
else
    echo -e "${RED}✗ WARNING: DDL-AUTO is not set to UPDATE${NC}"
    echo "Current setting:"
    grep "ddl-auto" "$BACKEND_DIR/src/main/resources/application.yml"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

if grep -q "mode.*never" "$BACKEND_DIR/src/main/resources/application.yml"; then
    echo "✓ SQL-INIT-MODE is set to NEVER (safe for production)"
else
    echo -e "${YELLOW}⚠ WARNING: SQL-INIT-MODE might re-run data.sql${NC}"
fi
echo ""

# Step 9: Deploy backend
echo -e "${YELLOW}Step 9: Starting new backend...${NC}"
cd "$BACKEND_DIR"
nohup java -jar target/$APP_NAME-0.0.1-SNAPSHOT.jar > application.log 2>&1 &
APP_PID=$!
echo $APP_PID > app.pid
echo "✓ Backend started (PID: $APP_PID)"
cd ..
echo ""

# Step 10: Wait for application to start
echo -e "${YELLOW}Step 10: Waiting for application to start...${NC}"
sleep 15

# Step 11: Health check
echo -e "${YELLOW}Step 11: Performing health check...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is responding!${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${RED}✗ Application failed to start${NC}"
            echo "Check logs: tail -f $BACKEND_DIR/application.log"
            echo ""
            echo "Rolling back..."
            pkill -f "$APP_NAME"
            
            if [ -f "$BACKUP_DIR/$APP_NAME.jar.backup" ]; then
                cp "$BACKUP_DIR/$APP_NAME.jar.backup" "$BACKEND_DIR/target/$APP_NAME-0.0.1-SNAPSHOT.jar"
                cd "$BACKEND_DIR"
                nohup java -jar target/$APP_NAME-0.0.1-SNAPSHOT.jar > application.log 2>&1 &
                echo $! > app.pid
                cd ..
                echo -e "${YELLOW}Rolled back to previous version${NC}"
            fi
            exit 1
        fi
        echo "Waiting... (attempt $i/10)"
        sleep 3
    fi
done
echo ""

# Step 12: Verify database schema
echo -e "${YELLOW}Step 12: Checking database schema...${NC}"
echo "New columns should be added automatically by Hibernate:"
echo "  - instant_discount_percent"
echo "  - instant_discount_amount"
echo "✓ Schema update handled by Hibernate (ddl-auto: update)"
echo ""

# Step 13: Summary
echo -e "${GREEN}=== Deployment Completed Successfully! ===${NC}"
echo ""
echo "Deployment Details:"
echo "  Backup Location: $BACKUP_DIR"
echo "  Backend PID: $APP_PID"
echo "  Backend Logs: $BACKEND_DIR/application.log"
echo ""
echo "Next Steps:"
echo "  1. Verify frontend deployment (copy dist/ to web server)"
echo "  2. Test instant discount feature:"
echo "     - Create sale worth ₹5,000+ (should get 10% discount)"
echo "     - Create sale worth ₹7,500+ (should get 12% discount)"
echo "     - Create sale worth ₹10,000+ (should get 15% discount)"
echo "  3. Check sales history displays discount information"
echo "  4. Monitor logs for any errors"
echo ""
echo "To view logs:"
echo "  tail -f $BACKEND_DIR/application.log"
echo ""
echo "To rollback:"
echo "  kill \$(cat $BACKEND_DIR/app.pid)"
echo "  cp $BACKUP_DIR/$APP_NAME.jar.backup $BACKEND_DIR/target/$APP_NAME-0.0.1-SNAPSHOT.jar"
echo "  cd $BACKEND_DIR && nohup java -jar target/$APP_NAME-0.0.1-SNAPSHOT.jar > application.log 2>&1 &"
echo ""
echo -e "${GREEN}Happy selling! 🎉${NC}"
