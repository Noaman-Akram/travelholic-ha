# Travelholic Payment Worker

Backend Cloudflare Worker for handling Hostaway reservations and Superpay payment integration.

## 🚀 Quick Deploy

### 1. Install Dependencies

```bash
cd worker
npm install -g wrangler  # If not already installed
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Update Configuration

Edit `wrangler.toml` and update:
- `SUPERPAY_MERCHANT_CODE` - Your Superpay merchant code
- `SUPERPAY_BASE_URL` - Confirm Superpay API URL

### 4. Add Secrets

```bash
# Add Hostaway Bearer Token
wrangler secret put HOSTAWAY_BEARER_TOKEN
# Paste your token when prompted

# Add Superpay API Key
wrangler secret put SUPERPAY_API_KEY
# Paste your API key when prompted
```

### 5. Deploy

```bash
wrangler deploy
```

You'll get a URL like: `https://travelholic-payment.YOUR-SUBDOMAIN.workers.dev`

### 6. Update Frontend

Copy your Worker URL and update `app.js` with it.

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
