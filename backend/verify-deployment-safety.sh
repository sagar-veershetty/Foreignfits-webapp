#!/bin/bash

# Pre-Deployment Verification Script for Elastic Beanstalk
# This script checks that your configuration is safe for deployment

set -e

APP_NAME="Foreign-fits"
ENV_NAME="Foreign-fits-env"
REGION="ap-south-1"

echo "🔍 Pre-Deployment Safety Check"
echo "================================"
echo ""

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi
echo "✅ AWS CLI installed"

# Check if JAR exists
JAR_FILE="target/inventory-management-0.0.1-SNAPSHOT.jar"
if [ -f "$JAR_FILE" ]; then
    JAR_SIZE=$(du -h "$JAR_FILE" | cut -f1)
    echo "✅ JAR file found: $JAR_FILE ($JAR_SIZE)"
else
    echo "❌ JAR file not found. Run './mvnw clean package -DskipTests' first"
    exit 1
fi
echo ""

# Check EB environment status
echo "📊 Checking Elastic Beanstalk Environment..."
ENV_INFO=$(aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" \
    --query 'Environments[0].{Status:Status,Health:Health,HealthStatus:HealthStatus,CNAME:CNAME}' \
    --output json 2>/dev/null || echo "{}")

if [ "$ENV_INFO" == "{}" ]; then
    echo "❌ Environment '$ENV_NAME' not found"
    exit 1
fi

STATUS=$(echo "$ENV_INFO" | jq -r '.Status // "Unknown"')
HEALTH=$(echo "$ENV_INFO" | jq -r '.Health // "Unknown"')
CNAME=$(echo "$ENV_INFO" | jq -r '.CNAME // "Unknown"')

echo "   Status: $STATUS"
echo "   Health: $HEALTH"
echo "   URL: http://$CNAME"

if [ "$STATUS" != "Ready" ]; then
    echo "⚠️  Warning: Environment is not Ready (Status: $STATUS)"
    echo "   Consider waiting for environment to be Ready before deploying"
fi
echo ""

# Check critical environment variables
echo "🔐 Checking Database Configuration..."
ENV_VARS=$(aws elasticbeanstalk describe-configuration-settings \
    --application-name "$APP_NAME" \
    --environment-name "$ENV_NAME" \
    --region "$REGION" \
    --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`].{Key:OptionName,Value:Value}' \
    --output json)

# Extract specific variables
DATABASE_URL=$(echo "$ENV_VARS" | jq -r '.[] | select(.Key=="DATABASE_URL") | .Value // "NOT_SET"')
DATABASE_DRIVER=$(echo "$ENV_VARS" | jq -r '.[] | select(.Key=="DATABASE_DRIVER") | .Value // "NOT_SET"')
DDL_AUTO=$(echo "$ENV_VARS" | jq -r '.[] | select(.Key=="DDL_AUTO") | .Value // "update"')

echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "   DATABASE_DRIVER: $DATABASE_DRIVER"
echo "   DDL_AUTO: $DDL_AUTO"
echo ""

# Validate DATABASE_URL
if [[ "$DATABASE_URL" == *"rds.amazonaws.com"* ]]; then
    echo "✅ Using RDS PostgreSQL (data is persistent)"
elif [[ "$DATABASE_URL" == *"h2:file"* ]]; then
    echo "⚠️  WARNING: Using H2 file-based database"
    echo "   Data may be lost on deployment!"
    echo "   Consider migrating to RDS PostgreSQL"
else
    echo "⚠️  WARNING: Unknown database type"
fi
echo ""

# Validate DDL_AUTO
if [ "$DDL_AUTO" == "update" ]; then
    echo "✅ DDL_AUTO is 'update' (safe - creates new tables without dropping)"
elif [ "$DDL_AUTO" == "create" ] || [ "$DDL_AUTO" == "create-drop" ]; then
    echo "❌ DANGER: DDL_AUTO is '$DDL_AUTO'"
    echo "   This will DROP all tables and LOSE ALL DATA!"
    echo "   Change to 'update' before deploying:"
    echo ""
    echo "   aws elasticbeanstalk update-environment \\"
    echo "     --environment-name $ENV_NAME \\"
    echo "     --region $REGION \\"
    echo "     --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=DDL_AUTO,Value=update"
    echo ""
    exit 1
else
    echo "⚠️  DDL_AUTO is '$DDL_AUTO' (not explicitly set, defaults to 'update')"
fi
echo ""

# Check RDS backup configuration (if using RDS)
if [[ "$DATABASE_URL" == *"rds.amazonaws.com"* ]]; then
    echo "💾 Checking RDS Backup Configuration..."
    
    # Extract RDS instance identifier from URL
    RDS_INSTANCE=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^.]*\)\..*/\1/p')
    
    if [ ! -z "$RDS_INSTANCE" ]; then
        RDS_INFO=$(aws rds describe-db-instances \
            --db-instance-identifier "$RDS_INSTANCE" \
            --region "$REGION" \
            --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,MultiAZ:MultiAZ,StorageEncrypted:StorageEncrypted}' \
            --output json 2>/dev/null || echo "{}")
        
        if [ "$RDS_INFO" != "{}" ]; then
            BACKUP_RETENTION=$(echo "$RDS_INFO" | jq -r '.BackupRetention // 0')
            MULTI_AZ=$(echo "$RDS_INFO" | jq -r '.MultiAZ // false')
            ENCRYPTED=$(echo "$RDS_INFO" | jq -r '.StorageEncrypted // false')
            
            echo "   RDS Instance: $RDS_INSTANCE"
            echo "   Backup Retention: $BACKUP_RETENTION days"
            echo "   Multi-AZ: $MULTI_AZ"
            echo "   Encrypted: $ENCRYPTED"
            echo ""
            
            if [ "$BACKUP_RETENTION" -ge 7 ]; then
                echo "✅ Backups enabled ($BACKUP_RETENTION days retention)"
            else
                echo "⚠️  Backup retention is only $BACKUP_RETENTION days"
                echo "   Recommend setting to at least 7 days"
            fi
        fi
    fi
fi
echo ""

# List recent application versions
echo "📦 Recent Application Versions:"
aws elasticbeanstalk describe-application-versions \
    --application-name "$APP_NAME" \
    --region "$REGION" \
    --query 'ApplicationVersions[0:3].{Version:VersionLabel,Created:DateCreated,Status:Status}' \
    --output table
echo ""

# Get current version
CURRENT_VERSION=$(aws elasticbeanstalk describe-environments \
    --environment-names "$ENV_NAME" \
    --region "$REGION" \
    --query 'Environments[0].VersionLabel' \
    --output text)

echo "📌 Current Version: $CURRENT_VERSION"
echo ""

# Final safety summary
echo "================================"
echo "🎯 Deployment Safety Summary"
echo "================================"
echo ""

SAFE_TO_DEPLOY=true

if [[ "$DATABASE_URL" != *"rds.amazonaws.com"* ]]; then
    echo "⚠️  Not using RDS PostgreSQL - data may be lost"
    SAFE_TO_DEPLOY=false
fi

if [ "$DDL_AUTO" == "create" ] || [ "$DDL_AUTO" == "create-drop" ]; then
    echo "❌ DDL_AUTO will drop tables - DO NOT DEPLOY"
    SAFE_TO_DEPLOY=false
fi

if [ "$STATUS" != "Ready" ]; then
    echo "⚠️  Environment not Ready - consider waiting"
fi

echo ""
if [ "$SAFE_TO_DEPLOY" = true ]; then
    echo "✅ SAFE TO DEPLOY"
    echo ""
    echo "Your data will be preserved because:"
    echo "  • Using external RDS database"
    echo "  • DDL mode is 'update' (creates tables, doesn't drop)"
    echo "  • New tables will be added without affecting existing data"
    echo ""
    echo "To deploy, run:"
    echo "  ./eb-deploy.sh"
    echo ""
    echo "Or manually:"
    echo "  VERSION_LABEL=\"v\$(date +%Y%m%d-%H%M%S)\""
    echo "  aws elasticbeanstalk update-environment \\"
    echo "    --environment-name $ENV_NAME \\"
    echo "    --version-label \$VERSION_LABEL \\"
    echo "    --region $REGION"
else
    echo "❌ NOT SAFE TO DEPLOY"
    echo ""
    echo "Fix the issues above before deploying!"
    exit 1
fi

echo ""
echo "Monitor deployment:"
echo "  watch -n 5 'aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION --query \"Environments[0].{Status:Status,Health:Health}\"'"
echo ""
echo "Application URL:"
echo "  http://$CNAME"
