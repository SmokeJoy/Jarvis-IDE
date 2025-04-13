import { LLMProviderHandler } from '../../providers/provider-registry';
import { LLMEventBus, LLMEventType, LLMEventPayload } from '../../types/llm-events';
import { ProviderStats } from '../../../shared/types/provider-stats';
import { TelemetryTracker } from './TelemetryTracker';

export class LLMFallbackManager {
  private providers: LLMProviderHandler[];
  private eventBus: LLMEventBus;
  private telemetryTracker: TelemetryTracker;

  constructor(config: {
    providers: LLMProviderHandler[];
    eventBus: LLMEventBus;
    telemetryTracker: TelemetryTracker;
  }) {
    this.providers = config.providers;
    this.eventBus = config.eventBus;
    this.telemetryTracker = config.telemetryTracker;
  }

  async executeWithFallback<T>(
    operation: (provider: LLMProviderHandler) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      const stats = this.telemetryTracker.getStats(provider.id);

      // Skip providers in cooldown
      if (stats.isInCooldown && stats.cooldownEndTime && stats.cooldownEndTime > Date.now()) {
        continue;
      }

      try {
        const result = await operation(provider);
        const latency = Date.now() - startTime;

        // Update success stats
        this.telemetryTracker.updateStats(provider.id, {
          successCount: stats.successCount + 1,
          totalRequests: stats.totalRequests + 1,
          averageResponseTime: this.calculateAverageResponseTime(
            stats.averageResponseTime,
            stats.totalRequests,
            latency
          ),
          lastUsed: Date.now(),
        });

        // Emit success event
        this.eventBus.emit(LLMEventType.PROVIDER_SUCCESS, {
          providerId: provider.id,
          timestamp: Date.now(),
          data: { latency },
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        const latency = Date.now() - startTime;

        // Update failure stats
        this.telemetryTracker.updateStats(provider.id, {
          failureCount: stats.failureCount + 1,
          totalRequests: stats.totalRequests + 1,
          averageResponseTime: this.calculateAverageResponseTime(
            stats.averageResponseTime,
            stats.totalRequests,
            latency
          ),
          isInCooldown: true,
          cooldownEndTime: Date.now() + 30000, // 30 second cooldown
          lastError: error.message,
          lastUsed: Date.now(),
        });

        // Emit failure event
        this.eventBus.emit(LLMEventType.PROVIDER_FAILURE, {
          providerId: provider.id,
          timestamp: Date.now(),
          data: {
            error: error.message,
            latency,
          },
        });
      }
    }

    // If we get here, all providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  private calculateAverageResponseTime(
    currentAverage: number,
    totalRequests: number,
    newLatency: number
  ): number {
    return (currentAverage * totalRequests + newLatency) / (totalRequests + 1);
  }
}
