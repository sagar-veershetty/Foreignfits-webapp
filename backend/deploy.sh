#!/bin/bash

# AWS Elastic Beanstalk Deployment Script for Backend
# This script builds and packages the Spring Boot application

echo "=================================="
echo "Foreign Fits Backend Deployment"
echo "=================================="

# Navigate to backend directory
cd "$(dirname "$0")"

echo ""
echo "Step 1: Cleaning previous builds..."
mvn clean

echo ""
echo "Step 2: Running tests..."
mvn test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix the issues before deploying."
    exit 1
fi

echo ""
echo "Step 3: Building JAR file..."
mvn package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📦 JAR file location:"
ls -lh target/*.jar

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="
echo "1. Go to AWS Elastic Beanstalk Console"
echo "2. Create a new application or select existing one"
echo "3. Upload the JAR file from: target/inventory-management-0.0.1-SNAPSHOT.jar"
echo "4. Configure environment variables in Elastic Beanstalk"
echo "5. Deploy and wait for health checks to pass"
echo ""
echo "Or use AWS CLI to deploy:"
echo "  eb init (first time only)"
echo "  eb create foreignfits-backend-prod (first time only)"
echo "  eb deploy"
echo ""
