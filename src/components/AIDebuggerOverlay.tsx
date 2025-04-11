import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AggregateStatsView } from './AggregateStatsView';
import { TimelineEntry } from './TimelineEntry';
import { DecisionDetails } from './DecisionDetails';
import { XIcon } from '@heroicons/react/24/outline';

interface ProviderCandidate {
  id: string;
  score?: number;
  excluded?: boolean;
  stats?: {
    latency: number;
    successRate: number;
  };
}

interface ActiveCondition {
  name: string;
  isActive: boolean;
  description?: string;
}

interface AIDebuggerOverlayProps {
  timestamp: number;
  fallbackReason: string;
  strategyName: string;
  selectedProvider: string;
  providerCandidates: ProviderCandidate[];
  activeConditions: ActiveCondition[];
  onClose?: () => void;
  isOpen: boolean;
  auditData: any[];
  selectedEntry?: any;
  setSelectedEntry: (entry?: any) => void;
}

const mockData: AIDebuggerOverlayProps = {
  timestamp: Date.now(),
  fallbackReason: "Provider openai failed (timeout)",
  strategyName: "RoundRobin",
  selectedProvider: "mistral",
  providerCandidates: [
    { id: "openai", excluded: true, stats: { latency: 900, successRate: 0.75 } },
    { id: "anthropic", score: 0.85, stats: { latency: 200, successRate: 0.92 } },
    { id: "mistral", score: 0.92, stats: { latency: 150, successRate: 0.95 } }
  ],
  activeConditions: [
    { name: "FailureRate > 20%", isActive: true },
    { name: "Latency spike", isActive: false }
  ],
  isOpen: true,
  auditData: [],
  selectedEntry: undefined,
  setSelectedEntry: () => {}
};

export const AIDebuggerOverlay: React.FC<AIDebuggerOverlayProps> = ({
  timestamp = mockData.timestamp,
  fallbackReason = mockData.fallbackReason,
  strategyName = mockData.strategyName,
  selectedProvider = mockData.selectedProvider,
  providerCandidates = mockData.providerCandidates,
  activeConditions = mockData.activeConditions,
  onClose,
  isOpen,
  auditData,
  selectedEntry,
  setSelectedEntry
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 bg-gray-900 text-white rounded-lg shadow-xl p-4 z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">AI Debugger</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Timeline */}
            <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
              <AggregateStatsView auditData={auditData} />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Timeline Decisioni
                </h3>
                <div className="space-y-2">
                  {auditData.map((entry) => (
                    <TimelineEntry
                      key={entry.timestamp}
                      entry={entry}
                      isSelected={selectedEntry?.timestamp === entry.timestamp}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="w-2/3 overflow-y-auto">
              {selectedEntry ? (
                <DecisionDetails
                  entry={selectedEntry}
                  onClose={() => setSelectedEntry(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Seleziona una decisione dalla timeline
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 