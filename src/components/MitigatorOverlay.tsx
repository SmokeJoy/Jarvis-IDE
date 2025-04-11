import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DebuggerTimeline } from './DebuggerTimeline';
import { SnapshotDetail } from './SnapshotDetail';
import { DecisionGraphView } from './DecisionGraphView';
import { useDebuggerOverlay } from '../hooks/useDebuggerOverlay';
import { useFilteredHistory } from '../hooks/useFilteredHistory';
import { useAutoMitigation } from '../contexts/AutoMitigationContext';
import { AutoMitigationToast } from './AutoMitigationToast';
import { PredictiveWarningPanel } from './PredictiveWarningPanel';

interface MitigatorOverlayProps {
  selectedProvider: string;
  excludedProviders: string[];
  strategy: string;
  timestamp: Date;
  details: string;
  type: 'provider_change' | 'predictive' | 'replay';
  stats?: {
    latency: number;
    successRate: number;
  };
}

const mockData: MitigatorOverlayProps = {
  selectedProvider: 'openai',
  excludedProviders: ['anthropic'],
  strategy: 'adaptive_fallback',
  timestamp: new Date(),
  details: 'Provider change triggered by high latency',
  type: 'provider_change',
  stats: {
    latency: 1200,
    successRate: 0.95
  }
};

export const MitigatorOverlay: React.FC<MitigatorOverlayProps> = ({
  selectedProvider,
  excludedProviders,
  strategy,
  timestamp,
  details,
  type,
  stats
}) => {
  const { current, history, addEntry, clearHistory } = useDebuggerOverlay();
  const { filteredHistory, setFilter } = useFilteredHistory(history);
  const { isActive, confidence } = useAutoMitigation();
  const [selectedEntry, setSelectedEntry] = useState<MitigatorOverlayProps | null>(null);

  const handleAddEntry = () => {
    addEntry({
      selectedProvider,
      excludedProviders,
      strategy,
      timestamp,
      details,
      type,
      stats
    });
  };

  const handleSelectEntry = (entry: MitigatorOverlayProps) => {
    setSelectedEntry(entry);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mitigator AI
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddEntry}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Aggiungi
            </button>
            <button
              onClick={clearHistory}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Pulisci
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtro Storico
          </label>
          <select
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tutti</option>
            <option value="provider_change">Cambi Provider</option>
            <option value="predictive">Predittivo</option>
            <option value="replay">Replay</option>
          </select>
        </div>

        <div className="space-y-4">
          <DebuggerTimeline
            history={filteredHistory}
            onSelect={handleSelectEntry}
          />

          {selectedEntry && (
            <SnapshotDetail data={selectedEntry} />
          )}

          {current && (
            <DecisionGraphView entry={current} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4"
          >
            <AutoMitigationToast confidence={confidence} />
          </motion.div>
        )}
      </AnimatePresence>

      <PredictiveWarningPanel />
    </div>
  );
}; 