import { ProviderStats } from '../../shared/types/provider-stats';
import { EMA, SMA } from '../metrics/moving-averages';

export class TelemetryTracker {
  private statsMap: Map<string, ProviderStats> = new Map();
  private emaInstances: Map<string, EMA> = new Map();
  private smaInstances: Map<string, SMA> = new Map();
  private readonly defaultCooldownMs: number;
  private readonly defaultEmaAlpha: number;
  private readonly defaultSmaWindowSize: number;

  constructor(
    defaultCooldownMs: number = 60_000,
    defaultEmaAlpha: number = 0.2,
    defaultSmaWindowSize: number = 10
  ) {
    this.defaultCooldownMs = defaultCooldownMs;
    this.defaultEmaAlpha = defaultEmaAlpha;
    this.defaultSmaWindowSize = defaultSmaWindowSize;
  }

  getStats(providerId: string): ProviderStats {
    if (!this.emaInstances.has(providerId)) {
      this.emaInstances.set(providerId, new EMA(this.defaultEmaAlpha));
    }
    if (!this.smaInstances.has(providerId)) {
      this.smaInstances.set(providerId, new SMA(this.defaultSmaWindowSize));
    }

    const baseStats = this.statsMap.get(providerId) || {
      providerId,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 1,
      totalCost: 0,
      isInCooldown: false,
      cooldownEndTime: null,
      lastError: null,
      lastUsed: Date.now(),
      costPerToken: 0.00002,
      emaResponseTime: 0,
      smaSuccessRate: 0,
    };

    const emaValue = this.emaInstances.get(providerId)?.get();
    const smaValue = this.smaInstances.get(providerId)?.getOrDefault(0);

    const statsWithAverages: ProviderStats = {
      ...baseStats,
      emaResponseTime: emaValue ?? 0,
      smaSuccessRate: smaValue ?? 0,
      successRate: this.calculateSuccessRate(baseStats.successCount, baseStats.totalRequests),
    };

    if (!this.statsMap.has(providerId)) {
      this.statsMap.set(providerId, statsWithAverages);
    }

    return statsWithAverages;
  }

  updateStats(providerId: string, updates: Partial<ProviderStats> & { success: boolean; responseTime?: number }): void {
    const currentStats = this.getStats(providerId);
    const ema = this.emaInstances.get(providerId)!;
    const sma = this.smaInstances.get(providerId)!;

    if (updates.success && typeof updates.responseTime === 'number') {
      ema.update(updates.responseTime);
    }

    sma.update(updates.success ? 1 : 0);

    const updatedBaseStats: Partial<ProviderStats> = {
      ...currentStats,
      ...updates,
      lastUsed: Date.now(),
      successCount: currentStats.successCount + (updates.success ? 1 : 0),
      failureCount: currentStats.failureCount + (updates.success ? 0 : 1),
      totalRequests: currentStats.totalRequests + 1,
    };

    updatedBaseStats.successRate = this.calculateSuccessRate(
      updatedBaseStats.successCount!,
      updatedBaseStats.totalRequests!
    );

    if (typeof updates.responseTime === 'number') {
      const totalResponseTime = (currentStats.averageResponseTime * currentStats.totalRequests) + updates.responseTime;
      updatedBaseStats.averageResponseTime = updatedBaseStats.totalRequests! > 0
        ? totalResponseTime / updatedBaseStats.totalRequests!
        : 0;
    }

    const newEmaValue = ema.get();
    const newSmaValue = sma.getOrDefault(0);

    const newStats: ProviderStats = {
      ...(updatedBaseStats as ProviderStats),
      emaResponseTime: newEmaValue ?? 0,
      smaSuccessRate: newSmaValue,
    };

    this.statsMap.set(providerId, newStats);
  }

  private calculateSuccessRate(successCount: number, totalRequests: number): number {
    return totalRequests > 0 ? successCount / totalRequests : 1;
  }

  isCoolingDown(providerId: string): boolean {
    const stats = this.getStats(providerId);
    if (stats.isInCooldown && stats.cooldownEndTime && Date.now() > stats.cooldownEndTime) {
      const updatePayload = { isInCooldown: false, cooldownEndTime: null, success: true };
      const currentStats = this.statsMap.get(providerId)!;
      this.statsMap.set(providerId, {
        ...currentStats,
        isInCooldown: false,
        cooldownEndTime: null,
      });
      return false;
    }
    return stats.isInCooldown;
  }

  resetStats(providerId: string): void {
    this.statsMap.delete(providerId);
    this.emaInstances.delete(providerId);
    this.smaInstances.delete(providerId);
  }

  getAllStats(): Map<string, ProviderStats> {
    const liveStatsMap = new Map<string, ProviderStats>();
    for (const providerId of this.statsMap.keys()) {
      liveStatsMap.set(providerId, this.getStats(providerId));
    }
    return liveStatsMap;
  }

  getAggregatedStats(): Record<string, ProviderStats> {
    const aggregated: Record<string, ProviderStats> = {};
    for (const providerId of this.statsMap.keys()) {
      aggregated[providerId] = this.getStats(providerId);
    }
    return aggregated;
  }
}
