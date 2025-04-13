import { useMemo } from 'react';
import { AuditEntry } from '../types/audit';

export type WarningSignal = 'latency' | 'successRate' | 'failureStreak';
export type WarningLevel = 'moderate' | 'high' | 'critical';

export interface WarningEntry {
  provider: string;
  signal: WarningSignal;
  value: number;
  threshold: number;
  level: WarningLevel;
  timestamp: number;
}

const WINDOW_SIZE = 10;
const LATENCY_THRESHOLD = 500;
const SUCCESS_RATE_THRESHOLD = 0.75;
const FAILURE_STREAK_THRESHOLD = 3;

export const usePredictiveWarnings = (auditData: AuditEntry[]): WarningEntry[] => {
  return useMemo(() => {
    const warnings: WarningEntry[] = [];
    const providerData = new Map<string, AuditEntry[]>();

    // Raggruppa gli eventi per provider
    auditData.forEach((entry) => {
      if (!providerData.has(entry.selectedProvider)) {
        providerData.set(entry.selectedProvider, []);
      }
      providerData.get(entry.selectedProvider)?.push(entry);
    });

    // Analizza ogni provider
    providerData.forEach((entries, provider) => {
      const recentEntries = entries.slice(-WINDOW_SIZE);

      // Controlla latency spike
      const latencySpikes = recentEntries.filter((e) => e.latency > LATENCY_THRESHOLD);
      if (latencySpikes.length >= 3) {
        const avgLatency =
          latencySpikes.reduce((sum, e) => sum + e.latency, 0) / latencySpikes.length;
        warnings.push({
          provider,
          signal: 'latency',
          value: avgLatency,
          threshold: LATENCY_THRESHOLD,
          level: avgLatency > 1000 ? 'critical' : 'high',
          timestamp: Date.now(),
        });
      }

      // Controlla success rate
      const successCount = recentEntries.filter((e) => e.success).length;
      const successRate = successCount / recentEntries.length;
      if (successRate < SUCCESS_RATE_THRESHOLD) {
        warnings.push({
          provider,
          signal: 'successRate',
          value: successRate,
          threshold: SUCCESS_RATE_THRESHOLD,
          level: successRate < 0.5 ? 'critical' : 'moderate',
          timestamp: Date.now(),
        });
      }

      // Controlla failure streak
      let currentStreak = 0;
      for (let i = recentEntries.length - 1; i >= 0; i--) {
        if (!recentEntries[i].success) {
          currentStreak++;
        } else {
          break;
        }
      }
      if (currentStreak >= FAILURE_STREAK_THRESHOLD) {
        warnings.push({
          provider,
          signal: 'failureStreak',
          value: currentStreak,
          threshold: FAILURE_STREAK_THRESHOLD,
          level: currentStreak >= 5 ? 'critical' : 'high',
          timestamp: Date.now(),
        });
      }
    });

    return warnings;
  }, [auditData]);
};
