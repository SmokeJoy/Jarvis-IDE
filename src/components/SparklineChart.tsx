import { LineChart, Line, Area, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const SparklineChart = ({
  data,
  color = '#10b981',
  height = 20,
  width = 60,
}: SparklineChartProps) => {
  const chartData = data.map((value, index) => ({
    value,
    index,
  }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#gradient-${color})`}
            fillOpacity={1}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
