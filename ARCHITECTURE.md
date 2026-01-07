# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Amber Price Monitor                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Browser    │    │   Backend    │    │  Amber API   │ │
│  │  Dashboard   │◄──►│    Server    │◄──►│   (Cloud)    │ │
│  │   (React)    │    │ (Node.js/TS) │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│        │                     │                              │
│        │                     ▼                              │
│        │              ┌──────────────┐                      │
│        │              │ Cron Scheduler│                     │
│        │              │  (5 minutes)  │                     │
│        │              └──────────────┘                      │
│        │                     │                              │
│        │                     ▼                              │
│        │              ┌──────────────┐                      │
│        └──────────────┤ Notifications │                     │
│                       │  Desktop/Log  │                     │
│                       └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Real-Time Updates (Every Minute)

```
1. Backend fetches from Amber API
   │
   ├─► Parses feed-in prices
   │
   ├─► Stores in price history (max 288 records)
   │
   └─► Broadcasts via WebSocket
       │
       └─► All connected browsers update instantly
```

### Alert Flow (When Price > Threshold)

```
1. Price Monitor checks current price
   │
   ├─► Price >= Threshold?
   │   │
   │   YES ──► Check cooldown (30 min)
   │           │
   │           └─► Send notifications:
   │               ├─► Desktop notification
   │               ├─► Console log
   │               └─► WebSocket broadcast
   │
   NO ──► Continue monitoring
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Backend (src/)                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Config   │  │    API     │  │ Monitoring │            │
│  │  (.env +   │  │  Client    │  │   Price    │            │
│  │   Zod)     │  │  (Axios)   │  │  Monitor   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Server    │  │ Scheduler  │  │Notifications│           │
│  │ Express +  │  │   (Cron)   │  │  Console + │            │
│  │ WebSocket  │  │            │  │  Desktop   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       Frontend (web/src/)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      App.tsx                            │ │
│  │  - WebSocket connection                                 │ │
│  │  - State management                                     │ │
│  │  - API communication                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                    │
│        ┌─────────────────┼─────────────────┐                │
│        ▼                 ▼                 ▼                 │
│  ┌──────────┐     ┌───────────┐    ┌──────────┐           │
│  │  Price   │     │  Charts   │    │ Settings │           │
│  │ Display  │     │ History + │    │  Modal   │           │
│  │          │     │ Forecast  │    │          │           │
│  └──────────┘     └───────────┘    └──────────┘           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## API Endpoints

### REST API

```
GET  /api/health
     └─► Health check

GET  /api/prices/current
     └─► Current + forecast + history prices

GET  /api/settings
     └─► Current configuration

POST /api/settings
     └─► Update configuration
```

### WebSocket

```
ws://localhost:3000

Client ──connect──► Server
       ◄──────────── { type: 'price-update', data: {...} }
                     (sent every minute)
```

## Type System

```
┌─────────────────────────────────────────────────────────┐
│              OpenAPI Schema (swagger.json)               │
│                          │                               │
│                          ▼                               │
│              ┌───────────────────────┐                  │
│              │ TypeScript Interfaces │                  │
│              │  - Site               │                  │
│              │  - Interval           │                  │
│              │  - Channel            │                  │
│              │  - PriceDescriptor    │                  │
│              └───────────────────────┘                  │
│                          │                               │
│              ┌───────────┴───────────┐                  │
│              ▼                       ▼                   │
│         Backend Types           Frontend Types          │
│         (compile-time)          (compile-time)          │
│              │                       │                   │
│              ▼                       ▼                   │
│         Zod Schemas            Runtime Validation       │
│         (runtime)                                        │
└─────────────────────────────────────────────────────────┘
```

## State Management

### Backend State

```
┌─────────────────────────────────────────┐
│ PriceMonitor                            │
│ ├─ lastAlertTime (cooldown tracking)   │
│ └─ ALERT_COOLDOWN_MS = 30 minutes      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ WebServer                               │
│ ├─ priceHistory[] (max 288 records)    │
│ ├─ wss (WebSocket server)              │
│ └─ app (Express server)                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PriceScheduler                          │
│ ├─ task (cron job)                      │
│ ├─ isRunning (status flag)             │
│ └─ monitor + notifier instances         │
└─────────────────────────────────────────┘
```

### Frontend State

```
┌─────────────────────────────────────────┐
│ App Component State                     │
│ ├─ priceData (current + forecast + hist)│
│ ├─ settings (config from backend)       │
│ ├─ connectionStatus (ws status)         │
│ ├─ lastUpdate (timestamp)               │
│ └─ showSettings (modal toggle)          │
└─────────────────────────────────────────┘
```

## Execution Flow

### Application Startup

```
1. Load & validate .env configuration
   ↓
2. Initialize logger (Pino)
   ↓
3. Create API client (Amber)
   ↓
4. Start web server (Express + WebSocket)
   ↓
5. Create price monitor & scheduler
   ↓
6. Run immediate price check
   ↓
7. Start cron scheduler
   ↓
8. Setup graceful shutdown handlers
   ↓
