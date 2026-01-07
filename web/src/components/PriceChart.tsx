import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceChartProps {
  history: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    timestamp: string;
  }>;
  threshold: number;
}

// Custom tooltip to show full date/time
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px',
      }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>
          {payload[0].payload.fullTime}
        </p>
        <p style={{ margin: 0, color: '#667eea' }}>
          Price: {payload[0].value.toFixed(2)}c/kWh
        </p>
        {payload[0].payload.renewables !== undefined && (
          <p style={{ margin: '5px 0 0 0', color: '#10b981', fontSize: '0.9em' }}>
            Renewables: {payload[0].payload.renewables}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

function PriceChart({ history, threshold }: PriceChartProps) {
  if (!history || history.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No historical data available yet...</div>;
  }

  // Format data for the chart (reverse to show oldest first)
  const chartData = [...history].reverse().map(item => ({
    time: new Date(item.nemTime).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: item.price,
    renewables: item.renewables,
    fullTime: new Date(item.nemTime).toLocaleString('en-AU'),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
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
        <Line
          type="monotone"
          dataKey="price"
          stroke="#667eea"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
          name="Feed-In Price"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PriceChart;
