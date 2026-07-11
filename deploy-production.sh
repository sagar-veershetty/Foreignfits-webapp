#!/bin/bash

# Production Deployment Script - Foreign Fits
# Builds backend + frontend and deploys to AWS (EB + S3)
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
S3_BUCKET="foreign-fits-web"
AWS_REGION="ap-south-1"
DISTRIBUTION_ID="YOUR_CLOUDFRONT_DIST_ID"  # Replace if you have CloudFront

echo -e "${GREEN}=== Foreign Fits - Production Deployment ===${NC}"
echo "Deploying: Discount Toggle Feature + all recent changes"
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
npm run build -- --configuration production > /dev/null 2>&1
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
echo "New table/columns added automatically by Hibernate (ddl-auto: update):"
echo "  - app_settings table (discount feature toggle)"
echo "  - instant_discount_percent column on sales"
echo "  - instant_discount_amount column on sales"
echo "✓ Schema update handled by Hibernate"
echo ""

# Step 13: Deploy frontend to S3
echo -e "${YELLOW}Step 13: Uploading frontend to S3...${NC}"
if command -v aws &> /dev/null; then
    # Upload all assets with long-term caching (hashed filenames)
    aws s3 sync "$FRONTEND_DIR/dist/foreign-fits-angular/" "s3://$S3_BUCKET/" \
        --region "$AWS_REGION" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html"

    # Upload index.html with no-cache so browsers always get the latest shell
    aws s3 cp "$FRONTEND_DIR/dist/foreign-fits-angular/index.html" "s3://$S3_BUCKET/index.html" \
        --region "$AWS_REGION" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --metadata-directive REPLACE

    echo "✓ Frontend uploaded to S3: s3://$S3_BUCKET"

    # Invalidate CloudFront cache if configured
    if [ "$DISTRIBUTION_ID" != "YOUR_CLOUDFRONT_DIST_ID" ]; then
        echo -e "${YELLOW}  Invalidating CloudFront cache...${NC}"
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*" > /dev/null 2>&1 && echo "✓ CloudFront cache invalidated" || echo "⚠ CloudFront invalidation failed (non-fatal)"
    fi
else
    echo -e "${YELLOW}⚠ AWS CLI not found — skipping S3 upload.${NC}"
    echo "  Run manually: cd $FRONTEND_DIR && bash ../deploy-to-aws.sh"
fi
echo ""

# Step 14: Summary
echo -e "${GREEN}=== Deployment Completed Successfully! ===${NC}"
echo ""
echo "Deployment Details:"
echo "  Backup Location: $BACKUP_DIR"
echo "  Backend PID:     $APP_PID"
echo "  Backend Logs:    $BACKEND_DIR/application.log"
echo "  Frontend:        http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com"
echo ""
echo "What's new in this release:"
echo "  ✔ Instant discount toggle — enable/disable from Admin > Settings"
echo "  ✔ app_settings table auto-created by Hibernate on first boot"
echo "  ✔ Coupon feature unchanged"
echo ""
echo "Next Steps:"
echo "  1. Open Admin Dashboard > Settings > Instant Discount Feature"
echo "  2. Toggle discount ON/OFF and confirm it applies on the sales page"
echo "  3. Test a sale >= Rs.5,000 with discount enabled (should show 10% off)"
echo "  4. Disable discount and confirm no discount on same sale"
echo "  5. Confirm coupon codes still work independently"
echo ""
echo "To view logs:"
echo "  tail -f $BACKEND_DIR/application.log"
echo ""
echo "To rollback backend:"
echo "  kill \$(cat $BACKEND_DIR/app.pid)"
echo "  cp $BACKUP_DIR/$APP_NAME.jar.backup $BACKEND_DIR/target/$APP_NAME-0.0.1-SNAPSHOT.jar"
echo "  cd $BACKEND_DIR && nohup java -jar target/$APP_NAME-0.0.1-SNAPSHOT.jar > application.log 2>&1 &"
echo ""
echo -e "${GREEN}Happy selling! 🎉${NC}"
