#!/bin/bash
# Quick Start Script for Cloudflare Worker Setup
# Run this from your home directory: bash ~/travelholic-ha/QUICK_START.sh

set -e

echo "🚀 Travelholic Worker Quick Start"
echo "=================================="
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
echo "📁 Creating project directory..."
cd ~
mkdir -p travelholic-worker
cd travelholic-worker

echo "✅ Created: ~/travelholic-worker"

echo ""
echo "📝 Creating project files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "travelholic-worker",
  "version": "1.0.0",
  "description": "Payment processing worker for Travelholic",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "keywords": ["cloudflare", "worker", "payments"],
  "author": "",
  "license": "ISC"
}
EOF

echo "✅ Created: package.json"

# Create wrangler.toml
cat > wrangler.toml << 'EOF'
name = "travelholic-payment"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
SUPERPAY_BASE_URL = "https://merchant.super-pay.com"
SUPERPAY_MERCHANT_CODE = "SUPERPAY_MERCHANT01"
EOF

echo "✅ Created: wrangler.toml"

# Create src directory
mkdir -p src

# Copy worker code
if [ -f ~/travelholic-ha/WORKER_CODE.js ]; then
    cp ~/travelholic-ha/WORKER_CODE.js src/index.js
    echo "✅ Created: src/index.js (worker code copied)"
else
    echo "⚠️  Please manually copy WORKER_CODE.js to src/index.js"
fi

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.dev.vars
.wrangler/
wrangler.toml.backup
EOF

echo "✅ Created: .gitignore"

# Create README
cat > README.md << 'EOF'
# Travelholic Payment Worker

## Next Steps

1. Login to Cloudflare:
   ```bash
   wrangler login
   ```

2. Update wrangler.toml with your Superpay details

3. Add secrets:
   ```bash
   wrangler secret put HOSTAWAY_BEARER_TOKEN
   wrangler secret put SUPERPAY_API_KEY
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

5. Copy your Worker URL and update frontend app.js

## Commands

- `wrangler dev` - Test locally
- `wrangler deploy` - Deploy to production
- `wrangler tail` - View live logs
EOF

echo "✅ Created: README.md"

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "📂 Project location: ~/travelholic-worker"
echo ""
echo "🔑 Next steps:"
echo "   1. cd ~/travelholic-worker"
echo "   2. wrangler login"
echo "   3. Edit wrangler.toml (add your Superpay merchant code)"
echo "   4. wrangler secret put HOSTAWAY_BEARER_TOKEN"
echo "   5. wrangler secret put SUPERPAY_API_KEY"
echo "   6. wrangler deploy"
echo ""
echo "📖 Full guide: ~/travelholic-ha/CLOUDFLARE_WORKER_SETUP.md"
echo ""
