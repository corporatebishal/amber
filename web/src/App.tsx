import { useState, useEffect } from 'react';
import './App.css';
import PriceDisplay from './components/PriceDisplay';
import PriceChart from './components/PriceChart';
import ForecastChart from './components/ForecastChart';
import ShortTermForecast from './components/ShortTermForecast';
import Settings from './components/Settings';
import RateLimitBanner from './components/RateLimitBanner';
import UsageChart from './components/UsageChart';
import Login from './components/Login';

interface PriceData {
  current: {
    price: number;
    spotPerKwh: number;
    descriptor: string;
    renewables: number;
    estimate: boolean;
    spikeStatus: string;
    endTime: string;
    nemTime: string;
  } | null;
  forecast: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    type: string;
  }>;
  history: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    timestamp: string;
  }>;
  rateLimit?: {
    limit: number | null;
    remaining: number | null;
    reset: number | null;
  };
}

interface AppSettings {
  feedInThreshold: number;
  checkInterval: string;
  notificationChannels: string[];
}

function App() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(60);
  const [rateLimit, setRateLimit] = useState<{
    limit: number | null;
    remaining: number | null;
    reset: number | null;
  } | null>(null);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Detect if running on Vercel (serverless, no WebSocket support)
  const isVercel = window.location.hostname.includes('vercel.app');

  // Calculate interval in seconds from settings
  const getIntervalSeconds = (interval: string | undefined): number => {
    if (!interval) return 60;
    if (interval.endsWith('s')) {
      return parseInt(interval.slice(0, -1));
    }
    return 60;
  };

  // Countdown timer
  useEffect(() => {
    const intervalSeconds = settings ? getIntervalSeconds(settings.checkInterval) : 60;

    const countdown = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1) {
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [lastUpdate, settings]);

  // Verify authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      verifyToken(token, storedUsername);
    }
  }, []);

  const verifyToken = async (token: string, storedUsername: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUsername(storedUsername);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
      }
    } catch (error) {
      console.error('Failed to verify token:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
    }
  };

  const handleLoginSuccess = (_token: string, username: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    setShowLogin(false);
    fetchUsageData();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'logout',
            token,
          }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(null);
    setUsageData([]);
  };

  useEffect(() => {
    // Fetch initial data
    fetchPriceData();
    fetchSettings();

    // Only fetch usage data if authenticated
    if (isAuthenticated) {
      fetchUsageData();
    }

    if (isVercel) {
      // Vercel: Use polling instead of WebSocket
      const interval = setInterval(() => {
        fetchPriceData();
      }, 60000); // Poll every minute

      setConnectionStatus('connected');

      return () => clearInterval(interval);
    } else {
      // Local: Use WebSocket for real-time updates
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port || 3000}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'price-update') {
          setPriceData(message.data);
          setLastUpdate(new Date());
          const intervalSeconds = settings ? getIntervalSeconds(settings.checkInterval) : 60;
          setNextUpdateIn(intervalSeconds);
          setConnectionStatus('connected');

          if (message.data.rateLimit) {
            setRateLimit(message.data.rateLimit);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      };

      // Fallback: Fetch data every minute if WebSocket disconnects
      const interval = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          fetchPriceData();
        }
      }, 60000);

      return () => {
        ws.close();
        clearInterval(interval);
      };
    }
  }, []);

  const fetchPriceData = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('/api/prices/current');
      const data = await response.json();

      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Price data received:', data);
      setPriceData(data);
      setLastUpdate(new Date());
      const intervalSeconds = settings ? getIntervalSeconds(settings.checkInterval) : 60;
      setNextUpdateIn(intervalSeconds);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      setConnectionStatus('disconnected');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage/current');
      if (response.ok) {
        const data = await response.json();
        if (data.usage) {
          setUsageData(data.usage);
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  const handleSettingsUpdate = async (newSettings: Partial<AppSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const result = await response.json();
      if (result.success) {
        await fetchSettings();
        alert('Settings updated successfully! Some changes may require a restart.');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>⚡ Amber</h1>

          {/* Mobile: Status + Hamburger */}
          <div className="mobile-header-controls">
            <div className="status">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span className="status-text">
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <button
              className="hamburger-button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
            >
              <span className={`hamburger-icon ${showMobileMenu ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          {/* Desktop: All controls */}
          <div className={`header-controls ${showMobileMenu ? 'mobile-open' : ''}`}>
            <div className="status desktop-only">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span className="status-text">
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <div className="last-update">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="next-update">
              Next update: {nextUpdateIn}s
            </div>
            {isAuthenticated ? (
              <>
                <div className="user-info">
                  👤 {username}
                </div>
                <button
                  className="logout-button"
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="login-button-header"
                onClick={() => {
                  setShowLogin(true);
                  setShowMobileMenu(false);
                }}
              >
                🔐 Login
              </button>
            )}
            <button
              className="settings-button"
              onClick={() => {
                setShowSettings(!showSettings);
                setShowMobileMenu(false);
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {showSettings && settings ? (
          <Settings
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onClose={() => setShowSettings(false)}
          />
        ) : (
          <>
            {/* Rate Limit Banner */}
            <RateLimitBanner rateLimit={rateLimit} />

            {/* Top row: Price and Usage */}
            <div className="content-grid">
              <div className="price-section">
                <PriceDisplay
                  current={priceData?.current}
                  threshold={settings?.feedInThreshold || 15}
                />
              </div>

              {/* Usage chart - only visible when authenticated */}
              {isAuthenticated ? (
                <div className="usage-section">
                  <UsageChart usage={usageData} />
                </div>
              ) : (
                <div className="usage-section locked">
                  <div className="locked-content">
                    <div className="lock-icon">🔒</div>
                    <h3>Usage Data Locked</h3>
                    <p>Login to view usage and cost information</p>
                    <button
                      className="unlock-button"
                      onClick={() => setShowLogin(true)}
                    >
                      Login to Unlock
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Next 2 Hours - Full width row */}
            <div className="forecast-short-term-section">
              <ShortTermForecast
                forecast={priceData?.forecast || []}
                threshold={settings?.feedInThreshold || 15}
              />
            </div>

            <div className="charts-section">
              <div className="chart-card">
                <h2>Price History (24 Hours)</h2>
                <PriceChart
                  history={priceData?.history || []}
                  threshold={settings?.feedInThreshold || 15}
                />
              </div>

              <div className="chart-card">
                <h2>Price Forecast (Next 24 Hours)</h2>
                <ForecastChart
                  forecast={priceData?.forecast || []}
                  threshold={settings?.feedInThreshold || 15}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Monitoring feed-in prices from Amber Electric •
          Threshold: {settings?.feedInThreshold || 15}c/kWh •
          Updates every minute
        </p>
        <p className="footer-credit">
          Built by <a href="https://bishal.com.au" target="_blank" rel="noopener noreferrer">Bishal</a>
        </p>
      </footer>

      {/* Login Modal */}
      {showLogin && <Login onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}

export default App;
