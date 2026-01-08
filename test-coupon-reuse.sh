#!/bin/bash

# Test Coupon Reuse Prevention
# This script tests that a coupon cannot be used twice

echo "======================================"
echo "Testing Coupon Reuse Prevention"
echo "======================================"
echo ""

# First, login to get token
echo "Step 1: Login to get auth token..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foreignfits.com","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi
echo "✅ Login successful"
echo ""

# Check existing coupons
echo "Step 2: Checking existing coupons..."
echo "Query: SELECT code, status, discount_amount, valid_until FROM coupons ORDER BY generated_at DESC LIMIT 5"
echo ""
echo "Please check H2 Console manually: http://localhost:8080/h2-console"
echo "JDBC URL: jdbc:h2:file:./data/foreignfits"
echo "User: sa"
echo "Password: (leave empty)"
echo ""

# Instructions
echo "======================================"
echo "MANUAL TEST STEPS:"
echo "======================================"
echo ""
echo "1. Open the app and go to Sales page"
echo ""
echo "2. CREATE FIRST SALE (to generate a coupon):"
echo "   - Add items worth ≥₹3000"
echo "   - Complete sale"
echo "   - Note the generated coupon code (e.g., FF-ABC123)"
echo ""
echo "3. CREATE SECOND SALE (use the coupon):"
echo "   - Add items worth ≥₹2000"
echo "   - Enter the coupon code from step 2"
echo "   - Click 'Apply Coupon'"
echo "   - You should see: '✅ Coupon Applied! You save ₹500'"
echo "   - Complete the sale"
echo "   - Discount should be applied"
echo ""
echo "4. TRY TO USE THE SAME COUPON AGAIN:"
echo "   - Create a NEW sale (third sale)"
echo "   - Add items worth ≥₹2000"
echo "   - Enter the SAME coupon code again"
echo "   - Click 'Apply Coupon'"
echo "   - ❌ You should see: 'This coupon has already been used'"
echo "   - Coupon should NOT be applied"
echo ""
echo "5. VERIFY IN DATABASE:"
echo "   - Open H2 Console: http://localhost:8080/h2-console"
echo "   - Run query:"
echo "     SELECT code, status, discount_amount, redeemed_at, redeemed_in_sale_id"
echo "     FROM coupons"
echo "     WHERE code = 'YOUR-COUPON-CODE';"
echo "   - Status should be: 1 (USED)"
echo "   - redeemed_at should have a timestamp"
echo "   - redeemed_in_sale_id should have the sale ID"
echo ""
echo "======================================"
echo "EXPECTED RESULTS:"
echo "======================================"
echo ""
echo "✅ First use: Coupon applies successfully, ₹500 discount"
echo "✅ Coupon status changes from ACTIVE (0) to USED (1)"
echo "❌ Second use: Error message 'This coupon has already been used'"
echo "❌ Discount not applied on second attempt"
echo ""
