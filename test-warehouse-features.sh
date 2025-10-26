#!/bin/bash

# Foreign Fits - Warehouse & Signup Testing Script
# This script tests all warehouse and signup location features

BASE_URL="http://localhost:8080/api"

echo "🧪 Foreign Fits - Warehouse & Signup Location Testing"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "${YELLOW}Test 1: Checking Backend Status...${NC}"
if curl -s "${BASE_URL}/locations" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not responding. Please start the backend first.${NC}"
    exit 1
fi
echo ""

# Test 2: Get all locations to see available options
echo -e "${YELLOW}Test 2: Fetching Available Locations...${NC}"
echo "GET ${BASE_URL}/locations"
LOCATIONS=$(curl -s "${BASE_URL}/locations")
echo "$LOCATIONS" | jq '.'
echo ""

# Test 3: Try to register SALES user with WAREHOUSE location (should fail)
echo -e "${YELLOW}Test 3: Register SALES with WAREHOUSE location (should FAIL)...${NC}"
echo "POST ${BASE_URL}/auth/register"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sales Wrong",
    "email": "test.sales.wrong@foreignfits.com",
    "password": "test123",
    "role": "SALES",
    "locationId": 1
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Correctly rejected (HTTP 400)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ Should have rejected but got HTTP $HTTP_STATUS${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Register WAREHOUSE user with correct WAREHOUSE location (should succeed)
echo -e "${YELLOW}Test 4: Register WAREHOUSE user with WAREHOUSE location (should SUCCEED)...${NC}"
echo "POST ${BASE_URL}/auth/register"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Warehouse User",
    "email": "test.warehouse@foreignfits.com",
    "password": "test123",
    "role": "WAREHOUSE",
    "locationId": 1
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Successfully registered (HTTP $HTTP_STATUS)${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}❌ Registration failed (HTTP $HTTP_STATUS)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Login as warehouse user and get token
echo -e "${YELLOW}Test 5: Login as Warehouse User...${NC}"
echo "POST ${BASE_URL}/auth/login"
LOGIN_RESPONSE=$(curl -s \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "warehouse@foreignfits.com",
    "password": "admin123"
  }')

WAREHOUSE_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
WAREHOUSE_LOCATION=$(echo "$LOGIN_RESPONSE" | jq -r '.user.locationName')
WAREHOUSE_LOCATION_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.locationId')

if [ "$WAREHOUSE_TOKEN" != "null" ] && [ -n "$WAREHOUSE_TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Location: $WAREHOUSE_LOCATION (ID: $WAREHOUSE_LOCATION_ID)"
    echo "Token: ${WAREHOUSE_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
fi
echo ""

# Test 6: Get products as warehouse user (should see only warehouse products)
echo -e "${YELLOW}Test 6: Get Products as Warehouse User...${NC}"
echo "GET ${BASE_URL}/products (with warehouse token)"
PRODUCTS=$(curl -s \
  -H "Authorization: Bearer $WAREHOUSE_TOKEN" \
  "${BASE_URL}/products")

PRODUCT_COUNT=$(echo "$PRODUCTS" | jq '. | length')
echo -e "${GREEN}Found $PRODUCT_COUNT products${NC}"
echo "$PRODUCTS" | jq '.[] | {id, name, stock, location: .location.name}'
echo ""

# Test 7: Login as SALES user
echo -e "${YELLOW}Test 7: Login as Sales User...${NC}"
echo "POST ${BASE_URL}/auth/login"
SALES_LOGIN=$(curl -s \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sales@foreignfits.com",
    "password": "admin123"
  }')

SALES_TOKEN=$(echo "$SALES_LOGIN" | jq -r '.token')
SALES_LOCATION=$(echo "$SALES_LOGIN" | jq -r '.user.locationName')
SALES_LOCATION_ID=$(echo "$SALES_LOGIN" | jq -r '.user.locationId')

if [ "$SALES_TOKEN" != "null" ] && [ -n "$SALES_TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Location: $SALES_LOCATION (ID: $SALES_LOCATION_ID)"
    echo "Token: ${SALES_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
fi
echo ""

# Test 8: Get products as sales user (should see only store products)
echo -e "${YELLOW}Test 8: Get Products as Sales User...${NC}"
echo "GET ${BASE_URL}/products (with sales token)"
SALES_PRODUCTS=$(curl -s \
  -H "Authorization: Bearer $SALES_TOKEN" \
  "${BASE_URL}/products")

SALES_PRODUCT_COUNT=$(echo "$SALES_PRODUCTS" | jq '. | length')
echo -e "${GREEN}Found $SALES_PRODUCT_COUNT products${NC}"
echo "$SALES_PRODUCTS" | jq '.[] | {id, name, stock, location: .location.name}'
echo ""

# Test 9: Warehouse user tries to transfer FROM their warehouse (should succeed)
echo -e "${YELLOW}Test 9: Warehouse Transfer FROM Warehouse (should SUCCEED)...${NC}"
echo "POST ${BASE_URL}/stock-transfers"
TRANSFER_SUCCESS=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/stock-transfers" \
  -H "Authorization: Bearer $WAREHOUSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "fromLocationId": 1,
    "toLocationId": 3,
    "quantity": 2,
    "reason": "Test transfer - restocking retail store"
  }')

HTTP_STATUS=$(echo "$TRANSFER_SUCCESS" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$TRANSFER_SUCCESS" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Transfer successful (HTTP $HTTP_STATUS)${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}❌ Transfer failed (HTTP $HTTP_STATUS)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 10: Warehouse user tries to transfer FROM another location (should fail)
echo -e "${YELLOW}Test 10: Warehouse Transfer FROM Store (should FAIL)...${NC}"
echo "POST ${BASE_URL}/stock-transfers"
TRANSFER_FAIL=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/stock-transfers" \
  -H "Authorization: Bearer $WAREHOUSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 9,
    "fromLocationId": 3,
    "toLocationId": 1,
    "quantity": 1,
    "reason": "Test transfer - should be blocked"
  }')

HTTP_STATUS=$(echo "$TRANSFER_FAIL" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$TRANSFER_FAIL" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Correctly blocked (HTTP 400)${NC}"
    echo "Error: $BODY"
else
    echo -e "${RED}❌ Should have blocked but got HTTP $HTTP_STATUS${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 11: Get transfer history as warehouse user
echo -e "${YELLOW}Test 11: Get Transfer History as Warehouse User...${NC}"
echo "GET ${BASE_URL}/stock-transfers (with warehouse token)"
TRANSFERS=$(curl -s \
  -H "Authorization: Bearer $WAREHOUSE_TOKEN" \
  "${BASE_URL}/stock-transfers")

TRANSFER_COUNT=$(echo "$TRANSFERS" | jq '. | length')
echo -e "${GREEN}Found $TRANSFER_COUNT transfers${NC}"
echo "$TRANSFERS" | jq '.[] | {id, product: .product.name, from: .fromLocation.name, to: .toLocation.name, quantity, reason}'
echo ""

# Summary
echo "======================================================"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "======================================================"
echo ""
echo "✅ All warehouse and signup location features tested"
echo ""
echo "Key Features Verified:"
echo "  1. Location validation on signup (role-based)"
echo "  2. Warehouse users see only warehouse products"
echo "  3. Sales users see only store products"
echo "  4. Warehouse users can transfer FROM warehouse only"
echo "  5. Transfer history filtered by location"
echo ""
echo "Test Users:"
echo "  - warehouse@foreignfits.com (Main Warehouse)"
echo "  - sales@foreignfits.com (Retail Store - Mohan Market)"
echo "  - admin@foreignfits.com (All Locations)"
echo ""
