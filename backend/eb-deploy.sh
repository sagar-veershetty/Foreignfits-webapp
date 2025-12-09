#!/bin/bash

# Deployment script for AWS Elastic Beanstalk
# This script uploads the JAR file and deploys to the specified environment

set -e

# Configuration
APP_NAME="Foreign-fits"
ENV_NAME="Foreign-fits-env"
REGION="ap-south-1"
JAR_FILE="target/inventory-management-0.0.1-SNAPSHOT.jar"
VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting deployment to Elastic Beanstalk..."
echo "Application: $APP_NAME"
echo "Environment: $ENV_NAME"
echo "Version: $VERSION_LABEL"
echo ""

# Check if JAR exists
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ Error: JAR file not found at $JAR_FILE"
    echo "Please run 'mvn clean package' first"
    exit 1
fi

echo "✅ JAR file found: $JAR_FILE"
echo ""

# Upload to S3
echo "📦 Uploading JAR to S3..."
S3_BUCKET=$(aws elasticbeanstalk describe-application-versions \
    --application-name "$APP_NAME" \
    --region "$REGION" \
    --query 'ApplicationVersions[0].SourceBundle.S3Bucket' \
    --output text 2>/dev/null || echo "")

if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" == "None" ]; then
    # Get default bucket
    S3_BUCKET="elasticbeanstalk-$REGION-$(aws sts get-caller-identity --query Account --output text)"
    echo "Using default bucket: $S3_BUCKET"
fi

S3_KEY="$APP_NAME/$VERSION_LABEL.jar"

aws s3 cp "$JAR_FILE" "s3://$S3_BUCKET/$S3_KEY" --region "$REGION"

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload JAR to S3"
    exit 1
fi

echo "✅ JAR uploaded to S3: s3://$S3_BUCKET/$S3_KEY"
echo ""

# Create application version
echo "📝 Creating application version..."
aws elasticbeanstalk create-application-version \
    --application-name "$APP_NAME" \
    --version-label "$VERSION_LABEL" \
    --source-bundle S3Bucket="$S3_BUCKET",S3Key="$S3_KEY" \
    --region "$REGION" \
    --description "Deployed on $(date)"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create application version"
    exit 1
fi

echo "✅ Application version created: $VERSION_LABEL"
echo ""

# Deploy to environment
echo "🔄 Deploying to environment $ENV_NAME..."
aws elasticbeanstalk update-environment \
    --environment-name "$ENV_NAME" \
    --version-label "$VERSION_LABEL" \
    --region "$REGION"

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy to environment"
    exit 1
fi

echo ""
echo "✅ Deployment initiated successfully!"
echo ""
echo "📊 Monitor deployment status:"
echo "   aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION"
echo ""
echo "🌐 Your application will be available at:"
echo "   http://foreign-fits-env.eba-ketahdmd.ap-south-1.elasticbeanstalk.com"
echo ""
echo "⏱️  Deployment typically takes 3-5 minutes"
echo "   You can check the status in the AWS Console:"
echo "   https://ap-south-1.console.aws.amazon.com/elasticbeanstalk/home?region=ap-south-1#/environment/dashboard?environmentId=$ENV_NAME"
