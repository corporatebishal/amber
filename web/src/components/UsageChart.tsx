import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './UsageChart.css';

interface UsageChartProps {
  usage: Array<{
    kwh: number;
    cost: number;
    nemTime: string;
    channelType: string;
    quality: string;
  }>;
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Auto-detect if cost is in cents (same logic as below)
    const costValue = Math.abs(data.cost || 0);
    const kwhValue = Math.abs(data.kwh || 0);
    const costPerKwh = kwhValue > 0 ? costValue / kwhValue : 0;
    const displayCost = costPerKwh > 0.80 ? costValue / 100 : costValue;

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
        <p style={{ margin: 0, color: data.isConsumption ? '#ef4444' : '#10b981' }}>
          {data.isConsumption ? 'Consumed' : 'Exported'}: {kwhValue.toFixed(2)} kWh
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#667eea', fontSize: '0.9em' }}>
          Cost: ${displayCost.toFixed(2)}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>
          {data.quality === 'billable' ? '✓ Billable' : '~ Estimated'}
        </p>
      </div>
    );
  }
  return null;
};

function UsageChart({ usage }: UsageChartProps) {
  if (!usage || usage.length === 0) {
    return (
      <div className="usage-chart-container loading">
        <div className="usage-header">
          <h3>📊 Usage & Export</h3>
          <p className="usage-subtitle">Last 24 Hours</p>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No usage data available yet...
        </div>
      </div>
    );
  }

  // Debug: log raw data
  console.log('Raw usage data:', usage);

  // Separate consumption and feed-in data
  const consumptionData = usage.filter(item => item.channelType === 'general');
  const feedInData = usage.filter(item => item.channelType === 'feedIn');

  console.log('Consumption data:', consumptionData);
  console.log('Feed-in data:', feedInData);

  // Calculate totals
  const totalConsumption = Math.abs(consumptionData.reduce((sum, item) => sum + (item.kwh || 0), 0));
  const totalExport = Math.abs(feedInData.reduce((sum, item) => sum + (item.kwh || 0), 0));

  // Calculate raw costs
  const rawTotalCost = Math.abs(consumptionData.reduce((sum, item) => sum + (item.cost || 0), 0));
  const rawTotalEarnings = Math.abs(feedInData.reduce((sum, item) => sum + (item.cost || 0), 0));

  // Check if costs seem to be in cents
  // Typical electricity is 15-50 cents per kWh ($0.15-$0.50)
  // If we're seeing > $1/kWh, costs are likely in cents and need /100
  const costPerKwh = totalConsumption > 0 ? rawTotalCost / totalConsumption : 0;

  // More aggressive check: if cost/kWh > $0.80, it's almost certainly in cents
  // Australian electricity rarely exceeds 50c/kWh retail
  const seemsLikeCents = costPerKwh > 0.80;

  // Convert to dollars if needed
  const totalCost = seemsLikeCents ? rawTotalCost / 100 : rawTotalCost;
  const totalEarnings = seemsLikeCents ? rawTotalEarnings / 100 : rawTotalEarnings;
  const netCost = totalCost - totalEarnings;

  console.log('Totals:', {
    totalConsumption,
    totalExport,
    rawTotalCost,
    rawTotalEarnings,
    costPerKwh,
    seemsLikeCents,
    totalCost,
    totalEarnings,
    netCost
  });

  // Format data for chart (combine both channels)
  const chartData = [...consumptionData, ...feedInData]
    .sort((a, b) => new Date(a.nemTime).getTime() - new Date(b.nemTime).getTime())
    .map(item => ({
      time: new Date(item.nemTime).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      kwh: item.kwh,
      cost: item.cost,
      channelType: item.channelType,
      isConsumption: item.channelType === 'general',
      quality: item.quality,
      fullTime: new Date(item.nemTime).toLocaleString('en-AU'),
    }));

  return (
    <div className="usage-chart-container">
      <div className="usage-header">
        <h3>📊 Usage & Export</h3>
        <p className="usage-subtitle">Last 24 Hours</p>
      </div>

      <div className="usage-summary">
        <div className="summary-item consumption">
          <div className="summary-label">Consumed</div>
          <div className="summary-value">{totalConsumption.toFixed(2)} kWh</div>
          <div className="summary-cost">${totalCost.toFixed(2)}</div>
        </div>

        <div className="summary-item export">
          <div className="summary-label">Exported</div>
          <div className="summary-value">{totalExport.toFixed(2)} kWh</div>
          <div className="summary-cost">${totalEarnings.toFixed(2)}</div>
        </div>

        <div className={`summary-item net ${netCost < 0 ? 'positive' : 'negative'}`}>
          <div className="summary-label">Net</div>
          <div className="summary-value">{netCost < 0 ? 'Earning' : 'Cost'}</div>
          <div className="summary-cost">${Math.abs(netCost).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="exportGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="kwh"
              stroke="#667eea"
              fillOpacity={1}
              fill="url(#consumptionGradient)"
              name="Usage (kWh)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default UsageChart;
