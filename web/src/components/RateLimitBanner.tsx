import { useEffect, useState } from 'react';
import './RateLimitBanner.css';

interface RateLimitBannerProps {
  rateLimit: {
    limit: number | null;
    remaining: number | null;
    reset: number | null;
  } | null;
}

function RateLimitBanner({ rateLimit }: RateLimitBannerProps) {
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);

  useEffect(() => {
    if (!rateLimit?.reset) {
      setTimeUntilReset(0);
      return;
    }

    // Calculate initial time until reset
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = Math.max(0, rateLimit.reset! - now);
      setTimeUntilReset(secondsLeft);
    };

    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rateLimit?.reset]);

  // Don't show banner if we have plenty of requests remaining
  if (!rateLimit || rateLimit.remaining === null || rateLimit.remaining > 10) {
    return null;
  }

  const isRateLimitExceeded = rateLimit.remaining === 0;
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className={`rate-limit-banner ${isRateLimitExceeded ? 'exceeded' : 'warning'}`}>
      <div className="rate-limit-icon">
        {isRateLimitExceeded ? '⏱️' : '⚠️'}
      </div>
      <div className="rate-limit-content">
        {isRateLimitExceeded ? (
          <>
            <strong>Rate Limit Exceeded</strong>
            <p>
              API rate limit reached. Waiting for reset in{' '}
              <span className="countdown">{formatTime(timeUntilReset)}</span>
            </p>
          </>
        ) : (
          <>
            <strong>Rate Limit Low</strong>
            <p>
              {rateLimit.remaining} of {rateLimit.limit} requests remaining.
              {rateLimit.reset && ` Resets in ${formatTime(timeUntilReset)}`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default RateLimitBanner;
