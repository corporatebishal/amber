import { useState, useEffect } from 'react';
import './App.css';
import PriceDisplay from './components/PriceDisplay';
import PriceChart from './components/PriceChart';
import ForecastChart from './components/ForecastChart';

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
}

interface AppSettings {
  feedInThreshold: number;
  timezone: string;
  notificationChannels: string[];
}

function App() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [localHistory, setLocalHistory] = useState<PriceData['history']>([]);

  useEffect(() => {
    // Fetch initial data
    fetchPriceData();
    fetchSettings();

    // Poll every minute (Vercel serverless doesn't support WebSocket)
    const interval = setInterval(() => {
      fetchPriceData();
    }, 60000); // 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchPriceData = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('/api/prices');
      const data = await response.json();

      // Build local history since serverless can't store it
      if (data.current) {
        setLocalHistory(prev => {
          const newHistory = [{
            price: data.current.price,
            nemTime: data.current.nemTime,
            descriptor: data.current.descriptor,
            renewables: data.current.renewables,
            timestamp: new Date().toISOString(),
          }, ...prev];

          // Keep max 288 records (24 hours at 5min intervals)
          return newHistory.slice(0, 288);
        });
      }

      setPriceData({
        ...data,
        history: localHistory,
      });
      setLastUpdate(new Date());
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

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>⚡ Amber Price Monitor</h1>
          <div className="header-controls">
            <div className="status">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span className="status-text">
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <div className="last-update">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="vercel-badge">
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Deployed on Vercel</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="price-section">
          <PriceDisplay
            current={priceData?.current}
            threshold={settings?.feedInThreshold || 15}
          />
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h2>Price History (Session)</h2>
            <PriceChart
              history={localHistory}
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
      </main>

      <footer className="footer">
        <p>
          Monitoring feed-in prices from Amber Electric •
          Threshold: {settings?.feedInThreshold || 15}c/kWh •
          Updates every minute •
          Deployed on Vercel
        </p>
      </footer>
    </div>
  );
}

export default App;
