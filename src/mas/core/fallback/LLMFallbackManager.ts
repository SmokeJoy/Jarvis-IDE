import { LLMProviderHandler } from '../../providers/provider-registry';
import { LLMEventBus, LLMEventType, LLMEventPayload } from '../../types/llm-events';
import { ProviderStats } from '../../../shared/types/provider-stats';
import { TelemetryTracker } from './TelemetryTracker';
import { FallbackStrategy, RoundRobinFallbackStrategy } from './strategies';
import { LLMProviderId } from '../../../types/llm-provider.types';

export interface LLMFallbackOptions {
  providers: LLMProviderHandler[];
  eventBus?: LLMEventBus;
  telemetryTracker?: TelemetryTracker;
  strategy?: FallbackStrategy;
  strategyType?: 'roundRobin' | 'reliability' | 'preferred' | 'adaptive';
  strategyOptions?: any;
  preferredProvider?: LLMProviderId;
  rememberSuccessful?: boolean;
  maxRetries?: number;
  cooldownMs?: number;
  collectStats?: boolean;
}

export class LLMFallbackManager {
  private providers: LLMProviderHandler[];
  private eventBus: LLMEventBus;
  private telemetryTracker: TelemetryTracker;
  private strategy: FallbackStrategy;
  private preferredProviderId: LLMProviderId | null = null;
  private rememberSuccessful: boolean;
  private maxRetries: number;
  private cooldownMs: number;
  private collectStats: boolean;

  constructor(options: LLMFallbackOptions) {
    this.providers = [...options.providers];
    this.eventBus = options.eventBus || new LLMEventBus();
    this.telemetryTracker = options.telemetryTracker || new TelemetryTracker(options.cooldownMs);
    this.rememberSuccessful = options.rememberSuccessful ?? true;
    this.maxRetries = options.maxRetries ?? 0;
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.collectStats = options.collectStats ?? true;

    if (this.collectStats) {
        this.providers.forEach(p => this.telemetryTracker.getStats(p.id));
    }

    if (options.preferredProvider && this.providers.some(p => p.id === options.preferredProvider)) {
        this.preferredProviderId = options.preferredProvider;
    }

    this.strategy = options.strategy || new RoundRobinFallbackStrategy();
  }

  getProviders(): LLMProviderHandler[] {
    return [...this.providers];
  }

  getPreferredProvider(): LLMProviderHandler | null {
    if (!this.preferredProviderId) {
        return null;
    }
    return this.providers.find(p => p.id === this.preferredProviderId) || null;
  }

  setPreferredProvider(providerId: LLMProviderId | null): void {
    if (providerId === null || this.providers.some(p => p.id === providerId)) {
        this.preferredProviderId = providerId;
    } else {
        console.warn(`LLMFallbackManager: Provider ID "${providerId}" not found. Preferred provider not set.`);
        this.preferredProviderId = null;
    }
  }

  addProvider(provider: LLMProviderHandler): void {
    if (!this.providers.some(p => p.id === provider.id)) {
        this.providers.push(provider);
        if (this.collectStats) {
            this.telemetryTracker.getStats(provider.id);
        }
    } else {
        console.warn(`LLMFallbackManager: Provider with ID "${provider.id}" already exists.`);
    }
  }

  removeProvider(providerId: LLMProviderId): void {
    const initialLength = this.providers.length;
    this.providers = this.providers.filter(p => p.id !== providerId);
    if (this.providers.length < initialLength) {
        if (this.collectStats) {
             this.telemetryTracker.resetStats(providerId);
        }
        if (this.preferredProviderId === providerId) {
            this.preferredProviderId = null;
        }
    }
  }

  getAllStats(): Map<string, ProviderStats> {
    return this.collectStats ? this.telemetryTracker.getAllStats() : new Map();
  }

  getProviderStats(providerId: LLMProviderId): ProviderStats | null {
    return this.collectStats ? this.telemetryTracker.getStats(providerId) : null;
  }

  getStrategy(): FallbackStrategy {
    return this.strategy;
  }

  getEventBus(): LLMEventBus {
    return this.eventBus;
  }

  isProviderInCooldown(providerId: LLMProviderId): boolean {
      if (!this.collectStats) return false;
      return this.telemetryTracker.isCoolingDown(providerId);
  }

  async executeWithFallback<T>(
    operation: (provider: LLMProviderHandler) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    const providerSequence = this.strategy.getProvidersInOrder(this.providers, this.telemetryTracker.getAllStats(), this.preferredProviderId);

    for (const provider of providerSequence) {
      if (!this.collectStats) {
          try {
              const result = await operation(provider);
              return result;
          } catch (error) {
              lastError = error as Error;
              continue;
          }
      }

      const stats = this.telemetryTracker.getStats(provider.id);
      let currentAttempt = 0;
      const maxAttemptsForProvider = 1 + this.maxRetries;

      while (currentAttempt < maxAttemptsForProvider) {
        attempt++;
        currentAttempt++;

        if (this.isProviderInCooldown(provider.id)) {
            lastError = new Error(`Provider ${provider.id} is in cooldown.`);
            break;
        }

        const attemptStartTime = Date.now();
        try {
          const result = await operation(provider);
          const latency = Date.now() - attemptStartTime;

          this.telemetryTracker.updateStats(provider.id, {
            success: true,
            responseTime: latency,
            isInCooldown: false,
            cooldownEndTime: null,
            lastError: null,
          });

          this.eventBus.emit(LLMEventType.PROVIDER_SUCCESS, {
            providerId: provider.id,
            timestamp: Date.now(),
            data: { latency, isFallback: attempt > 1, attempt: currentAttempt },
          });

          if (this.rememberSuccessful) {
            this.preferredProviderId = provider.id;
          }
          return result;

        } catch (error) {
          lastError = error as Error;
          const latency = Date.now() - attemptStartTime;

          this.telemetryTracker.updateStats(provider.id, {
            success: false,
            responseTime: latency,
            isInCooldown: true,
            cooldownEndTime: Date.now() + this.cooldownMs,
            lastError: error.message,
          });

          this.eventBus.emit(LLMEventType.PROVIDER_FAILURE, {
            providerId: provider.id,
            timestamp: Date.now(),
            data: {
              error: error.message,
              latency,
              attempt: currentAttempt,
            },
          });

           if (currentAttempt >= maxAttemptsForProvider) {
                break;
            }
        }
      }

      if (lastError && lastError.message.includes('cooldown')) {
           continue;
       }
        if (currentAttempt >= maxAttemptsForProvider && lastError) {
            this.eventBus.emit(LLMEventType.PROVIDER_COOLDOWN_STARTED, {
                 providerId: provider.id,
                 timestamp: Date.now(),
                 data: { cooldownEndTime: this.telemetryTracker.getStats(provider.id)?.cooldownEndTime }
            });
            continue;
        }

    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  private calculateAverageResponseTime(
    currentAverage: number,
    totalRequests: number,
    newLatency: number
  ): number {
    if (totalRequests < 0) return newLatency;
    return (currentAverage * totalRequests + newLatency) / (totalRequests + 1);
  }
}
