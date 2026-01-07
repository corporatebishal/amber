# Amber Price Monitor - Features Overview

## 🎯 Core Features

### Real-Time Price Monitoring
- ✅ Fetches current feed-in prices from Amber Electric API
- ✅ Updates every minute via WebSocket connection
- ✅ Displays spot wholesale prices
- ✅ Shows renewable energy percentage
- ✅ Indicates price descriptors (spike, high, neutral, low)
- ✅ Tracks spike status (none, potential, spike)

### Smart Alerts
- ✅ Configurable price threshold
- ✅ Desktop notifications when price exceeds threshold
- ✅ Visual alerts on web dashboard
- ✅ 30-minute cooldown to prevent spam
- ✅ Console logging for all events

### Web Dashboard (NEW!)
- ✅ Modern, responsive UI with gradient design
- ✅ Real-time price display with large, easy-to-read numbers
- ✅ Live connection status indicator
- ✅ Price history chart (24 hours)
- ✅ Forecast chart (next 24 hours)
- ✅ Interactive settings panel
- ✅ Mobile-friendly responsive design

### Interactive Settings
- ✅ Adjust threshold with slider or input (5-30 c/kWh)
- ✅ Change check interval from dropdown
- ✅ Toggle notification channels
- ✅ Settings persist to .env file
- ✅ Real-time validation

### Data Visualization
- ✅ Line chart for price history
- ✅ Bar chart for forecast prices
- ✅ Color-coded bars (green = above threshold)
- ✅ Threshold reference line
- ✅ Renewable percentage tracking
- ✅ Responsive charts that adapt to screen size

### Price Intelligence
- ✅ Current price with estimate indicator
- ✅ Next 24 hours forecast
- ✅ Last 24 hours history
- ✅ Price validity period (until next interval)
- ✅ Spot price vs final price comparison

## 🚀 Technical Features

### Backend
- ✅ Node.js with TypeScript
- ✅ Express REST API
- ✅ WebSocket server for real-time updates
- ✅ Robust error handling with retry logic
- ✅ Rate limit awareness
- ✅ Structured logging with Pino
- ✅ Zod schema validation
- ✅ Graceful shutdown handling

### Frontend
- ✅ React 18 with TypeScript
- ✅ Vite for fast builds
- ✅ Recharts for beautiful visualizations
- ✅ WebSocket client for live updates
- ✅ Automatic reconnection
- ✅ Fallback polling if WebSocket fails
- ✅ CSS animations and transitions

### API Integration
- ✅ Type-safe Amber Electric API client
- ✅ Automatic site detection
- ✅ Multiple channel support (general, controlled load, feed-in)
- ✅ Exponential backoff retry
- ✅ Request/response logging
- ✅ Error handling for all API calls

### Configuration
- ✅ Environment-based configuration
- ✅ Runtime validation with Zod
- ✅ Hot configuration reload (some settings)
- ✅ Multiple timezone support
- ✅ Flexible cron expressions
- ✅ Easy .env file editing

### Scheduling
- ✅ Cron-based price checks
- ✅ Configurable intervals (1 min to 1 hour+)
- ✅ Timezone-aware scheduling
- ✅ Immediate check on startup
- ✅ Independent of web updates

### Notifications
- ✅ Console logging
- ✅ Desktop notifications (Windows/macOS/Linux)
- ✅ Multi-channel support
- ✅ Extensible architecture for new channels
- ✅ Per-channel enable/disable

## 📊 Dashboard Features

### Price Display Card
- Large, prominent current price
- Color-coded price descriptor
- Estimate/confirmed indicator
- Alert banner when above threshold
- Spot price comparison
- Renewable percentage
- Valid until time
- Spike status

### Charts
- **History Chart**
  - Line graph of past 24 hours
  - Threshold reference line
  - Hover tooltips
  - Responsive scaling

- **Forecast Chart**
  - Bar chart of next 24 hours
  - Color-coded bars
  - Threshold reference
  - Interactive tooltips

### Settings Modal
- Threshold slider (5-30 c/kWh)
- Numeric input for precision
- Interval dropdown with presets
- Notification channel toggles
- Save/Cancel actions
- Visual feedback

### Status Indicators
- Live/Connecting/Offline status
- Animated pulse indicator
- Last update timestamp
- WebSocket connection health

## 🎨 User Experience

### Visual Design
- Modern gradient background
- Glassmorphism effects
- Smooth animations
- Color-coded alerts
- Emoji indicators
- Responsive layout

### Responsiveness
- Desktop optimized (1400px max width)
- Tablet support (grid layout adjusts)
- Mobile friendly (single column)
- Touch-friendly controls
- Readable on all screens

### Accessibility
- Large, readable fonts
- High contrast text
- Clear labels
- Semantic HTML
- Keyboard navigation support

## 💡 Use Cases

### Solar Export Optimization
1. Monitor feed-in prices in real-time
2. Get alerted when prices spike
3. Manually adjust battery discharge
4. Maximize solar export revenue

### Price Tracking
1. View historical price trends
2. Understand price patterns
3. Plan energy usage
4. Forecast future prices

### Automation Potential
1. Integrate with home automation
2. Control smart devices based on price
3. Optimize battery charging/discharging
4. Schedule high-power devices

## 🔄 Real-Time Updates

### WebSocket Connection
- Establishes on page load
- Sends price updates every minute
- Automatic reconnection on disconnect
- Fallback to HTTP polling

### Update Flow
1. Backend fetches from Amber API every minute
2. Updates price history (max 288 records = 24 hours)
3. Broadcasts to all WebSocket clients
4. Frontend updates UI immediately
5. Charts re-render with new data

## 🔒 Security & Reliability

### API Security
- API key stored in .env (not in git)
- Bearer token authentication
- HTTPS for production
- CORS enabled for web UI

### Error Handling
- API request retries (3 attempts)
- Exponential backoff
- Graceful degradation
- User-friendly error messages
- Comprehensive logging

### Data Integrity
- TypeScript type safety
- Runtime validation (Zod)
- API response validation
- Safe null/undefined handling

## 📈 Performance

### Optimization
- Efficient WebSocket updates
- Chart data limiting (24h history, 24h forecast)
- Lazy loading (charts only render when data available)
- Minimal re-renders with React
- Production build minification

### Resource Usage
- Low CPU usage
- Minimal memory footprint
- Small network payload
- Efficient cron scheduling

## 🎯 Future Enhancement Potential

### Possible Extensions
- [ ] Add more notification channels (email, SMS, Slack)
- [ ] Historical data export (CSV, JSON)
- [ ] Price analytics and insights
- [ ] Multiple site support
- [ ] Custom alert rules (e.g., sustained high price)
- [ ] Dark mode theme
- [ ] User accounts and preferences
- [ ] Mobile app (React Native)
- [ ] Home automation integrations
- [ ] Price prediction ML model

### Easy to Extend
- Pluggable notification channels
- Modular component architecture
- RESTful API for integrations
- WebSocket for real-time data
- TypeScript for type safety

---

## Summary

This Amber Price Monitor is a **complete, production-ready application** with:

✅ Real-time monitoring
✅ Beautiful web dashboard
✅ Interactive configuration
✅ Smart notifications
✅ Price visualization
✅ Robust error handling
✅ Modern tech stack
✅ Full TypeScript type safety
✅ Responsive design
✅ Easy to extend

Perfect for solar owners who want to maximize their feed-in revenue! ☀️⚡
