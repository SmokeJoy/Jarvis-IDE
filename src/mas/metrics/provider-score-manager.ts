import { LLMProviderId } from '../../types/llm-provider';

export interface ProviderScoreManager {
  updateScore(providerId: LLMProviderId, success: boolean, duration: number): void;
  getBestProvider(candidates: LLMProviderId[]): LLMProviderId;
  getStats(providerId: LLMProviderId): ProviderStats;
}

export interface ProviderStats {
  successRate: number;
  averageTime: number;
  retryCount: number;
}

export class InMemoryProviderScoreManager implements ProviderScoreManager {
  private providerMetrics = new Map<
    LLMProviderId,
    {
      successes: number;
      total: number;
      totalTime: number;
      retries: number;
    }
  >();

  updateScore(providerId: LLMProviderId, success: boolean, duration: number): void {
    const metrics = this.providerMetrics.get(providerId) || {
      successes: 0,
      total: 0,
      totalTime: 0,
      retries: 0,
    };

    metrics.total++;
    metrics.totalTime += duration;

    if (success) {
      metrics.successes++;
      metrics.retries = 0; // Reset retry counter on success
    } else {
      metrics.retries++;
    }

    this.providerMetrics.set(providerId, metrics);
  }

  getBestProvider(candidates: LLMProviderId[]): LLMProviderId {
    if (candidates.length === 0) {
      throw new Error('No provider candidates specified');
    }

    return candidates.reduce((best, current) => {
      const currentStats = this.getStats(current);
      const bestStats = this.getStats(best);

      // Priority: success rate > average time > retry count
      if (currentStats.successRate > bestStats.successRate) return current;
      if (currentStats.successRate === bestStats.successRate) {
        if (currentStats.averageTime < bestStats.averageTime) return current;
        if (currentStats.averageTime === bestStats.averageTime) {
          return currentStats.retryCount < bestStats.retryCount ? current : best;
        }
      }
      return best;
    }, candidates[0]);
  }

  getStats(providerId: LLMProviderId): ProviderStats {
    const metrics = this.providerMetrics.get(providerId) || {
      successes: 0,
      total: 0,
      totalTime: 0,
      retries: 0,
    };

    return {
      successRate: metrics.total > 0 ? metrics.successes / metrics.total : 0,
      averageTime: metrics.total > 0 ? metrics.totalTime / metrics.total : 0,
      retryCount: metrics.retries,
    };
  }
}
