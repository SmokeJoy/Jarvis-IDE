import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SafetyIssue {
  type: string;
}

interface ErrorPieProps {
  data: SafetyIssue[];
}

// Colori per i tipi di issue
const COLORS: { [key: string]: string } = {
  'nested-call': '#FF8042', // Arancione
  'missing-import': '#0088FE', // Blu
  'raw-message': '#FFBB28', // Giallo
  'malformed-call': '#FF4242', // Rosso
  'default': '#00C49F', // Verde (fallback)
};

const ErrorPie: React.FC<ErrorPieProps> = ({ data }) => {
  // Aggrega i dati per tipo di issue
  const aggregatedData = data.reduce((acc, issue) => {
    const type = issue.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const chartData = Object.entries(aggregatedData).map(([name, value]) => ({
    name,
    value,
  }));

  if (chartData.length === 0) {
    return <p className="text-center text-gray-500">Nessun dato da visualizzare.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.default} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ErrorPie; 