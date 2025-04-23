import { vi } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMFallbackManager } from '../../../../src/mas/core/fallback/LLMFallbackManager';
import { LLMEventType } from '../../../../src/mas/types/llm-events';
import { LLMProviderHandler } from '../../../../src/mas/types/llm-provider.types';
import { createMockProvider } from '../../../mocks/mock-provider';
import { TelemetryTracker } from '../../../../src/mas/core/fallback/TelemetryTracker';
import { createMockStats } from '../../../mocks/mock-stats';

describe('LLMFallbackManager', () => {
  let manager: LLMFallbackManager;
  let mockProvider1: LLMProviderHandler;
  let mockProvider2: LLMProviderHandler;
  let mockEventBus: any;
  let telemetryTracker: TelemetryTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    
    mockProvider1 = createMockProvider({
      id: 'provider1',
      name: 'Provider 1',
      displayName: 'Provider 1',
      isEnabled: true,
      isAvailable: true,
      call: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      getAvailableModels: vi.fn(),
      validateRequest: vi.fn()
    });

    mockProvider2 = createMockProvider({
      id: 'provider2',
      name: 'Provider 2',
      displayName: 'Provider 2',
      isEnabled: true,
      isAvailable: true,
      call: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      getAvailableModels: vi.fn(),
      validateRequest: vi.fn()
    });

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      clear: vi.fn(),
      updateStats: vi.fn()
    };

    telemetryTracker = new TelemetryTracker(60000);

    // Initialize with mock stats
    telemetryTracker.updateStats('provider1', createMockStats({ providerId: 'provider1' }));
    telemetryTracker.updateStats('provider2', createMockStats({ providerId: 'provider2' }));

    manager = new LLMFallbackManager({
      providers: [mockProvider1, mockProvider2],
      eventBus: mockEventBus,
      telemetryTracker
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('executeWithFallback', () => {
    it('should execute with first provider successfully', async () => {
      const mockResult = { data: 'success' };
      mockProvider1.call.mockResolvedValue(mockResult);

      const result = await manager.executeWithFallback(provider => provider.call('test prompt'));

      expect(result).toBe(mockResult);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        LLMEventType.PROVIDER_SUCCESS,
        expect.any(Object)
      );

      const stats = telemetryTracker.getStats('provider1');
      expect(stats.successCount).toBe(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.lastUsed).toBeGreaterThanOrEqual(Date.now());
    });

    it('should fallback to second provider on failure', async () => {
      const error = new Error('Provider failed');
      mockProvider1.call.mockRejectedValue(error);
      mockProvider2.call.mockResolvedValue({ data: 'success' });

      const result = await manager.executeWithFallback(provider => provider.call('test prompt'));

      expect(result).toEqual({ data: 'success' });
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        LLMEventType.PROVIDER_FAILURE,
        expect.objectContaining({
          providerId: 'provider1',
          data: { error: error.message }
        })
      );

      const stats1 = telemetryTracker.getStats('provider1');
      expect(stats1.failureCount).toBe(1);
      expect(stats1.lastError).toBe(error.message);

      const stats2 = telemetryTracker.getStats('provider2');
      expect(stats2.successCount).toBe(1);
      expect(stats2.lastUsed).toBeGreaterThanOrEqual(Date.now());
    });

    it('should handle all providers failing', async () => {
      const error = new Error('Provider failed');
      mockProvider1.call.mockRejectedValue(error);
      mockProvider2.call.mockRejectedValue(error);

      await expect(
        manager.executeWithFallback(provider => provider.call('test prompt'))
      ).rejects.toThrow('All providers failed');

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        LLMEventType.PROVIDER_FAILURE,
        expect.objectContaining({
          providerId: 'provider2',
          data: { error: error.message }
        })
      );
    });

    it('should put provider in cooldown after multiple failures', async () => {
      const error = new Error('Provider failed');
      mockProvider1.call.mockRejectedValue(error);
      mockProvider2.call.mockResolvedValue({ data: 'success' });

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        try {
          await manager.executeWithFallback(provider => provider.call('test prompt'));
        } catch (e) {
          // Expected error
        }
      }

      const stats = telemetryTracker.getStats('provider1');
      expect(stats.isInCooldown).toBe(true);
      expect(stats.cooldownEndTime).toBeGreaterThan(Date.now());
    });
  });
}); 