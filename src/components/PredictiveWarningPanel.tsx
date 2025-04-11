import { motion } from 'framer-motion';
import { WarningEntry, WarningLevel } from '../hooks/usePredictiveWarnings';
import { useProviderSeries } from '../hooks/useProviderSeries';
import { SparklineChart } from './SparklineChart';
import { eventBus } from '../lib/eventBus';
import { AuditEntry } from '../types/audit';

interface PredictiveWarningPanelProps {
  warnings: WarningEntry[];
  auditData: AuditEntry[];
}

const getLevelColor = (level: WarningLevel) => {
  switch (level) {
    case 'moderate':
      return 'text-yellow-400';
    case 'high':
      return 'text-orange-400';
    case 'critical':
      return 'text-red-400';
  }
};

const getLevelIcon = (level: WarningLevel) => {
  switch (level) {
    case 'moderate':
      return '⚠️';
    case 'high':
      return '🚨';
    case 'critical':
      return '💥';
  }
};

const getSuccessRateColor = (rate: number) => {
  if (rate > 0.8) return '#10b981'; // verde
  if (rate > 0.5) return '#f59e0b'; // arancione
  return '#ef4444'; // rosso
};

const formatWarningMessage = (warning: WarningEntry) => {
  switch (warning.signal) {
    case 'latency':
      return `High latency: ${warning.value.toFixed(0)}ms`;
    case 'successRate':
      return `Low success rate: ${(warning.value * 100).toFixed(1)}%`;
    case 'failureStreak':
      return `Failure streak (${warning.value}x)`;
  }
};

export const PredictiveWarningPanel = ({ warnings, auditData }: PredictiveWarningPanelProps) => {
  const providerSeries = useProviderSeries(auditData);

  const handleSimulateFailure = (warning: WarningEntry) => {
    eventBus.emit('provider:failure', {
      providerId: warning.provider,
      reason: `Predicted failure (${warning.signal})`,
      timestamp: Date.now(),
      __predicted: true
    });
  };

  if (warnings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 w-80 bg-gray-800 rounded-lg shadow-xl p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400">🔮</span>
          <span className="text-white font-semibold">PREDICTIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {warnings.map((warning, index) => {
          const series = providerSeries[warning.provider] || [];
          const currentRate = series[series.length - 1] || 0;
          const color = getSuccessRateColor(currentRate);

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded ${
                warning.level === 'critical' ? 'bg-red-900/20' :
                warning.level === 'high' ? 'bg-orange-900/20' :
                'bg-yellow-900/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={getLevelColor(warning.level)}>
                  {getLevelIcon(warning.level)}
                </span>
                <span className="text-white">
                  [{warning.provider}] {formatWarningMessage(warning)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {series.length > 0 && (
                  <div className="opacity-75">
                    <SparklineChart
                      data={series}
                      color={color}
                      height={20}
                      width={60}
                    />
                  </div>
                )}
                <button
                  onClick={() => handleSimulateFailure(warning)}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Simula
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}; 