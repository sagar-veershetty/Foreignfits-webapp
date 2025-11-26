#!/bin/bash

# AWS S3 + CloudFront Deployment Script for Frontend
# This script builds and deploys the Angular application

echo "=================================="
echo "Foreign Fits Frontend Deployment"
echo "=================================="

# Navigate to frontend directory
cd "$(dirname "$0")"

# Configuration (Update these values)
S3_BUCKET="foreignfits-frontend"
CLOUDFRONT_DIST_ID="YOUR_DISTRIBUTION_ID"
REGION="us-east-1"

echo ""
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📦 Build output location: dist/browser/"
ls -lh dist/browser/

echo ""
echo "=================================="
echo "Deployment Options:"
echo "=================================="
echo ""
echo "Option 1: Deploy to S3 + CloudFront (requires AWS CLI)"
echo "-----------------------------------------------------"
echo "Run these commands:"
echo ""
echo "# Create S3 bucket (first time only)"
echo "aws s3 mb s3://$S3_BUCKET --region $REGION"
echo ""
echo "# Configure bucket for static website hosting"
echo "aws s3 website s3://$S3_BUCKET --index-document index.html --error-document index.html"
echo ""
echo "# Upload files to S3"
echo "aws s3 sync dist/browser/ s3://$S3_BUCKET --delete"
echo ""
echo "# Invalidate CloudFront cache (if using CloudFront)"
echo "aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths '/*'"
echo ""
echo ""
echo "Option 2: Manual Upload via AWS Console"
echo "-----------------------------------------------------"
echo "1. Go to S3 Console"
echo "2. Create bucket: $S3_BUCKET"
echo "3. Enable static website hosting"
echo "4. Upload all files from: dist/browser/"
echo "5. Make files public"
echo "6. Set up CloudFront distribution"
echo ""
