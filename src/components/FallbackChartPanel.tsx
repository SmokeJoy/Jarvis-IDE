import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFallbackChartData } from '../hooks/useFallbackChartData';
import { FallbackAudit } from '../types/fallback';

interface FallbackChartPanelProps {
  audits: FallbackAudit[];
  className?: string;
}

export const FallbackChartPanel: React.FC<FallbackChartPanelProps> = ({
  audits,
  className = '',
}) => {
  const { latency, successRate, cost, usage } = useFallbackChartData(audits);

  return (
    <div className={`p-4 bg-gray-900 text-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4">📊 Fallback Strategy Analytics</h2>

      {/* Latenza */}
      <div className="mb-6">
        <h3 className="text-lg mb-2">⏱️ Latenza Media</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latency}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
              }}
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ fill: '#facc15', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#facc15' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Successi e Fallimenti */}
      <div className="mb-6">
        <h3 className="text-lg mb-2">✅ Successi / ❌ Fallimenti</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={successRate}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Bar dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} name="Successi" />
            <Bar dataKey="failure" fill="#ef4444" radius={[4, 4, 0, 0]} name="Fallimenti" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Costi */}
      <div className="mb-6">
        <h3 className="text-lg mb-2">💰 Costi Totali</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={cost}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
              }}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#38bdf8"
              fill="#0ea5e9"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Uso */}
      <div className="mb-6">
        <h3 className="text-lg mb-2">📈 Richieste Totali</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={usage}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
              }}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <Bar dataKey="requests" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
