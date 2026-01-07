# 🚀 START HERE - Amber Price Monitor

## What You Have

A **complete electricity price monitoring app** that:
- 📊 Shows real-time Amber feed-in prices on a web dashboard
- 🔔 Sends notifications when prices are high (great for selling solar!)
- 📈 Displays price history and forecasts with beautiful charts
- ⚙️ Lets you configure everything via a web interface

Your API key is already configured!

## 3-Minute Quick Start

### Windows Users

1. **Double-click:** `install.bat` ← Install everything
2. **Double-click:** `start.bat` ← Start the app
3. **Open browser:** http://localhost:3000

### Mac/Linux Users

```bash
# 1. Install
npm install && cd web && npm install && npm run build && cd ..

# 2. Start
npm run dev

# 3. Open: http://localhost:3000
```

## What Happens Next

```
Terminal shows:
  🚀 Amber Price Monitor starting...
  📊 Web Dashboard: http://localhost:3000
  ✓ Application started successfully

Browser shows:
  ⚡ Amber Price Monitor
  Current Feed-In Price: 12.5 c/kWh
  [Price charts and graphs]
```

## Your Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ Amber Price Monitor              🟢 Live   ⚙️ Settings│
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Current Feed-In Price                                   │
│  15.8 c/kWh ⚡ HIGH                                      │
│                                                           │
│  🌟 EXCELLENT TIME TO SELL!                              │
│  Price is above your threshold of 15.0c/kWh             │
│                                                           │
│  Wholesale: 12.3c  🌱 Renewables: 65%  Until: 14:30     │
├─────────────────────────────────────────────────────────┤
│  📈 Price History (24h)    📊 Forecast (Next 24h)       │
│  [Line Chart]               [Bar Chart]                  │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
amber/
├── 📄 START_HERE.md         ← You are here
├── 📄 QUICKSTART.md         ← 3-minute guide
├── 📄 SETUP.md              ← Detailed setup
├── 📄 FEATURES.md           ← All features
├── 📄 README.md             ← Full documentation
│
├── ⚙️ .env                  ← Your settings (API key is here!)
├── 🚀 install.bat           ← Windows installer
├── 🚀 start.bat             ← Windows starter
│
├── 💻 src/                  ← Backend code
├── 🎨 web/                  ← Web dashboard code
└── 📦 package.json          ← Dependencies
```

## Quick Configuration

### Change Alert Threshold

**Option 1 - Web UI (Easy):**
1. Click "⚙️ Settings" on dashboard
2. Drag slider to desired price
3. Click "Save Changes"

**Option 2 - Edit .env:**
```env
FEED_IN_THRESHOLD=20.0  ← Change this number
```

### Update Every Minute

**Web UI:**
Settings → Select "Every 1 minute" → Save

**Or edit .env:**
```env
CHECK_INTERVAL=*/1 * * * *
```

## What Each File Does

| File | Purpose |
|------|---------|
| `START_HERE.md` | This file - your starting point |
| `QUICKSTART.md` | Get running in 3 minutes |
| `SETUP.md` | Detailed installation & config |
| `FEATURES.md` | Complete feature list |
| `README.md` | Full technical documentation |
| `.env` | **Your configuration** (API key, threshold, etc) |
| `install.bat` | Windows: Install all dependencies |
| `start.bat` | Windows: Start the app |
| `src/` | Backend TypeScript code |
| `web/` | React dashboard code |

## Common Questions

### How do I change the price threshold?
Click "⚙️ Settings" → Adjust slider → Save Changes

### How often does it check prices?
Every 5 minutes by default. Change in Settings or `.env`

### How often does the dashboard update?
Every minute via live WebSocket connection

### Where are notifications sent?
Desktop notifications (popup) + Console logs

### Can I turn off notifications?
Yes! Settings → Uncheck "Desktop Notifications"

### What happens when price is high?
1. Dashboard shows gold alert banner
2. Desktop notification pops up
3. Console logs the alert
4. (Only if price > your threshold)

### Can I see future prices?
Yes! The Forecast chart shows next 24 hours

### Can I see past prices?
Yes! The History chart shows last 24 hours

## Recommended Settings

### For Maximum Revenue
```
Threshold: 15-18 c/kWh
Interval: Every 5 minutes
Notifications: Desktop ON
```
Get alerted for good selling opportunities without spam.

### For Aggressive Selling
```
Threshold: 20-25 c/kWh
Interval: Every 1 minute
Notifications: Desktop ON
```
Only alert on excellent prices, check very frequently.

### For Research/Monitoring
```
Threshold: 10 c/kWh
Interval: Every 15 minutes
Notifications: Console only
```
Track everything, low resource usage.

## Next Steps

1. ✅ **Run:** Double-click `start.bat` or run `npm run dev`
2. ✅ **Open:** http://localhost:3000
3. ✅ **Configure:** Click Settings and adjust threshold
4. ✅ **Watch:** Monitor prices for a few minutes
5. ✅ **Optimize:** Adjust settings based on your needs

## Get Help

- 🆘 **Installation issues?** → See [SETUP.md](SETUP.md)
- 📚 **Want to learn more?** → See [FEATURES.md](FEATURES.md)
- 🔧 **Configuration help?** → See [README.md](README.md)
- 🐛 **Something broken?** → Check terminal for errors

## Tech Stack

Built with modern, professional tools:
- **Backend:** Node.js + TypeScript + Express
- **Frontend:** React + TypeScript + Vite
- **Charts:** Recharts
- **API:** Amber Electric Official API
- **Real-time:** WebSocket
- **Validation:** Zod schemas

## Production Ready

This is not a prototype - it's a **complete, production-ready application** with:
- ✅ Error handling & retries
- ✅ Type safety (TypeScript)
- ✅ Real-time updates (WebSocket)
- ✅ Responsive design (mobile-friendly)
- ✅ Configuration validation
- ✅ Structured logging
- ✅ Security best practices

---

## 🎯 Ready to Start?

### Windows:
```
1. Double-click: install.bat
2. Double-click: start.bat
3. Open: http://localhost:3000
```

### Mac/Linux:
```bash
npm install && cd web && npm install && npm run build && cd ..
npm run dev
# Then open: http://localhost:3000
```

---

**Happy solar selling! May your prices be high and your exports plentiful! ☀️⚡💰**
