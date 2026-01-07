import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import './ForecastChart.css';

interface ForecastChartProps {
  forecast: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    type: string;
  }>;
  threshold: number;
}

// Custom tooltip to show full date/time
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px',
      }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>
          {data.fullTime}
        </p>
        <p style={{ margin: 0, color: data.aboveThreshold ? '#10b981' : '#667eea' }}>
          Price: {payload[0].value.toFixed(2)}c/kWh
        </p>
        {data.renewables !== undefined && (
          <p style={{ margin: '5px 0 0 0', color: '#10b981', fontSize: '0.9em' }}>
            Renewables: {data.renewables}%
          </p>
        )}
        <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>
          {data.aboveThreshold ? '▲ Above threshold' : '▼ Below threshold'}
        </p>
      </div>
    );
  }
  return null;
};

function ForecastChart({ forecast, threshold }: ForecastChartProps) {
  const [showExpandedView, setShowExpandedView] = useState(false);

  if (!forecast || forecast.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No forecast data available...</div>;
  }

  const getPriceColor = (price: number, threshold: number) => {
    const diff = price - threshold;
    const percentDiff = (diff / threshold) * 100;

    if (price < threshold) {
      // Below threshold - shades of green
      if (percentDiff < -50) return '#059669'; // Dark green
      if (percentDiff < -20) return '#10b981'; // Green
      return '#6ee7b7'; // Light green
    } else {
      // Above threshold - shades of orange/red
      if (percentDiff > 100) return '#dc2626'; // Dark red
      if (percentDiff > 50) return '#ef4444'; // Red
      if (percentDiff > 20) return '#f97316'; // Orange
      return '#fbbf24'; // Light orange
    }
  };

  // Calculate actual 24-hour intervals
  const get24HourIntervals = () => {
    if (forecast.length === 0) return [];

    // Check if we have at least 2 intervals to determine the interval duration
    if (forecast.length >= 2) {
      const firstTime = new Date(forecast[0].nemTime).getTime();
      const secondTime = new Date(forecast[1].nemTime).getTime();
      const intervalMinutes = (secondTime - firstTime) / (1000 * 60);

      // Calculate how many intervals = 24 hours (1440 minutes)
      const intervalsFor24Hours = Math.ceil(1440 / intervalMinutes);
      return forecast.slice(0, Math.min(intervalsFor24Hours, forecast.length));
    }

    // Fallback: assume 30-min intervals, so 48 blocks = 24 hours
    return forecast.slice(0, Math.min(48, forecast.length));
  };

  const fullData = get24HourIntervals();

  // Format data for the chart
  const chartData = fullData.map(item => ({
    time: new Date(item.nemTime).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: item.price,
    renewables: item.renewables,
    aboveThreshold: item.price >= threshold,
    color: getPriceColor(item.price, threshold),
    fullTime: new Date(item.nemTime).toLocaleString('en-AU'),
  }));

  // Format ALL forecast data for expanded view
  const allForecastData = forecast.map(item => ({
    time: new Date(item.nemTime).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: item.price,
    renewables: item.renewables,
    aboveThreshold: item.price >= threshold,
    color: getPriceColor(item.price, threshold),
    fullTime: new Date(item.nemTime).toLocaleString('en-AU'),
  }));

  const renderChart = (height: number, isExpanded: boolean = false) => {
    const dataToShow = isExpanded ? allForecastData : chartData;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={dataToShow} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: isExpanded ? 9 : 11 }}
            interval={isExpanded ? Math.floor(dataToShow.length / 20) : Math.floor(dataToShow.length / 12)}
            angle={isExpanded ? -45 : 0}
            textAnchor={isExpanded ? 'end' : 'middle'}
            height={isExpanded ? 80 : 30}
          />
          <YAxis
            label={{ value: 'Price (c/kWh)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine
            y={threshold}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: `Threshold: ${threshold}c/kWh`, position: 'right', fill: '#f59e0b' }}
          />
          <Bar dataKey="price" name="Forecast Price" radius={[8, 8, 0, 0]}>
            {dataToShow.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const modal = showExpandedView ? (
    <div className="chart-modal-overlay" onClick={() => setShowExpandedView(false)}>
      <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal-header">
          <h2>Price Forecast - Full Available Data ({allForecastData.length} intervals)</h2>
          <button
            className="chart-modal-close"
            onClick={() => setShowExpandedView(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="chart-modal-body">
          {renderChart(650, true)}
          <div className="chart-modal-info">
            <p>Total intervals: {allForecastData.length} | Showing all available forecast data</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="forecast-chart-wrapper">
        {renderChart(400)}
        <button
          className="expand-chart-button"
          onClick={() => setShowExpandedView(true)}
          title="View larger chart"
        >
          🔍 View Larger
        </button>
      </div>

      {modal && createPortal(modal, document.body)}
    </>
  );
}

export default ForecastChart;