9. Ready to serve dashboard
```

### Price Check Cycle

```
[Every 5 minutes via cron]
    │
    ├─► Fetch current prices from Amber
    │
    ├─► Filter feed-in channel
    │
    ├─► Check against threshold
    │       │
    │       ├─ Below threshold ──► Log & continue
    │       │
    │       └─ Above threshold ──► Check cooldown
    │                                    │
    │                                    ├─ In cooldown ──► Skip alert
    │                                    │
    │                                    └─ Can alert ──► Send notifications
    │
    └─► Broadcast to WebSocket clients
```

### WebSocket Update Cycle

```
[Every minute]
    │
    ├─► Fetch prices from Amber
    │
    ├─► Update price history
    │
    ├─► Format data for frontend
    │
    └─► Broadcast to all connected clients
            │
            └─► Frontend updates UI
                    ├─► Price display
                    ├─► History chart
                    └─► Forecast chart
```

## Error Handling Strategy

```
┌────────────────────────────────────────────────────┐
│                  Error Handling                     │
├────────────────────────────────────────────────────┤
│                                                     │
│  API Level:                                         │
│  ├─ Try/catch on all requests                      │
│  ├─ 3 retry attempts with exponential backoff      │
│  ├─ Detailed error logging                         │
│  └─ Graceful fallback                              │
│                                                     │
│  Scheduler Level:                                   │
│  ├─ Catch errors in cron callback                  │
│  ├─ Log errors but continue running                │
│  └─ Don't crash on single failure                  │
│                                                     │
│  WebSocket Level:                                   │
│  ├─ Automatic reconnection (client)                │
│  ├─ Fallback to HTTP polling                       │
│  └─ Error boundaries on frontend                   │
│                                                     │
│  Global Level:                                      │
│  ├─ Unhandled rejection handler                    │
│  ├─ Uncaught exception handler                     │
│  └─ Graceful shutdown on SIGINT/SIGTERM            │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Security Model

```
┌────────────────────────────────────────────────────┐
│                   Security Layers                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  1. API Key Protection                             │
│     ├─ Stored in .env (git-ignored)               │
│     ├─ Never exposed to frontend                   │
│     └─ Bearer token authentication                 │
│                                                     │
│  2. Configuration Validation                        │
│     ├─ Zod runtime validation                      │
│     ├─ Type safety with TypeScript                 │
│     └─ Sanitized file writes                       │
│                                                     │
│  3. Network Security                                │
│     ├─ CORS enabled for localhost                  │
│     ├─ WebSocket origin validation                 │
│     └─ HTTP → HTTPS in production                  │
│                                                     │
│  4. Input Validation                                │
│     ├─ All API responses validated                 │
│     ├─ User inputs sanitized                       │
│     └─ Type checking at runtime                    │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌────────────────────────────────────────────────────┐
│                  Performance                        │
├────────────────────────────────────────────────────┤
│                                                     │
│  Backend:                                           │
│  ├─ Efficient cron scheduling                      │
│  ├─ Limited history storage (288 records max)      │
│  ├─ WebSocket for push vs polling                  │
│  └─ Async/await for non-blocking I/O               │
│                                                     │
│  Frontend:                                          │
│  ├─ React hooks for minimal re-renders             │
│  ├─ Chart data limiting (24h max)                  │
│  ├─ Lazy loading of charts                         │
│  ├─ Production build minification                  │
│  └─ CSS transitions over JS animations             │
│                                                     │
│  Network:                                           │
│  ├─ WebSocket for real-time (vs HTTP polling)      │
│  ├─ Gzip compression in production                 │
│  ├─ Static file caching                            │
│  └─ API request batching                           │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
Current: Single instance, local deployment
         ├─ Handles 1 Amber account
         ├─ Unlimited browser connections
         └─ Low resource usage

Potential scaling paths:
├─ Multi-user: Add authentication + database
├─ Multi-site: Support multiple Amber sites
├─ Cloud: Deploy to AWS/Azure/GCP
├─ Clustering: Horizontal scaling with PM2
└─ Caching: Redis for price data
```

---

## Technology Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js 18+ | JavaScript runtime |
| **Backend Language** | TypeScript 5.7 | Type safety |
| **Web Framework** | Express 4.21 | REST API |
| **Real-time** | WebSocket (ws) | Live updates |
| **Scheduling** | node-cron 3.0 | Periodic tasks |
| **HTTP Client** | Axios 1.7 | API requests |
| **Validation** | Zod 3.24 | Runtime validation |
| **Logging** | Pino 9.6 | Structured logs |
| **Notifications** | node-notifier 10.0 | Desktop alerts |
| **Frontend Framework** | React 18.3 | UI components |
| **Frontend Language** | TypeScript 5.7 | Type safety |
| **Build Tool** | Vite 6.0 | Fast builds |
| **Charts** | Recharts 2.15 | Data visualization |
| **Environment** | dotenv 16.4 | Config management |

---

This architecture provides a solid foundation for a production-ready monitoring application with excellent separation of concerns, type safety, and real-time capabilities.
