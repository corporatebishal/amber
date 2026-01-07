import './ShortTermForecast.css';

interface ShortTermForecastProps {
  forecast: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    type: string;
  }>;
  threshold: number;
}

function ShortTermForecast({ forecast, threshold }: ShortTermForecastProps) {
  // Calculate how many intervals for 2 hours based on actual data
  const getShortTermIntervals = () => {
    if (forecast.length === 0) return [];

    // Check if we have at least 2 intervals to determine the interval duration
    if (forecast.length >= 2) {
      const firstTime = new Date(forecast[0].nemTime).getTime();
      const secondTime = new Date(forecast[1].nemTime).getTime();
      const intervalMinutes = (secondTime - firstTime) / (1000 * 60);

      // Calculate how many intervals = 2 hours (120 minutes)
      const intervalsFor2Hours = Math.ceil(120 / intervalMinutes);
      return forecast.slice(0, intervalsFor2Hours);
    }

    // Fallback: assume 30-min intervals, so 4 blocks = 2 hours
    return forecast.slice(0, 4);
  };

  const shortTermIntervals = getShortTermIntervals();

  if (shortTermIntervals.length === 0) {
    return (
      <div className="short-term-forecast loading">
        <p>Loading short-term forecast...</p>
      </div>
    );
  }

  const formatTime = (nemTime: string) => {
    const date = new Date(nemTime);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPriceColorClass = (price: number, threshold: number) => {
    const diff = price - threshold;
    const percentDiff = (diff / threshold) * 100;

    if (price < threshold) {
      // Below threshold - shades of green
      if (percentDiff < -50) return 'very-low'; // Dark green
      if (percentDiff < -20) return 'low'; // Green
      return 'slightly-low'; // Light green
    } else {
      // Above threshold - shades of orange/red
      if (percentDiff > 100) return 'extreme-high'; // Dark red
      if (percentDiff > 50) return 'very-high'; // Red
      if (percentDiff > 20) return 'high'; // Orange
      return 'slightly-high'; // Light orange
    }
  };

  return (
    <div className="short-term-forecast">
      <div className="forecast-header">
        <h3>⚡ Next 2 Hours</h3>
        <p className="forecast-subtitle">Threshold: {threshold}¢/kWh</p>
      </div>

      <div className="forecast-grid">
        {shortTermIntervals.map((interval, index) => {
          const isAboveThreshold = interval.price >= threshold;
          const colorClass = getPriceColorClass(interval.price, threshold);

          return (
            <div
              key={index}
              className={`interval-block ${colorClass} ${isAboveThreshold ? 'above-threshold' : 'below-threshold'}`}
              title={`${interval.price.toFixed(1)}¢/kWh - ${interval.descriptor} - ${interval.renewables}% renewable`}
            >
              <div className="block-time">
                {formatTime(interval.nemTime)}
              </div>
              <div className="block-price">
                {interval.price.toFixed(1)}
                <span className="block-unit">¢</span>
              </div>
              <div className="block-indicator">
                {isAboveThreshold ? '▲' : '▼'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="forecast-info">
        <div className="info-item">
          <span className="info-icon above">▲</span>
          <span className="info-text">Above threshold</span>
        </div>
        <div className="info-item">
          <span className="info-icon below">▼</span>
          <span className="info-text">Below threshold</span>
        </div>
      </div>
    </div>
  );
}

export default ShortTermForecast;
