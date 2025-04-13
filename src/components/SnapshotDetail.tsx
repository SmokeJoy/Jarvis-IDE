import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MitigatorOverlayProps } from './MitigatorOverlay';
import { DecisionGraphView } from './DecisionGraphView';

interface SnapshotDetailProps {
  data: MitigatorOverlayProps;
  onClose: () => void;
}

type TabType = 'details' | 'graph';

export const SnapshotDetail: React.FC<SnapshotDetailProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-4 w-[420px] bg-gray-800 text-white rounded-lg shadow-xl p-4 z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📸 Snapshot Decisione</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✖
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1 rounded ${activeTab === 'details' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Dettagli
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-3 py-1 rounded ${activeTab === 'graph' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Grafo
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="space-y-4">
          <section>
            <h4 className="text-sm font-medium mb-2">🕒 Timestamp</h4>
            <div className="text-sm text-gray-300">{new Date(data.timestamp).toLocaleString()}</div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2">🎯 Strategia</h4>
            <div className="text-sm text-gray-300">{data.strategyName}</div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2">⚠️ Motivo</h4>
            <div className="text-sm text-red-400">{data.fallbackReason}</div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2">✅ Provider Selezionato</h4>
            <div className="text-sm text-green-400">{data.selectedProvider}</div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2">🧮 Candidati</h4>
            <div className="space-y-2">
              {data.providerCandidates.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-2 rounded ${provider.excluded ? 'bg-gray-700' : 'bg-gray-600'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{provider.id}</span>
                    {provider.score && (
                      <span className="text-xs text-gray-400">score: {provider.score}</span>
                    )}
                  </div>
                  {provider.stats && (
                    <div className="text-xs text-gray-400 mt-1">
                      <div>latency: {provider.stats.latency}ms</div>
                      <div>success: {(provider.stats.successRate * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2">⚡ Condizioni</h4>
            <div className="space-y-1">
              {data.activeConditions.map((condition, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="mr-2">{condition.isActive ? '✅' : '❌'}</span>
                  <span className={condition.isActive ? 'text-green-400' : 'text-gray-400'}>
                    {condition.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <DecisionGraphView entry={data} />
      )}
    </motion.div>
  );
};
