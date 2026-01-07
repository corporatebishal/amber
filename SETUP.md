# Setup Guide - Amber Price Monitor

## Quick Start

### 1. Install Dependencies

First, install the backend dependencies:

```bash
npm install
```

Then, install the web UI dependencies:

```bash
cd web
npm install
cd ..
```

### 2. Configure Your API Key

The `.env` file has already been created with your API key. You can verify it:

```env
AMBER_API_KEY=psk_YOUR_API_KEY_HERE
```

### 3. Run the Application

Start the application in development mode:

```bash
npm run dev
```

This will:
- Start the backend server on port 3000
- Begin monitoring Amber prices every 5 minutes
- Enable desktop notifications
- Launch the web dashboard at http://localhost:3000

### 4. Access the Web Dashboard

Open your browser and go to:

```
http://localhost:3000
```

You'll see:
- 📊 **Real-time price display** - Current feed-in price with color-coded alerts
- 📈 **Price history chart** - Last 24 hours of price data
- 📊 **Forecast chart** - Next 24 hours of predicted prices
- ⚙️ **Settings panel** - Configure threshold, intervals, and notifications

## Features

### Real-Time Updates
- Prices update every minute via WebSocket
- Live connection status indicator
- Automatic reconnection if connection drops

### Interactive Settings
Click the "⚙️ Settings" button to:
- **Adjust Price Threshold** - Use the slider or input field (5-30 c/kWh)
- **Change Check Interval** - From every minute to every hour
- **Toggle Notifications** - Enable/disable console and desktop notifications

### Price Alerts
When feed-in price exceeds your threshold:
- 🌟 Large alert banner on dashboard
- 🔔 Desktop notification (if enabled)
- 📝 Console log (if enabled)

### Charts & Visualization
- **History Chart** - Line graph showing past 24 hours
- **Forecast Chart** - Bar chart showing next 24 hours
- **Threshold Line** - Visual reference for your alert threshold
- **Color Coding** - Green bars indicate prices above threshold

## Development Mode

To run the backend and frontend separately for development:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend (with hot reload):**
```bash
npm run dev:web
```

The frontend dev server runs on port 5173 and proxies API requests to port 3000.

## Production Build

Build for production:

```bash
npm run build
```

This will:
1. Compile TypeScript backend to `dist/`
2. Build React frontend to `web/dist/`

Run in production:

```bash
npm start
```

## Configuration Options

Edit `.env` to customize:

```env
# Price threshold (cents per kWh)
FEED_IN_THRESHOLD=15.0

# Check interval (cron expression)
# */1 * * * * = every minute
# */5 * * * * = every 5 minutes (default)
CHECK_INTERVAL=*/5 * * * *

# Timezone
TIMEZONE=Australia/Sydney

# Notifications
NOTIFICATION_CHANNELS=console,desktop

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
```

### Cron Expression Examples

- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

## Troubleshooting

### "No active sites found"
- Verify your API key in `.env`
- Check your Amber account has an active site
- Visit https://app.amber.com.au to confirm

### Desktop notifications not working
**Windows**: Should work automatically

**macOS**:
1. System Preferences → Notifications
2. Find "Node" or "Terminal"
3. Enable notifications

**Linux**:
```bash
sudo apt-get install libnotify-bin
```

### Web dashboard shows "Loading..."
- Check backend is running on port 3000
- Check browser console for errors
- Verify API key is correct

### Port already in use
If port 3000 is busy, edit `src/index.ts`:
```typescript
webServer = new WebServer(3001); // Change to different port
```

## Architecture

```
amber/
├── src/                    # Backend (Node.js/TypeScript)
│   ├── api/               # Amber API client
│   ├── config/            # Configuration & validation
│   ├── monitoring/        # Price monitoring logic
│   ├── notifications/     # Notification channels
│   ├── scheduler/         # Cron scheduler
│   ├── server/            # Express API + WebSocket
│   └── index.ts           # Main entry point
│
├── web/                    # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── dist/              # Production build
│
└── .env                    # Configuration file
```

## Next Steps

1. **Set Your Threshold** - Open settings and adjust to your preference
2. **Monitor Prices** - Watch the dashboard for price changes
3. **Test Alerts** - Wait for a price spike or temporarily lower threshold
4. **Customize Interval** - Adjust how often prices are checked

## Support

- **Amber API Issues**: dev@amber.com.au
- **Amber Account**: info@amber.com.au
- **App Issues**: Check GitHub issues

---

**Enjoy optimizing your solar exports! ☀️⚡**
