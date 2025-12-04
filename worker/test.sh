#!/bin/bash
# Quick test script for the deployed worker

if [ -z "$1" ]; then
    echo "Usage: ./test.sh <WORKER_URL>"
    echo "Example: ./test.sh https://travelholic-payment.your-subdomain.workers.dev"
    exit 1
fi

WORKER_URL=$1

echo "🧪 Testing Worker: $WORKER_URL"
echo "================================"
echo ""

# Test health endpoint
echo "1. Testing /health endpoint..."
echo ""
curl -s "$WORKER_URL/health" | jq '.' || curl -s "$WORKER_URL/health"
echo ""
echo ""

# Test create-booking endpoint (will fail without valid token, but tests CORS)
echo "2. Testing /api/create-booking endpoint (CORS check)..."
echo ""
curl -i -X POST "$WORKER_URL/api/create-booking" \
  -H "Content-Type: application/json" \
  -d '{
    "guest": {"name": "Test User", "email": "test@example.com"},
    "booking": {"checkIn": "2024-12-15", "checkOut": "2024-12-20"},
    "pricing": {"total": "1500"},
    "url": "https://book.travelholiceg.com/checkout/248413?start=2024-12-15&end=2024-12-20"
  }' 2>&1 | head -20

echo ""
echo ""
echo "✅ Basic tests complete!"
echo ""
echo "Note: The create-booking endpoint may return errors without valid"
echo "Hostaway/Superpay credentials, but CORS headers should be present."
