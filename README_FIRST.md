# 🚀 Amber Price Monitor - Ready to Go!

Your Amber Electric price monitoring app is ready! Choose how you want to run it:

## Option 1: Run Locally (Recommended for Alerts) ⚡

**Best for:** Desktop notifications, 24/7 monitoring, price history

### Quick Start (5 minutes):

1. **Install:** Run `install.bat` (Windows) or:
   ```bash
   npm install
   cd web && npm install && npm run build && cd ..
   ```

2. **Start:** Run `start.bat` or:
   ```bash
   npm run dev
   ```

3. **Open:** http://localhost:3000

**Features:**
- ✅ Real-time updates every minute via WebSocket
- ✅ Desktop notifications when price > threshold
- ✅ 24-hour price history
- ✅ Background monitoring
- ✅ All features enabled

**See:** [QUICKSTART.md](QUICKSTART.md)

---

## Option 2: Deploy to Vercel (Cloud Hosting) ☁️

**Best for:** Access from anywhere, share with others, zero maintenance

### Quick Start (10 minutes):

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add environment variable: `AMBER_API_KEY=psk_YOUR_API_KEY_HERE`
   - Deploy!

3. **Access:** Your Vercel URL (e.g., `https://amber-monitor.vercel.app`)

**Features:**
- ✅ Access from anywhere (mobile, tablet, etc.)
- ✅ Share with family/friends
- ✅ Zero server maintenance
- ✅ Free hosting (Vercel free tier)
- ⚠️ HTTP polling (updates every minute)
- ⚠️ No desktop notifications
- ⚠️ Session-only history

**See:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## Option 3: Both! (Best of Both Worlds) 🌟

**Recommended setup:**

1. **Local:** For desktop alerts and 24/7 monitoring
2. **Vercel:** For remote dashboard access

Both use the same API key, no conflicts!

---

## What Each Option Gives You

| Feature | Local | Vercel | Both |
|---------|-------|--------|------|
| Desktop alerts | ✅ | ❌ | ✅ |
| 24/7 monitoring | ✅ | ❌ | ✅ |
| Access anywhere | ❌ | ✅ | ✅ |
| Mobile friendly | ❌ | ✅ | ✅ |
| Price history | ✅ | ⚠️ Session | ✅ |
| Setup time | 5 min | 10 min | 15 min |
| Maintenance | Keep running | Zero | Minimal |

---

## Quick Links

- 📖 [QUICKSTART.md](QUICKSTART.md) - Run locally in 3 minutes
- ☁️ [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Deploy to cloud
- 📚 [START_HERE.md](START_HERE.md) - Complete overview
- ⚙️ [SETUP.md](SETUP.md) - Detailed setup guide
- 🎯 [FEATURES.md](FEATURES.md) - All features explained
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details

---

## Your API Key is Ready!

Already configured in `.env`:
```
AMBER_API_KEY=psk_YOUR_API_KEY_HERE
```

---

## Need Help?

1. **Can't install?** → Try `npm install` in both root and `web/` folders
2. **Port in use?** → Change port in `src/index.ts` line 54
3. **No prices?** → Check API key and Amber account has solar
4. **Vercel issues?** → See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## What's Included

```
amber/
├── 📄 README_FIRST.md       ← You are here!
├── 📄 QUICKSTART.md         ← Local setup (3 min)
├── 📄 VERCEL_DEPLOYMENT.md  ← Cloud setup (10 min)
├── 📄 START_HERE.md         ← Overview
├── 📄 FEATURES.md           ← Feature list
├── 🚀 install.bat           ← Windows installer
├── 🚀 start.bat             ← Windows starter
├── 💻 src/                  ← Backend code
├── 🎨 web/                  ← Dashboard code
└── ☁️ api/                  ← Vercel serverless functions
```

---

## Next Step

Choose your path:

### For Local Alerts:
```bash
install.bat     # or npm install
start.bat       # or npm run dev
```
Then open: http://localhost:3000

### For Cloud Access:
Follow [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### For Both:
Do local setup first, then deploy to Vercel!

---

**Ready? Let's go! ⚡☀️💰**
