#!/bin/bash
# Travelholic Worker Deployment Script

set -e

echo "🚀 Travelholic Payment Worker Deployment"
echo "========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
    echo "✅ Wrangler installed!"
else
    echo "✅ Wrangler already installed"
fi

echo ""

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please login to Cloudflare..."
    wrangler login
else
    echo "✅ Already logged in to Cloudflare"
fi

echo ""
echo "📋 Configuration Check"
echo "----------------------"

# Check if secrets are set
echo "Checking secrets..."
if wrangler secret list 2>&1 | grep -q "HOSTAWAY_BEARER_TOKEN"; then
    echo "✅ HOSTAWAY_BEARER_TOKEN is set"
else
    echo "⚠️  HOSTAWAY_BEARER_TOKEN not set"
    read -p "Do you want to add it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        wrangler secret put HOSTAWAY_BEARER_TOKEN
    fi
fi

if wrangler secret list 2>&1 | grep -q "SUPERPAY_API_KEY"; then
    echo "✅ SUPERPAY_API_KEY is set"
else
    echo "⚠️  SUPERPAY_API_KEY not set"
    read -p "Do you want to add it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        wrangler secret put SUPERPAY_API_KEY
    fi
fi

echo ""
echo "🚀 Deploying worker..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your Worker URL will be shown above."
echo "Copy it and update your frontend app.js with it."
echo ""
echo "📊 To view logs: wrangler tail"
echo "🧪 To test: curl https://YOUR-WORKER-URL/health"
echo ""
