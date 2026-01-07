# Amber Price Monitor

Monitor Amber Electric price fluctuations and receive notifications when feed-in prices are high - perfect for maximizing your solar export revenue!

## Features

- 🔔 **Desktop Notifications** - Get instant alerts when feed-in prices spike
- ⚡ **Real-time Monitoring** - Continuously track electricity prices via Amber Electric API
- 🌞 **Solar Optimized** - Specifically monitors feed-in tariffs for solar exports
- 📊 **Smart Thresholds** - Set custom price thresholds for alerts
- 🔄 **Automated Scheduling** - Configurable check intervals with cron expressions
- 🛡️ **Robust Error Handling** - Automatic retries and graceful error recovery
- 📝 **Structured Logging** - Comprehensive logging with Pino

## Prerequisites

- Node.js 18+
- An [Amber Electric](https://www.amber.com.au/) account
- Solar panels connected to your Amber account
- Amber API key (get it from [app.amber.com.au](https://app.amber.com.au/developers))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your Amber API key:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Your Amber API Key (required)
AMBER_API_KEY=psk_YOUR_API_KEY_HERE

# Optional: Specific site ID (leave empty to auto-detect)
AMBER_SITE_ID=

# Price threshold in cents per kWh (default: 15.0)
FEED_IN_THRESHOLD=15.0

# Check interval (default: every 5 minutes)
CHECK_INTERVAL=*/5 * * * *

# Timezone (default: Australia/Sydney)
TIMEZONE=Australia/Sydney

# Notification channels: console, desktop
NOTIFICATION_CHANNELS=console,desktop

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
```

### 3. Run the Application

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## Configuration

### Feed-in Threshold

The `FEED_IN_THRESHOLD` determines when you'll receive notifications. Set this based on your preferences:

- **Conservative**: `10.0` - Get notified for moderately high prices
- **Balanced**: `15.0` - Only notify for significantly high prices (recommended)
- **Aggressive**: `20.0` - Only notify during price spikes

### Check Interval (Cron Expression)

The `CHECK_INTERVAL` uses cron syntax:

- `*/5 * * * *` - Every 5 minutes (recommended)
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes
- `0 * * * *` - Every hour

### Notification Channels

Configure which notification methods to use:

- `console` - Log to console/terminal
- `desktop` - Native desktop notifications (Windows/macOS/Linux)

Example: `NOTIFICATION_CHANNELS=console,desktop`

### Timezones

Valid Australian timezones:
- `Australia/Sydney` (NSW, VIC, TAS, ACT)
- `Australia/Brisbane` (QLD)
- `Australia/Adelaide` (SA)
- `Australia/Perth` (WA)
- `Australia/Darwin` (NT)

## How It Works

1. **Connects to Amber API** - Authenticates using your API key
2. **Fetches Current Prices** - Gets real-time feed-in prices for your site
3. **Checks Threshold** - Compares current price against your configured threshold
4. **Sends Notifications** - Alerts you when prices exceed the threshold
5. **Repeats** - Schedules the next check based on your interval

The app includes a **cooldown period** (30 minutes) to prevent notification spam during extended high-price periods.

## Understanding the Notifications

When you receive a notification, it includes:

- **Price**: Current feed-in price (c/kWh)
- **Spot Price**: Wholesale electricity price (c/kWh)
- **Level**: Price descriptor (spike, high, neutral, low, etc.)
- **Renewables**: Current renewable energy percentage in the grid
- **Valid Until**: When this price period ends
- **Estimate Status**: Whether the price is confirmed or estimated

Example notification:
```
🔥 High Feed-In Price: 18.5c/kWh
Great time to export solar power!
Spot: 12.3c/kWh | Renewables: 65%
Valid until: 14:30 (estimate)
```

## Running as a Service

### Windows (Task Scheduler)

1. Build the application: `npm run build`
2. Create a batch file `start-amber-monitor.bat`:
   ```bat
   @echo off
   cd C:\path\to\amber
   node dist\index.js
   ```
3. Create a scheduled task in Task Scheduler to run on startup

### macOS/Linux (systemd)

Create a systemd service file `/etc/systemd/system/amber-monitor.service`:

```ini
[Unit]
Description=Amber Price Monitor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/amber
ExecStart=/usr/bin/node /path/to/amber/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable amber-monitor
sudo systemctl start amber-monitor
sudo systemctl status amber-monitor
```

### PM2 (Process Manager)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name amber-monitor
pm2 save
pm2 startup
```

## Troubleshooting

### "No active sites found"

- Verify your API key is correct
- Check that your Amber account has an active site
- Ensure your site has solar/feed-in configured

### "No feed-in channel found"

- Confirm you have solar panels connected to your Amber account
- Check your site configuration on [app.amber.com.au](https://app.amber.com.au)

### Desktop notifications not working

**Windows**: Should work out of the box

**macOS**: Grant terminal app notification permissions:
- System Preferences → Notifications → Terminal/iTerm → Allow notifications

**Linux**: Ensure `libnotify` is installed:
```bash
sudo apt-get install libnotify-bin  # Debian/Ubuntu
sudo yum install libnotify           # RHEL/CentOS
```

### API Rate Limits

The Amber API has rate limits. The app automatically:
- Logs when rate limits are running low
- Retries failed requests with exponential backoff
- Respects rate limit headers

If you hit rate limits, consider increasing your `CHECK_INTERVAL`.

## Development

### Project Structure

```
amber/
├── src/
│   ├── api/              # Amber API client
│   │   ├── client.ts     # HTTP client with retry logic
│   │   └── types.ts      # TypeScript types from OpenAPI
│   ├── config/           # Configuration management
│   │   ├── config.ts     # Config loader
│   │   └── types.ts      # Config schema (Zod)
│   ├── monitoring/       # Price monitoring logic
│   │   ├── price-monitor.ts
│   │   └── types.ts
│   ├── notifications/    # Notification system
│   │   ├── notifier.ts
│   │   └── channels/     # Pluggable notification channels
│   ├── scheduler/        # Cron scheduling
│   │   └── scheduler.ts
│   ├── utils/            # Utilities
│   │   └── logger.ts     # Pino logger
│   └── index.ts          # Application entry point
├── .env                  # Your configuration (not in git)
├── .env.example          # Example configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Notification Channels

To add a new notification channel (e.g., Slack, email, SMS):

1. Create a new file in `src/notifications/channels/`
2. Implement the `NotificationChannel` interface:

```typescript
import type { NotificationChannel } from './base.js';
import type { PriceAlert } from '../../monitoring/types.js';

export class SlackNotification implements NotificationChannel {
  name = 'slack';

  async send(alert: PriceAlert): Promise<void> {
    // Your implementation
  }

  isEnabled(): boolean {
    return config.notifications.channels.includes('slack');
  }
}
```

3. Register it in `src/notifications/notifier.ts`:

```typescript
this.channels = [
  new ConsoleNotification(),
  new DesktopNotification(),
  new SlackNotification(),  // Add your channel
];
```

## API Reference

### Amber Electric API

This app uses the official Amber Electric API:
- [API Documentation](https://app.amber.com.au/developers)
- [OpenAPI Specification](https://github.com/amberelectric/public-api)

Key endpoints used:
- `GET /sites` - List your sites
- `GET /sites/{siteId}/prices/current` - Get current prices

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Acknowledgments

- [Amber Electric](https://www.amber.com.au/) for providing wholesale electricity pricing
- Built with TypeScript, Node.js, and ❤️ for solar owners

## Support

For issues with:
- **This app**: Open a GitHub issue
- **Amber API**: Contact [dev@amber.com.au](mailto:dev@amber.com.au)
- **Amber account**: Contact [info@amber.com.au](mailto:info@amber.com.au)

---

**Happy solar exporting! ☀️⚡**
