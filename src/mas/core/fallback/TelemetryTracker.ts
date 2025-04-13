import { ProviderStats } from '../../shared/types/provider-stats';

export class TelemetryTracker {
  private statsMap: Map<string, ProviderStats> = new Map();
  private readonly defaultCooldownMs: number;

  constructor(defaultCooldownMs: number = 60_000) {
    this.defaultCooldownMs = defaultCooldownMs;
  }

  getStats(providerId: string): ProviderStats {
    if (!this.statsMap.has(providerId)) {
      this.statsMap.set(providerId, {
        providerId,
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        totalCost: 0,
        isInCooldown: false,
        cooldownEndTime: null,
        lastError: null,
        lastUsed: Date.now(),
        costPerToken: 0.00002,
      });
    }
    return this.statsMap.get(providerId)!;
  }

  updateStats(providerId: string, updates: Partial<ProviderStats>): void {
    const currentStats = this.getStats(providerId);
    const newStats: ProviderStats = {
      ...currentStats,
      ...updates,
      successRate: this.calculateSuccessRate(
        updates.successCount ?? currentStats.successCount,
        updates.totalRequests ?? currentStats.totalRequests
      ),
    };
    this.statsMap.set(providerId, newStats);
  }

  private calculateSuccessRate(successCount: number, totalRequests: number): number {
    return totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;
  }

  isCoolingDown(providerId: string): boolean {
    const stats = this.getStats(providerId);
    if (stats.isInCooldown && stats.cooldownEndTime && Date.now() > stats.cooldownEndTime) {
      this.updateStats(providerId, {
        isInCooldown: false,
        cooldownEndTime: null,
      });
      return false;
    }
    return stats.isInCooldown;
  }

  resetStats(providerId: string): void {
    this.statsMap.delete(providerId);
  }

  getAllStats(): Map<string, ProviderStats> {
    return new Map(this.statsMap);
  }

  getAggregatedStats(): Record<string, ProviderStats> {
    const aggregated: Record<string, ProviderStats> = {};

    for (const [providerId, stats] of this.statsMap.entries()) {
      aggregated[providerId] = { ...stats };
    }

    return aggregated;
  }
}
