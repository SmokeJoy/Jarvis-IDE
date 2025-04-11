import { useMemo } from 'react';
import { FallbackAudit } from '../types/fallback';
import { ProviderStats } from '../types/fallback';

interface ChartData {
  successRate: {
    name: string;
    success: number;
    failure: number;
  }[];
  latency: {
    name: string;
    latency: number;
  }[];
  cost: {
    name: string;
    cost: number;
  }[];
  usage: {
    name: string;
    requests: number;
  }[];
}

export const useFallbackChartData = (audits: FallbackAudit[]): ChartData => {
  return useMemo(() => {
    const providerStats = new Map<string, ProviderStats>();

    // Calcola le statistiche per ogni provider
    audits.forEach(audit => {
      const stats = providerStats.get(audit.provider) || {
        totalRequests: 0,
        successfulRequests: 0,
        totalLatency: 0,
        totalCost: 0
      };

      stats.totalRequests++;
      if (audit.success) {
        stats.successfulRequests++;
      }
      stats.totalLatency += audit.latency;
      stats.totalCost += audit.cost;

      providerStats.set(audit.provider, stats);
    });

    // Trasforma i dati per i grafici
    const successRate = Array.from(providerStats.entries()).map(([provider, stats]) => ({
      name: provider,
      success: stats.successfulRequests,
      failure: stats.totalRequests - stats.successfulRequests
    }));

    const latency = Array.from(providerStats.entries()).map(([provider, stats]) => ({
      name: provider,
      latency: stats.totalLatency / stats.totalRequests
    }));

    const cost = Array.from(providerStats.entries()).map(([provider, stats]) => ({
      name: provider,
      cost: stats.totalCost
    }));

    const usage = Array.from(providerStats.entries()).map(([provider, stats]) => ({
      name: provider,
      requests: stats.totalRequests
    }));

    return {
      successRate,
      latency,
      cost,
      usage
    };
  }, [audits]);
}; 