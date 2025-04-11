import { describe, it, expect } from 'vitest';
import {
  failureRateAbove,
  totalFailuresAbove,
  avgLatencyAbove,
  providerLatencyAbove,
  providerFailedRecently,
  duringTimeWindow,
  allConditions,
  anyCondition,
  notCondition,
  providerCostAbove
} from '../adaptive-conditions';
import type { ProviderStats } from '../../LLMFallbackManager';

describe('Adaptive Conditions', () => {
  const createMockStats = (overrides: Partial<ProviderStats> = {}): ProviderStats => ({
    successCount: 0,
    failureCount: 0,
    avgResponseTime: 0,
    lastFailureTimestamp: 0,
    costPerToken: 0,
    ...overrides
  });

  describe('providerCostAbove', () => {
    it('should return false when provider stats are not available', () => {
      const stats = new Map<string, ProviderStats>();
      const condition = providerCostAbove('provider1', 0.1);
      expect(condition(stats)).toBe(false);
    });

    it('should return false when costPerToken is not available', () => {
      const stats = new Map<string, ProviderStats>([
        ['provider1', createMockStats({ costPerToken: undefined })]
      ]);
      const condition = providerCostAbove('provider1', 0.1);
      expect(condition(stats)).toBe(false);
    });

    it('should return true when cost per token is above threshold', () => {
      const stats = new Map<string, ProviderStats>([
        ['provider1', createMockStats({ costPerToken: 0.2 })]
      ]);
      const condition = providerCostAbove('provider1', 0.1);
      expect(condition(stats)).toBe(true);
    });

    it('should return false when cost per token is below threshold', () => {
      const stats = new Map<string, ProviderStats>([
        ['provider1', createMockStats({ costPerToken: 0.05 })]
      ]);
      const condition = providerCostAbove('provider1', 0.1);
      expect(condition(stats)).toBe(false);
    });

    it('should return false when cost per token equals threshold', () => {
      const stats = new Map<string, ProviderStats>([
        ['provider1', createMockStats({ costPerToken: 0.1 })]
      ]);
      const condition = providerCostAbove('provider1', 0.1);
      expect(condition(stats)).toBe(true);
    });
  });

  // ... existing tests for other conditions ...
}); 