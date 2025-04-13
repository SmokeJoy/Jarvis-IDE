import { ProviderStats } from '../../src/mas/types/llm-events';
import { LLMProviderId } from '../../src/mas/types/llm-provider.types';

/**
 * Creates a mock ProviderStats object with default values
 */
export function createMockStats(overrides: Partial<ProviderStats> = {}): ProviderStats {
  return {
    providerId: 'openai' as LLMProviderId,
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    averageResponseTime: 0,
    successRate: 100,
    isInCooldown: false,
    cooldownEndTime: null,
    lastError: null,
    lastUsed: Date.now(),
    ...overrides
  };
}

/**
 * Creates a mock stats object with cooldown period
 */
export function createMockStatsWithCooldown(
  providerId: LLMProviderId,
  cooldownDuration: number = 30000
): ProviderStats {
  return createMockStats({
    providerId,
    isInCooldown: true,
    cooldownEndTime: Date.now() + cooldownDuration,
    lastError: 'Rate limit exceeded',
    failureCount: 1
  });
} 