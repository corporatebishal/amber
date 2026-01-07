# Deploying to Vercel

This guide will help you deploy the Amber Price Monitor to Vercel for free cloud hosting.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free)
- [GitHub account](https://github.com/signup) (for code hosting)
- Your Amber API key

## Deployment Steps

### 1. Push Code to GitHub

First, initialize a Git repository and push to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Amber Price Monitor"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/amber-price-monitor.git
git branch -M main
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

### 3. Configure Environment Variables

In Vercel project settings, add these environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `AMBER_API_KEY` | `psk_YOUR_API_KEY_HERE` | Your Amber API key |
| `FEED_IN_THRESHOLD` | `15.0` | Price threshold (optional, default: 15.0) |
| `TIMEZONE` | `Australia/Sydney` | Your timezone (optional) |

**Steps:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add each variable
4. Apply to: Production, Preview, and Development

### 4. Deploy

Click "Deploy" and Vercel will:
- Build the React frontend
- Deploy serverless API functions
- Assign you a URL like: `https://amber-price-monitor.vercel.app`

### 5. Access Your Dashboard

Visit your Vercel URL to see your dashboard!

## Architecture Changes for Vercel

### What's Different?

**Local Development:**
- ✅ WebSocket for real-time updates every minute
- ✅ Price history stored in memory
- ✅ Desktop notifications
- ✅ Cron scheduler for alerts

**Vercel (Serverless):**
- ✅ HTTP polling every minute (no WebSocket)
- ✅ Session-based history (stored in browser)
- ⚠️ No desktop notifications (browser only)
- ⚠️ No background alerts (on-demand only)

### API Endpoints on Vercel

```
GET /api/prices   - Fetch current + forecast prices
GET /api/settings - Get configuration
```

### File Structure for Vercel

```
amber/
├── api/                    # Serverless API functions
│   ├── prices.ts          # /api/prices endpoint
│   └── settings.ts        # /api/settings endpoint
│
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── App.vercel.tsx # Vercel-optimized App (no WebSocket)
│   │   └── ...
│   └── dist/              # Built files (auto-deployed)
│
├── vercel.json            # Vercel configuration
└── package.json
```

## Customization

### Update Frontend for Vercel

To use the Vercel-optimized frontend (HTTP polling instead of WebSocket):

1. Rename files in `web/src/`:
   ```bash
   mv web/src/App.tsx web/src/App.local.tsx
   mv web/src/App.vercel.tsx web/src/App.tsx
   ```

2. Rebuild:
   ```bash
   cd web
   npm run build
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Use Vercel-optimized frontend"
   git push
   ```

Vercel will auto-deploy the new version.

### Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `amber.yourdomain.com`)
3. Update DNS records as instructed
4. SSL certificate is automatic

## Monitoring on Vercel

### View Logs

Vercel Dashboard → Your Project → Deployments → [Latest] → Function Logs

You'll see:
- API requests
- Error messages
- Response times

### Analytics

Vercel provides built-in analytics:
- Page views
- API usage
- Performance metrics

## Cost

### Vercel Free Tier Includes:

- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ 100 serverless function executions/day
- ✅ Automatic HTTPS
- ✅ Global CDN

**For this app:** Easily fits within free tier limits!

**Usage estimate:**
- 1 user checking every minute = ~1,440 API calls/day
- Well under 100,000 limit

## Limitations & Solutions

### 1. No Price History Storage

**Problem:** Serverless functions are stateless - can't store history between requests.

**Solutions:**
- **Current:** History builds during browser session only
- **Better:** Add Vercel KV (Redis) or Postgres for persistent storage
- **Best:** Use Vercel Cron + Database for scheduled data collection

### 2. No Background Alerts

**Problem:** Serverless functions run on-demand only, no continuous monitoring.

**Solutions:**
- **Manual:** User must keep browser open to see price updates
- **Better:** Set up Vercel Cron (beta) to check prices periodically
- **Best:** Use separate service (like local app) for alerts + Vercel for dashboard

### 3. No WebSocket

**Problem:** Vercel Edge Network doesn't support long-lived WebSocket connections easily.

**Solutions:**
- **Current:** HTTP polling every 60 seconds (works great!)
- **Better:** Use Vercel Serverless WebSockets (if available)
- **Alternative:** Use Pusher or Ably for real-time (3rd party)

## Hybrid Approach (Recommended)

### Best of Both Worlds:

**Run locally for:**
- Real-time alerts
- Desktop notifications
- 24/7 price monitoring
- Price history storage

**Use Vercel for:**
- Public dashboard (access from anywhere)
- Share with family/friends
- Mobile access
- No server maintenance

### Setup:

1. **Local:** Run `npm run dev` on your home computer
2. **Vercel:** Deploy dashboard for remote access

Both can use the same Amber API key!

## Advanced: Add Persistent Storage

### Option 1: Vercel KV (Redis)

1. Install Vercel KV
2. Store price history in Redis
3. Update `api/prices.ts` to read/write history

### Option 2: Vercel Postgres

1. Add Vercel Postgres database
2. Create `prices` table
3. Store every price check with timestamp
4. Query last 24 hours for history chart

### Option 3: Vercel Cron (Beta)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron-check-prices",
    "schedule": "*/5 * * * *"
  }]
}
```

Create `api/cron-check-prices.ts` to check prices and send alerts.

## Troubleshooting

### Build Fails

**Error:** `Cannot find module 'axios'`

**Fix:** Add to root `package.json`:
```json
{
  "dependencies": {
    "axios": "^1.7.9"
  }
}
```

### API Returns 500

**Check:**
1. Environment variables are set correctly
2. API key is valid
3. Function logs in Vercel dashboard

### No Prices Showing

**Check:**
1. API key is correct
2. You have an active Amber site
3. Site has solar/feed-in configured
4. Browser console for errors

### Slow Updates

**Expected:** Vercel serverless functions have cold start time (~1-2 seconds)

**Solution:** Nothing needed, this is normal for free tier

## Security

### API Key Protection

✅ Your API key is stored in Vercel environment variables
✅ Not exposed to frontend/client
✅ Not in GitHub repository
✅ Encrypted at rest by Vercel

### Best Practices

1. **Never commit `.env` to Git**
2. **Use Vercel Secrets for production**
3. **Regenerate API key if exposed**
4. **Enable Vercel Authentication** (optional, for private dashboard)

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test the dashboard
3. ✅ Share URL with family
4. ✅ Monitor your solar revenue!

Optional enhancements:
- Add Vercel KV for persistent history
- Set up Vercel Cron for automated checks
- Add password protection
- Custom domain
- Multiple sites support

---

## Summary

| Feature | Local | Vercel |
|---------|-------|--------|
| Real-time updates | WebSocket (instant) | HTTP polling (60s) |
| Price history | In-memory (24h) | Session only |
| Desktop alerts | ✅ Yes | ❌ No |
| Background monitoring | ✅ Yes (cron) | ⚠️ Manual |
| Access | Local only | Anywhere |
| Cost | Free (electricity) | Free (Vercel tier) |
| Maintenance | Keep running | Zero |
| Setup | 5 minutes | 10 minutes |

**Recommendation:** Use both!
- **Local:** For alerts and 24/7 monitoring
- **Vercel:** For remote dashboard access

---

## Quick Commands

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check environment variables
vercel env ls

# Add environment variable
vercel env add AMBER_API_KEY
```

**Happy deploying! ☀️⚡🚀**
