import React, { useState } from 'react';
import { useFallbackAudit } from '../hooks/useFallbackAudit';
import { LLMProviderHandler } from '../providers/provider-registry-stub';
import { LLMEventBus } from '../mas/core/fallback/LLMEventBus';
import { FallbackStrategy } from '../mas/core/fallback/strategies/FallbackStrategy';
import { FallbackChartPanel } from './FallbackChartPanel';
import { FallbackSnapshot } from '../types/fallback';

interface FallbackAuditPanelProps {
  eventBus: LLMEventBus;
  strategy: FallbackStrategy;
  providers: LLMProviderHandler[];
  className?: string;
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const FallbackAuditPanel: React.FC<FallbackAuditPanelProps> = ({
  eventBus,
  strategy,
  providers,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<'events' | 'snapshots' | 'analytics'>('events');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const { events, snapshots, exportEvents, exportSnapshots, clearSnapshots } = useFallbackAudit({
    eventBus,
    strategy,
    providers,
    onAuditEvent: (event) => {
      console.log('Audit Event:', event);
    },
    onSnapshot: (snapshot) => {
      console.log('Audit Snapshot:', snapshot);
    },
  });

  // Converte snapshots in audit-like per i grafici
  const auditData = snapshots.map((snapshot) => ({
    timestamp: snapshot.timestamp,
    provider: snapshot.provider,
    success: true, // fallback placeholder, se non disponibile
    latency: snapshot.stats.get(snapshot.provider)?.avgResponseTime || 0,
    cost: 0, // da aggiungere in futuro
    strategy: snapshot.strategy,
    condition: '', // opzionale
  }));

  const handleExport = () => {
    const content =
      selectedTab === 'events'
        ? exportEvents(exportFormat)
        : selectedTab === 'snapshots'
          ? exportSnapshots(exportFormat)
          : '';

    const filename = `fallback-${selectedTab}-${new Date().toISOString()}.${exportFormat}`;
    downloadFile(content, filename);
  };

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📊 Fallback Audit</h2>
        <button
          onClick={() => {}}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title="Chiudi"
        >
          ✕
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedTab('events')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === 'events'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📋 Cronologia
        </button>
        <button
          onClick={() => setSelectedTab('snapshots')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === 'snapshots'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📋 Snapshots
        </button>
        <button
          onClick={() => setSelectedTab('analytics')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === 'analytics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📊 Analytics
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {selectedTab === 'events' ? (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{event.type}</span>
                  <span>{formatTimestamp(event.timestamp)}</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-300">
                    Strategy: {event.providerFields?.strategy ?? 'unknown'}
                    {event.providerFields?.provider && ` | Provider: ${event.providerFields.provider}`}
                  </div>
                  <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify((msg.payload as unknown), null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : selectedTab === 'snapshots' ? (
          <div className="space-y-2">
            {snapshots.map((snapshot, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Snapshot</span>
                  <span>{formatTimestamp(snapshot.timestamp)}</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-300">
                    Strategy: {snapshot.strategy}
                    {snapshot.provider && ` | Provider: ${snapshot.provider}`}
                  </div>
                  {snapshot.conditions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-400">Active Conditions:</div>
                      <div className="space-y-1 mt-1">
                        {snapshot.conditions.map((condition, i) => (
                          <div
                            key={i}
                            className={`flex items-center ${
                              condition.isActive ? 'text-green-400' : 'text-gray-400'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current mr-2" />
                            <span>{condition.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {auditData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nessun dato disponibile per l'analisi
              </div>
            ) : (
              <FallbackChartPanel audits={auditData} />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            Export
          </button>
        </div>
        {selectedTab === 'snapshots' && (
          <button
            onClick={clearSnapshots}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
          >
            Pulisci Cronologia
          </button>
        )}
      </div>
    </div>
  );
};
