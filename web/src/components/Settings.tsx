import { useState } from 'react';
import './Settings.css';

interface SettingsProps {
  settings: {
    feedInThreshold: number;
    checkInterval: string;
    notificationChannels: string[];
  };
  onUpdate: (newSettings: Partial<SettingsProps['settings']>) => void;
  onClose: () => void;
}

function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const [threshold, setThreshold] = useState(settings.feedInThreshold);
  const [interval, setInterval] = useState(settings.checkInterval);
  const [channels, setChannels] = useState<string[]>(settings.notificationChannels);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      feedInThreshold: threshold,
      checkInterval: interval,
      notificationChannels: channels,
    });
  };

  const toggleChannel = (channel: string) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const intervalPresets = [
    { label: 'Every 5 seconds (Fast - Testing)', value: '5s' },
    { label: 'Every 15 seconds', value: '15s' },
    { label: 'Every 30 seconds', value: '30s' },
    { label: 'Every 1 minute', value: '*/1 * * * *' },
    { label: 'Every 5 minutes (Recommended)', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
  ];

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="threshold">
              <span className="label-text">Price Alert Threshold</span>
              <span className="label-description">
                You'll be notified when feed-in price exceeds this value
              </span>
            </label>
            <div className="input-with-unit">
              <input
                id="threshold"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="input-field"
              />
              <span className="input-unit">c/kWh</span>
            </div>
            <div className="threshold-slider">
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>5c</span>
                <span>15c</span>
                <span>30c</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="interval">
              <span className="label-text">Check Interval</span>
              <span className="label-description">
                How often to check for price updates
              </span>
            </label>
            <select
              id="interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="input-field"
            >
              {intervalPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            <div className="interval-note">
              Current: <code>{interval}</code> (cron expression)
            </div>
          </div>

          <div className="form-group">
            <label>
              <span className="label-text">Notification Channels</span>
              <span className="label-description">
                Choose how you want to be notified
              </span>
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={channels.includes('console')}
                  onChange={() => toggleChannel('console')}
                />
                <span>Console Logging</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={channels.includes('desktop')}
                  onChange={() => toggleChannel('desktop')}
                />
                <span>Desktop Notifications</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              Save Changes
            </button>
          </div>

          <div className="settings-note">
            <strong>Note:</strong> Some changes (like check interval) require restarting the application to take effect.
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
