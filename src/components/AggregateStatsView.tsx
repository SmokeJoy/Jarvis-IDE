import { motion } from 'framer-motion';
import { useAggregateStats } from '../hooks/useAggregateStats';
import { AuditEntry } from '../types/audit';

interface AggregateStatsViewProps {
  auditData: AuditEntry[];
}

export const AggregateStatsView = ({ auditData }: AggregateStatsViewProps) => {
  const stats = useAggregateStats(auditData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-4 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Statistiche Aggregate</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Statistiche Provider */}
        <div className="space-y-2">
          <h4 className="text-md font-medium text-blue-400">Provider</h4>
          {Object.entries(stats.providers).map(([provider, data]) => (
            <div key={provider} className="bg-gray-700 rounded p-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{provider}</span>
                <span className="text-sm text-gray-300">{data.totalRequests} richieste</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fallback:</span>
                  <span className="text-red-400">{data.totalFallbacks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">
                    {(data.averageSuccessRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Latency Media:</span>
                  <span className="text-yellow-400">{data.averageLatency.toFixed(0)}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistiche Strategie */}
        <div className="space-y-2">
          <h4 className="text-md font-medium text-green-400">Strategie</h4>
          {Object.entries(stats.strategies).map(([strategy, data]) => (
            <div key={strategy} className="bg-gray-700 rounded p-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{strategy}</span>
                <span className="text-sm text-gray-300">{data.totalDecisions} decisioni</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">{(data.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Provider più usato:</span>
                  <span className="text-blue-400">{data.mostUsedProvider}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Periodo analizzato:</span>
          <span>
            {new Date(stats.timeRange.start).toLocaleString()} -{' '}
            {new Date(stats.timeRange.end).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
