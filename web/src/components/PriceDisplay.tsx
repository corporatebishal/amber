import './PriceDisplay.css';

interface PriceDisplayProps {
  current: {
    price: number;
    spotPerKwh: number;
    descriptor: string;
    renewables: number;
    estimate: boolean;
    spikeStatus: string;
    endTime: string;
    nemTime: string;
  } | null | undefined;
  threshold: number;
}

function PriceDisplay({ current, threshold }: PriceDisplayProps) {
  if (!current) {
    return (
      <div className="price-display loading">
        <p>Loading current price...</p>
      </div>
    );
  }

  const isAboveThreshold = current.price >= threshold;
  const endTime = new Date(current.endTime).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getDescriptorColor = (descriptor: string): string => {
    switch (descriptor) {
      case 'spike':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'neutral':
        return '#3b82f6';
      case 'low':
      case 'veryLow':
      case 'extremelyLow':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getDescriptorEmoji = (descriptor: string): string => {
    switch (descriptor) {
      case 'spike':
        return '🔥';
      case 'high':
        return '⚡';
      case 'neutral':
        return '💡';
      case 'low':
      case 'veryLow':
      case 'extremelyLow':
        return '💚';
      default:
        return '⭐';
    }
  };

  return (
    <div className={`price-display ${isAboveThreshold ? 'alert' : ''}`}>
      <div className="price-main">
        <div className="price-value-section">
          <span className="price-label">Current Feed-In Price</span>
          <div className="price-value">
            <span className="price-number">{current.price.toFixed(2)}</span>
            <span className="price-unit">c/kWh</span>
          </div>
          <div className="price-meta">
            <span
              className="price-descriptor"
              style={{ color: getDescriptorColor(current.descriptor) }}
            >
              {getDescriptorEmoji(current.descriptor)} {current.descriptor.toUpperCase()}
            </span>
            {current.estimate && <span className="estimate-badge">ESTIMATE</span>}
          </div>
        </div>

        {isAboveThreshold && (
          <div className="alert-banner">
            <span className="alert-icon">🌟</span>
            <div className="alert-content">
              <strong>EXCELLENT TIME TO SELL!</strong>
              <p>Price is above your threshold of {threshold}c/kWh</p>
            </div>
          </div>
        )}
      </div>

      <div className="price-details">
        <div className="detail-item">
          <span className="detail-label">Wholesale Spot</span>
          <span className="detail-value">{current.spotPerKwh.toFixed(2)}c/kWh</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Renewables</span>
          <span className="detail-value renewables">
            🌱 {current.renewables.toFixed(0)}%
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Valid Until</span>
          <span className="detail-value">{endTime}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Spike Status</span>
          <span className={`detail-value spike-${current.spikeStatus}`}>
            {current.spikeStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PriceDisplay;
