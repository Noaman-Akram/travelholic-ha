# 🚀 Cloudflare Worker Setup Guide

Complete step-by-step guide to deploy your payment processing backend.

---

## 📋 What You'll Build

```
Frontend (app.js)  →  Cloudflare Worker  →  Hostaway API
                                        →  Superpay API
```

**Frontend (already done ✅):** Validates form, extracts data, shows loading state
**Worker (next step 👇):** Handles APIs, creates reservations, generates payment URLs

---

## 🗂️ Project Structure

You'll create a **separate folder/repo** for the Worker:

```
travelholic-ha/              ← Frontend (already exists)
├── app.js
├── styles.css
└── CLOUDFLARE_WORKER_SETUP.md

travelholic-worker/          ← NEW! Backend Worker
├── src/
│   └── index.js            ← Main worker code
├── wrangler.toml           ← Cloudflare config
├── package.json
└── .env                    ← Secrets (DO NOT COMMIT)
```

---

## 🛠️ Step 1: Install Cloudflare Tools

Open your terminal and run:

```bash
# Install Node.js if you don't have it
# Download from: https://nodejs.org/

# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Verify installation
wrangler --version
```

---

## 🔐 Step 2: Login to Cloudflare

```bash
# This will open browser for authentication
wrangler login
```

Follow the prompts in your browser to authorize.

---

## 📁 Step 3: Create Worker Project

```bash
# Create new directory (outside of travelholic-ha)
cd ~
mkdir travelholic-worker
cd travelholic-worker

# Initialize npm project
npm init -y
```

---

## 📝 Step 4: Create Worker Files

### **File 1: `wrangler.toml`**

Create this config file:

```toml
name = "travelholic-payment"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
SUPERPAY_BASE_URL = "https://merchant.super-pay.com"
SUPERPAY_MERCHANT_CODE = "SUPERPAY_MERCHANT01"
```

### **File 2: `src/index.js`**

Create the main worker code (I'll provide this in next message - it's long!)

---

## 🔑 Step 5: Add Secrets

**IMPORTANT:** Never commit secrets to git!

Add your Hostaway token and Superpay API key:

```bash
# Add Hostaway Bearer Token
wrangler secret put HOSTAWAY_BEARER_TOKEN
# Paste your token when prompted

# Add Superpay API Key
wrangler secret put SUPERPAY_API_KEY
# Paste your API key when prompted
```

---

## 🚀 Step 6: Deploy Worker

```bash
# Deploy to Cloudflare
wrangler deploy
```

You'll get a URL like:
```
https://travelholic-payment.YOUR-SUBDOMAIN.workers.dev
```

**📋 COPY THIS URL!** You'll need it for the frontend.

---

## 🧪 Step 7: Test Your Worker

Test the health endpoint:

```bash
curl https://travelholic-payment.YOUR-SUBDOMAIN.workers.dev/health
```

Should return:
```json
{"status":"ok","time":"2024-12-01T..."}
```

---

## 🔗 Step 8: Connect Frontend to Worker

Once deployed, I'll update `app.js` to use your Worker URL:

```javascript
// In app.js (I'll do this for you)
const WORKER_URL = 'https://travelholic-payment.YOUR-SUBDOMAIN.workers.dev';

const response = await fetch(`${WORKER_URL}/api/create-booking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingInfo)
});
```

---

## 📊 What the Worker Does

1. **Receives** booking data from frontend
2. **Creates** reservation in Hostaway API
3. **Generates** Superpay payment URL
4. **Returns** iframe URL to frontend
5. **Frontend redirects** user to payment page
6. **Handles** payment webhooks from Superpay
7. **Updates** reservation status when paid

---

## 🔍 Monitoring & Logs

View live logs while testing:

```bash
wrangler tail
```

View logs in dashboard:
```
https://dash.cloudflare.com/
→ Workers & Pages
→ travelholic-payment
→ Logs
```

---

## 🐛 Troubleshooting

**Issue:** `wrangler: command not found`
**Fix:** Run `npm install -g wrangler` again

**Issue:** `Authentication error`
**Fix:** Run `wrangler logout` then `wrangler login`

**Issue:** `Module not found`
**Fix:** Make sure `src/index.js` exists

**Issue:** `Secret not found`
**Fix:** Run `wrangler secret put SECRET_NAME` again

---

## 🔄 Updating the Worker

After making changes to `src/index.js`:

```bash
wrangler deploy
```

Changes are live immediately!

---

## 💰 Cost

Cloudflare Workers Free Tier:
- ✅ 100,000 requests per day
- ✅ More than enough for your traffic
- ✅ No credit card needed (at first)

---

## 🎯 Next Steps

1. ✅ Install Wrangler
2. ✅ Login to Cloudflare
3. ✅ Create project folder
4. ✅ Create `wrangler.toml`
5. ⏳ Create `src/index.js` (I'll provide code)
6. ⏳ Add secrets
7. ⏳ Deploy
8. ⏳ Get Worker URL
9. ⏳ I'll update `app.js` with your URL

---

## 🆘 Need Help?

Let me know when you:
- ✅ Installed Wrangler
- ✅ Created the project
- ✅ Need the `src/index.js` code
- ✅ Have your Worker URL

I'll guide you through each step! 🚀
