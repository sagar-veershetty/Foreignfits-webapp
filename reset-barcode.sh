#!/bin/bash
# Script to reset a barcode status to ACTIVE
# Usage: ./reset-barcode.sh <TOKEN> <BARCODE_NUMBER>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <JWT_TOKEN> <BARCODE_NUMBER>"
    echo "Example: $0 \"your-jwt-token-here\" \"CLJACMBLU7111-FC533C8B\""
    exit 1
fi

TOKEN=$1
BARCODE=$2

echo "Resetting barcode: $BARCODE"

curl -X PATCH "http://localhost:8080/api/barcodes/reset/${BARCODE}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "Barcode reset complete!"
