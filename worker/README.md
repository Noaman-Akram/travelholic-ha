# Travelholic Payment Worker

Backend Cloudflare Worker for handling Hostaway reservations and Superpay payment integration.

## ✅ Pre-configured

SuperPay TEST credentials are already configured:
- ✅ Merchant Code: `SUPER0001582_TST`
- ✅ API Key: `U2vpMIEpCo`
- ✅ Secret Key: `ZDAAuQOEuS`

**You only need to add your Hostaway token!**

---

## 🚀 Quick Deploy (3 Steps!)

### 1. Login to Cloudflare

```bash
cd worker
wrangler login
```

### 2. Add Hostaway Token

```bash
wrangler secret put HOSTAWAY_BEARER_TOKEN
# Paste your Hostaway Bearer Token when prompted
```

### 3. Deploy

```bash
wrangler deploy
```

You'll get a URL like: `https://travelholic-payment.YOUR-SUBDOMAIN.workers.dev`

**That's it! ✅**

---

## 🧪 Test Cards

Use these for testing payments:

```
Card Number: 5123450000000008
Expiry: 01/39
CVV: 123
Name: test
```

---

## 🔄 Moving to Production

When ready for LIVE payments:

1. Get your LIVE credentials from SuperPay
2. Update `wrangler.toml`:
   ```toml
   SUPERPAY_MERCHANT_CODE = "YOUR_LIVE_CODE"
   SUPERPAY_API_KEY = "YOUR_LIVE_KEY"
   SUPERPAY_SECRET_KEY = "YOUR_LIVE_SECRET"
   ```
3. Redeploy: `wrangler deploy`

---

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "time": "2024-12-01T12:00:00.000Z",
  "service": "Travelholic Payment Worker"
}
```

### Create Booking
```bash
POST /api/create-booking
Content-Type: application/json

{
  "guest": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "booking": {
    "checkIn": "2024-12-15",
    "checkOut": "2024-12-20"
  },
  "pricing": {
    "total": "1500.00"
  },
  "url": "https://book.travelholiceg.com/checkout/248413?start=2024-12-15&end=2024-12-20"
}
```

**Response:**
```json
{
  "success": true,
  "reservationId": 12345,
  "iframeUrl": "https://payment.superpay.com/...",
  "message": "Reservation created successfully. Redirecting to payment..."
}
```

### Payment Webhook
```bash
POST /api/superpay-webhook
```

Receives payment status from Superpay and updates reservation.

---

## 🧪 Local Testing

```bash
# Start dev server
wrangler dev

# In another terminal, test endpoints
curl http://localhost:8787/health
```

---

## 📊 View Logs

```bash
# Live tail logs
wrangler tail

# Or view in dashboard
# https://dash.cloudflare.com/ → Workers & Pages → travelholic-payment → Logs
```

---

## 🔧 Update Worker

After making changes to `src/index.js`:

```bash
wrangler deploy
```

Changes are live immediately!

---

## 🛠️ Commands Reference

| Command | Description |
|---------|-------------|
| `wrangler login` | Login to Cloudflare |
| `wrangler deploy` | Deploy worker to production |
| `wrangler dev` | Test locally |
| `wrangler tail` | View live logs |
| `wrangler secret put NAME` | Add secret |
| `wrangler secret list` | List secrets |
| `wrangler secret delete NAME` | Delete secret |

---

## 🔐 Environment Variables

### Public (in wrangler.toml)
- `SUPERPAY_BASE_URL` - Superpay API base URL
- `SUPERPAY_MERCHANT_CODE` - Your merchant code

### Secrets (via wrangler)
- `HOSTAWAY_BEARER_TOKEN` - Hostaway API token
- `SUPERPAY_API_KEY` - Superpay API key

---

## 🐛 Troubleshooting

**Issue:** Authentication error
**Fix:** Run `wrangler logout` then `wrangler login`

**Issue:** Secret not found
**Fix:** Run `wrangler secret put SECRET_NAME` again

**Issue:** CORS error from frontend
**Fix:** Check that Worker URL is correct in frontend

**Issue:** Hostaway API error
**Fix:** Verify Bearer Token is valid

---

## 📚 Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hostaway API Docs](https://api.hostaway.com/docs/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## 🆘 Support

Check logs for detailed error messages:
```bash
wrangler tail
```
