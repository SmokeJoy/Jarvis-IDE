import { useMemo } from 'react';
import { AuditEntry } from '../types/audit';

const WINDOW_SIZE = 10;

export const useProviderSeries = (auditData: AuditEntry[]) => {
  return useMemo(() => {
    const providerData = new Map<string, number[]>();

    // Raggruppa gli eventi per provider
    auditData.forEach((entry) => {
      if (!providerData.has(entry.selectedProvider)) {
        providerData.set(entry.selectedProvider, []);
      }
      providerData.get(entry.selectedProvider)?.push(entry.success ? 1 : 0);
    });

    // Calcola success rate per ogni provider
    const series: Record<string, number[]> = {};
    providerData.forEach((successes, provider) => {
      const recentSuccesses = successes.slice(-WINDOW_SIZE);
      const rates: number[] = [];

      // Calcola success rate in finestra mobile
      for (let i = 0; i < recentSuccesses.length; i++) {
        const window = recentSuccesses.slice(0, i + 1);
        const rate = window.reduce((sum, val) => sum + val, 0) / window.length;
        rates.push(rate);
      }

      series[provider] = rates;
    });

    return series;
  }, [auditData]);
};
