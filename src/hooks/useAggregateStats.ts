import { useMemo } from 'react';
import { AuditEntry } from '../types/audit';

interface ProviderStats {
  totalFallbacks: number;
  averageSuccessRate: number;
  averageLatency: number;
  totalRequests: number;
}

interface StrategyStats {
  totalDecisions: number;
  successRate: number;
  mostUsedProvider: string;
}

interface AggregateStats {
  providers: Record<string, ProviderStats>;
  strategies: Record<string, StrategyStats>;
  timeRange: {
    start: number;
    end: number;
  };
}

export const useAggregateStats = (auditData: AuditEntry[]): AggregateStats => {
  return useMemo(() => {
    const stats: AggregateStats = {
      providers: {},
      strategies: {},
      timeRange: {
        start: Infinity,
        end: -Infinity
      }
    };

    auditData.forEach(entry => {
      // Aggiorna il range temporale
      stats.timeRange.start = Math.min(stats.timeRange.start, entry.timestamp);
      stats.timeRange.end = Math.max(stats.timeRange.end, entry.timestamp);

      // Aggiorna le statistiche del provider
      const providerName = entry.selectedProvider;
      if (!stats.providers[providerName]) {
        stats.providers[providerName] = {
          totalFallbacks: 0,
          averageSuccessRate: 0,
          averageLatency: 0,
          totalRequests: 0
        };
      }

      const providerStats = stats.providers[providerName];
      providerStats.totalRequests++;
      providerStats.totalFallbacks += entry.fallbackReason ? 1 : 0;
      providerStats.averageSuccessRate = 
        (providerStats.averageSuccessRate * (providerStats.totalRequests - 1) + 
         (entry.success ? 1 : 0)) / providerStats.totalRequests;
      providerStats.averageLatency = 
        (providerStats.averageLatency * (providerStats.totalRequests - 1) + 
         entry.latency) / providerStats.totalRequests;

      // Aggiorna le statistiche della strategia
      const strategyName = entry.strategyName;
      if (!stats.strategies[strategyName]) {
        stats.strategies[strategyName] = {
          totalDecisions: 0,
          successRate: 0,
          mostUsedProvider: ''
        };
      }

      const strategyStats = stats.strategies[strategyName];
      strategyStats.totalDecisions++;
      strategyStats.successRate = 
        (strategyStats.successRate * (strategyStats.totalDecisions - 1) + 
         (entry.success ? 1 : 0)) / strategyStats.totalDecisions;

      // Aggiorna il provider più utilizzato per questa strategia
      const providerCounts: Record<string, number> = {};
      auditData
        .filter(e => e.strategyName === strategyName)
        .forEach(e => {
          providerCounts[e.selectedProvider] = (providerCounts[e.selectedProvider] || 0) + 1;
        });
      
      strategyStats.mostUsedProvider = Object.entries(providerCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
    });

    return stats;
  }, [auditData]);
}; 