import { vi } from 'vitest';
/**
 * @file LLMEventBus.test.ts
 * @description Test per il sistema di event bus per provider LLM
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMEventType, type LLMEventPayload } from '../../../types/llm-events';
import { LLMProviderId } from '../../../../types/llm-provider.types';
import { createMockStats } from '../../../../tests/mocks/mock-stats';
import type { ProviderStats } from '../../../../shared/types/provider-stats';
import { createMockEventBus } from '../../../../tests/shared/MockEventBus';

describe('LLMEventBus', () => {
  let eventBus: ReturnType<typeof createMockEventBus>;
  let mockListener: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    eventBus = createMockEventBus({ spyEmit: true });
    mockListener = vi.fn();
  });

  describe('Event Registration and Emission', () => {
    it('should register and emit events with timestamps', () => {
      eventBus.on(LLMEventType.PROVIDER_SUCCESS, mockListener);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { requestId: 'test-request' },
      };

      eventBus.emit(LLMEventType.PROVIDER_SUCCESS, payload);

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should handle events without timestamps by adding them', () => {
      eventBus.on(LLMEventType.PROVIDER_FAILURE, mockListener);

      const payload: Partial<LLMEventPayload> = {
        providerId: 'openai' as LLMProviderId,
        data: { error: 'test-error' },
      };

      eventBus.emit(LLMEventType.PROVIDER_FAILURE, payload as LLMEventPayload);

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Listener Management', () => {
    it('should remove listeners correctly', () => {
      eventBus.on(LLMEventType.PROVIDER_SUCCESS, mockListener);
      eventBus.off(LLMEventType.PROVIDER_SUCCESS, mockListener);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { requestId: 'test-request' },
      };

      eventBus.emit(LLMEventType.PROVIDER_SUCCESS, payload);

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should remove all listeners for an event type', () => {
      const mockListener2 = vi.fn();
      eventBus.on(LLMEventType.PROVIDER_SUCCESS, mockListener);
      eventBus.on(LLMEventType.PROVIDER_SUCCESS, mockListener2);

      eventBus.removeAllListeners(LLMEventType.PROVIDER_SUCCESS);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { requestId: 'test-request' },
      };

      eventBus.emit(LLMEventType.PROVIDER_SUCCESS, payload);

      expect(mockListener).not.toHaveBeenCalled();
      expect(mockListener2).not.toHaveBeenCalled();
    });
  });

  describe('Stats Management', () => {
    it('should update provider stats correctly', () => {
      const stats: ProviderStats = createMockStats('openai' as LLMProviderId);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { stats },
      };

      eventBus.emit(LLMEventType.PROVIDER_STATS_UPDATED, payload);

      const updatedStats = eventBus.getProviderStats('openai' as LLMProviderId);
      expect(updatedStats).toEqual(stats);
    });

    it('should handle multiple providers stats', () => {
      const stats1: ProviderStats = createMockStats('openai' as LLMProviderId);
      const stats2: ProviderStats = createMockStats('anthropic' as LLMProviderId);

      const payload1: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { stats: stats1 },
      };

      const payload2: LLMEventPayload = {
        providerId: 'anthropic' as LLMProviderId,
        timestamp: Date.now(),
        data: { stats: stats2 },
      };

      eventBus.emit(LLMEventType.PROVIDER_STATS_UPDATED, payload1);
      eventBus.emit(LLMEventType.PROVIDER_STATS_UPDATED, payload2);

      expect(eventBus.getProviderStats('openai' as LLMProviderId)).toEqual(stats1);
      expect(eventBus.getProviderStats('anthropic' as LLMProviderId)).toEqual(stats2);
    });
  });

  describe('Event Type Specific Tests', () => {
    it('should handle provider validation failed events', () => {
      eventBus.on(LLMEventType.PROVIDER_VALIDATION_FAILED, mockListener);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { error: 'validation-failed' },
      };

      eventBus.emit(LLMEventType.PROVIDER_VALIDATION_FAILED, payload);

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 'openai',
          timestamp: expect.any(Number),
          data: { error: 'validation-failed' },
        })
      );
    });

    it('should handle cooldown events', () => {
      eventBus.on(LLMEventType.PROVIDER_COOLDOWN_STARTED, mockListener);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: { cooldownEndTime: Date.now() + 60000 },
      };

      eventBus.emit(LLMEventType.PROVIDER_COOLDOWN_STARTED, payload);

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
      providerId: 'openai',
          timestamp: expect.any(Number),
          data: { cooldownEndTime: expect.any(Number) },
        })
      );
    });

    it('should handle adaptive strategy change events', () => {
      eventBus.on(LLMEventType.STRATEGY_ADAPTIVE_CHANGE, mockListener);

      const payload: LLMEventPayload = {
        providerId: 'openai' as LLMProviderId,
        timestamp: Date.now(),
        data: {
          previousStrategy: 'round-robin',
          newStrategy: 'adaptive',
          reason: 'high-failure-rate',
        },
      };

      eventBus.emit(LLMEventType.STRATEGY_ADAPTIVE_CHANGE, payload);

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          timestamp: expect.any(Number),
        })
      );
    });
  });
}); 
