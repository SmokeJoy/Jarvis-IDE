import React, { useEffect, useState } from 'react';
import { useFallbackTelemetry } from '../hooks/useFallbackTelemetry';
import { LLMProviderHandler } from '../providers/provider-registry-stub';
import { LLMEventBus } from '../mas/types/llm-events';
import { FallbackStrategy } from '../mas/core/fallback/strategies/FallbackStrategy';
import { FallbackSnapshot } from '../visix';

interface FallbackMonitorPanelProps {
  eventBus: LLMEventBus;
  strategy: FallbackStrategy;
  providers: LLMProviderHandler[];
  className?: string;
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'strategy:adaptive:change':
      return 'text-blue-500';
    case 'provider:success':
      return 'text-green-500';
    case 'provider:failure':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

export const FallbackMonitorPanel: React.FC<FallbackMonitorPanelProps> = ({
  eventBus,
  strategy,
  providers,
  className = '',
}) => {
  const { activeStrategy, currentProvider, recentEvents, activeConditions, providerStats } =
    useFallbackTelemetry({
      eventBus,
      strategy,
      providers,
      debug: true,
    });

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4">Fallback Monitor</h2>

      {/* Sezione Strategia e Provider */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400">Strategia Attiva</h3>
            <p className="text-lg">{activeStrategy}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400">Provider Corrente</h3>
            <p className="text-lg">{currentProvider?.id || 'Nessuno'}</p>
          </div>
        </div>
      </div>

      {/* Sezione Condizioni Attive */}
      {activeConditions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Condizioni Attive</h3>
          <div className="space-y-2">
            {activeConditions.map((condition, index) => (
              <div
                key={index}
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

      {/* Sezione Eventi Recenti */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Eventi Recenti</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentEvents.map((event, index) => (
            <div key={index} className={`p-2 rounded ${getEventColor(event.type)} bg-gray-800`}>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{event.type}</span>
                <span>{formatTimestamp(event.timestamp)}</span>
              </div>
              <div className="mt-1 text-sm">{JSON.stringify(event.payload, null, 2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione Statistiche Provider */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Statistiche Provider</h3>
        <div className="space-y-2">
          {Array.from(providerStats.entries()).map(([providerId, stats]) => (
            <div key={providerId} className="bg-gray-800 p-2 rounded">
              <div className="font-semibold">{providerId}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Successi:</span>{' '}
                  <span className="text-green-400">{stats.successCount}</span>
                </div>
                <div>
                  <span className="text-gray-400">Fallimenti:</span>{' '}
                  <span className="text-red-400">{stats.failureCount}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tasso Successo:</span>{' '}
                  <span className="text-blue-400">{stats.successRate}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Latenza Media:</span>{' '}
                  <span className="text-yellow-400">{stats.avgResponseTime}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
