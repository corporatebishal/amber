# ⚡ Quick Start Guide

Get up and running in 3 minutes!

## Step 1: Install (2 minutes)

Double-click `install.bat` or run:

```bash
npm install
cd web && npm install && npm run build && cd ..
```

This installs all dependencies and builds the web UI.

## Step 2: Start (30 seconds)

Double-click `start.bat` or run:

```bash
npm run dev
```

You'll see:
```
🚀 Amber Price Monitor starting...
📊 Web Dashboard: http://localhost:3000
Monitoring feed-in prices. Threshold: 15.0c/kWh
```

## Step 3: Open Dashboard

Open your browser to:
```
http://localhost:3000
```

## What You'll See

### 🎯 Main Dashboard
- **Big price display** - Current feed-in price in c/kWh
- **Alert banner** - Shows when price exceeds threshold
- **Status indicator** - Green dot = live updates
- **Settings button** - Configure everything

### 📊 Charts
- **History** - Last 24 hours of prices (line chart)
- **Forecast** - Next 24 hours (bar chart, green = above threshold)

### ⚙️ Settings
Click "Settings" to:
1. **Adjust threshold** - Drag slider or type (5-30 c/kWh)
2. **Change interval** - How often to check (1 min to 1 hour)
3. **Toggle notifications** - Desktop alerts on/off

## Default Configuration

Already set in your `.env` file:

| Setting | Value | What it means |
|---------|-------|---------------|
| API Key | `psk_10f...` | Your Amber API access |
| Threshold | 15.0 c/kWh | Alert when price > 15c |
| Interval | Every 5 min | Check prices every 5 minutes |
| Channels | Console, Desktop | Where to send alerts |

## How It Works

1. **Every minute**: Dashboard updates with latest price
2. **Every 5 minutes**: Backend checks Amber API
3. **When price > 15c**:
   - Dashboard shows gold alert banner
   - Desktop notification pops up
   - Console logs the alert

## Common Tasks

### Change Your Threshold

**Via Web UI** (recommended):
1. Click "⚙️ Settings"
2. Drag slider or type new value
3. Click "Save Changes"

**Via File**:
Edit `.env`:
```env
FEED_IN_THRESHOLD=20.0
```
Restart app.

### Check Prices More Often

**Via Web UI**:
1. Click "⚙️ Settings"
2. Select "Every 1 minute"
3. Click "Save Changes"
4. Restart app

**Via File**:
Edit `.env`:
```env
CHECK_INTERVAL=*/1 * * * *
```

### Disable Desktop Notifications

**Via Web UI**:
1. Click "⚙️ Settings"
2. Uncheck "Desktop Notifications"
3. Click "Save Changes"

## Keyboard Shortcuts

While app is running in terminal:
- **Ctrl+C** - Stop the app
- **Ctrl+R** (browser) - Refresh dashboard

## Tips

### 💡 Optimize for Your Solar
- **High threshold (20-25c)**: Only alert on excellent prices
- **Medium threshold (15-18c)**: Balanced, good selling opportunities
- **Low threshold (10-12c)**: Alert more often, don't miss anything

### 💡 Set Check Interval
- **Every minute**: Live tracking, max responsiveness
- **Every 5 minutes**: Good balance (default)
- **Every 15-30 minutes**: Light resource usage

### 💡 Watch the Forecast
The forecast chart shows when prices will spike - plan ahead!

### 💡 Monitor Renewables
Higher renewable % = greener grid = feel good about exporting!

## Troubleshooting

### Dashboard shows "Loading..."
- Check terminal - is backend running?
- Try refreshing browser
- Check API key in `.env`

### No desktop notifications
- Windows: Should work automatically
- macOS: Enable in System Preferences → Notifications
- Linux: Install `libnotify-bin`

### Port 3000 already in use
Edit `src/index.ts` line 54:
```typescript
webServer = new WebServer(3001); // Change port
```

## Next Steps

1. ✅ Watch the dashboard for a few minutes
2. ✅ Adjust your threshold to match your goals
3. ✅ Check the forecast chart - see when prices spike
4. ✅ Test an alert by lowering threshold temporarily
5. ✅ Explore the settings panel

## Need Help?

- 📖 See [SETUP.md](SETUP.md) for detailed setup
- 🎯 See [FEATURES.md](FEATURES.md) for all features
- 📚 See [README.md](README.md) for full documentation

---

**You're all set! Start maximizing your solar export revenue! ☀️⚡**
