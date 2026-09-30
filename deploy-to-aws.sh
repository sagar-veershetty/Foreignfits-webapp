#!/bin/bash

# AWS S3 Deployment Script for Foreign Fits
# This script builds and deploys the frontend to AWS S3

set -e  # Exit on error

echo "🚀 Foreign Fits - AWS S3 Deployment"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="foreign-fits-web"
AWS_REGION="ap-south-1"
DISTRIBUTION_ID="E2CPBZ3MKNEBOR"
DEPLOY_PROFILE="${AWS_PROFILE:-foreignfits}"

SITE_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
    --profile "$DEPLOY_PROFILE" --query 'Distribution.DomainName' --output text)

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

echo -e "${YELLOW}📦 Step 1: Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

echo -e "${YELLOW}📤 Step 2: Uploading to S3...${NC}"
echo "Bucket: s3://$S3_BUCKET"
echo "Region: $AWS_REGION"
echo ""

# Retain older hashed assets for open browser sessions and rollback.
aws s3 sync dist/foreign-fits-angular/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --profile "$DEPLOY_PROFILE" \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp dist/foreign-fits-angular/index.html s3://$S3_BUCKET/index.html \
    --region $AWS_REGION \
    --profile "$DEPLOY_PROFILE" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Upload successful!${NC}"
echo ""

# Invalidate CloudFront cache if distribution ID is set
if [ "$DISTRIBUTION_ID" != "YOUR_CLOUDFRONT_DIST_ID" ]; then
    echo -e "${YELLOW}🔄 Step 3: Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --profile "$DEPLOY_PROFILE" \
        --paths "/*"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cache invalidation initiated!${NC}"
    else
        echo -e "${YELLOW}⚠️  Cache invalidation failed (may need to wait a few minutes)${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No CloudFront distribution configured - skipping cache invalidation${NC}"
    echo -e "${YELLOW}   (Changes may take a few minutes to appear)${NC}"
fi

echo ""
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo ""
echo "🌐 Your site: https://$SITE_DOMAIN"
echo ""
echo -e "${YELLOW}⚠️  Note: Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R) to see changes${NC}"
echo ""
