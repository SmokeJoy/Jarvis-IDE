import React from 'react';
import { motion } from 'framer-motion';
import { MitigatorOverlayProps } from './MitigatorOverlay';
import { TimelineFilterBar } from './TimelineFilterBar';
import { useFilteredHistory } from '../hooks/useFilteredHistory';

interface DebuggerTimelineProps {
  history: MitigatorOverlayProps[];
  onSelect: (entry: MitigatorOverlayProps) => void;
  selectedIndex?: number;
}

export const DebuggerTimeline: React.FC<DebuggerTimelineProps> = ({
  history,
  onSelect,
  selectedIndex,
}) => {
  const { filteredHistory, filters, setFilters, availableProviders, availableStrategies } =
    useFilteredHistory(history);

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 w-64 bg-gray-900 text-white rounded-lg shadow-xl p-4 z-50">
      <h3 className="text-lg font-semibold mb-4">📅 Timeline Decisioni</h3>

      <TimelineFilterBar
        eventType={filters.eventType}
        provider={filters.provider}
        strategy={filters.strategy}
        availableProviders={availableProviders}
        availableStrategies={availableStrategies}
        onEventTypeChange={(type) => setFilters((prev) => ({ ...prev, eventType: type }))}
        onProviderChange={(provider) => setFilters((prev) => ({ ...prev, provider }))}
        onStrategyChange={(strategy) => setFilters((prev) => ({ ...prev, strategy }))}
      />

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredHistory.map((entry, index) => (
          <motion.div
            key={entry.timestamp}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-2 rounded cursor-pointer ${
              selectedIndex === index ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => onSelect(entry)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-xs text-gray-400">{entry.strategyName}</span>
            </div>
            <div className="text-xs text-gray-300 mt-1 truncate">{entry.fallbackReason}</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-green-400">{entry.selectedProvider}</span>
              <span className="mx-2 text-gray-500">→</span>
              <span className="text-xs text-gray-400">
                {entry.providerCandidates.length} candidati
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
