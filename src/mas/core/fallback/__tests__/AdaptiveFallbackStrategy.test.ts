import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveFallbackStrategy } from '../strategies/AdaptiveFallbackStrategy';
import { createMockEventBus } from '../../../../tests/mocks/mock-event-bus';
import { createMockProvider } from '../../../../tests/mocks/mock-provider';
import { LLMProviderHandler } from '@/mas/types/llm-provider.types';
import { LLMEventType, LLMEventPayload, ProviderStats } from '@/mas/types/llm-events';
import { createMockStats } from '../../../../tests/mocks/mock-stats';

describe('AdaptiveFallbackStrategy', () => {
  let strategy: AdaptiveFallbackStrategy;
  let eventBus: ReturnType<typeof createMockEventBus>;
  let primaryProvider: ReturnType<typeof createMockProvider>;
  let fallbackProvider: ReturnType<typeof createMockProvider>;
  const primaryId: LLMProviderHandler['id'] = 'primary';
  const fallbackId: LLMProviderHandler['id'] = 'fallback';

  beforeEach(() => {
    eventBus = createMockEventBus();
    primaryProvider = createMockProvider({ id: primaryId, name: 'Primary Provider' });
    fallbackProvider = createMockProvider({ id: fallbackId, name: 'Fallback Provider' });
    strategy = new AdaptiveFallbackStrategy(
      [
        {
          name: 'test-strategy',
          strategy: {
            selectProvider: () => primaryProvider,
            getProvidersInOrder: () => [primaryProvider],
            notifySuccess: () => {},
            notifyFailure: () => {},
          },
          condition: () => true,
        },
      ],
      undefined,
      eventBus
    );
  });

  describe('initialization', () => {
    it('should initialize with correct providers', () => {
      expect(strategy['primaryProvider']).toBe(primaryProvider);
      expect(strategy['fallbackProvider']).toBe(fallbackProvider);
    });

    it('should initialize with empty strategies', () => {
      expect(strategy.getStrategies()).toEqual([]);
    });
  });

  describe('strategy management', () => {
    it('should add strategy with condition', () => {
      const mockStrategy = vi.fn();
      const mockCondition = vi.fn().mockReturnValue(true);

      strategy.addStrategy({
        name: 'test-strategy',
        strategy: mockStrategy,
        condition: mockCondition,
      });

      const strategies = strategy.getStrategies();
      expect(strategies).toHaveLength(1);
      expect(strategies[0].name).toBe('test-strategy');
    });

    it('should remove strategy by index', () => {
      const mockStrategy = vi.fn();
      const mockCondition = vi.fn().mockReturnValue(true);

      strategy.addStrategy({
        name: 'test-strategy',
        strategy: mockStrategy,
        condition: mockCondition,
      });

      expect(strategy.removeStrategy(0)).toBe(true);
      expect(strategy.getStrategies()).toEqual([]);
    });

    it('should handle invalid strategy removal', () => {
      expect(strategy.removeStrategy(0)).toBe(false);
      expect(strategy.removeStrategy(-1)).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit strategy change event', () => {
      const mockStrategy = vi.fn();
      const mockCondition = vi.fn().mockReturnValue(true);

      strategy.addStrategy({
        name: 'test-strategy',
        strategy: mockStrategy,
        condition: mockCondition,
      });

      const payload: LLMEventPayload = {
        providerId: primaryId,
        timestamp: Date.now(),
        data: {
          fromStrategy: 'default',
          toStrategy: 'test-strategy',
          reason: 'condition met',
        },
      };

      eventBus.emit('strategy:adaptive:change', payload);
      expect(eventBus.emit).toHaveBeenCalledWith(
        'strategy:adaptive:change',
        expect.objectContaining({
          providerId: primaryId,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('strategy execution', () => {
    it('should execute strategy when condition is met', async () => {
      const mockStrategy = vi.fn().mockResolvedValue({ text: 'strategy response' });
      const mockCondition = vi.fn().mockReturnValue(true);

      strategy.addStrategy({
        name: 'test-strategy',
        strategy: mockStrategy,
        condition: mockCondition,
      });

      const response = await strategy.execute('test prompt');
      expect(mockStrategy).toHaveBeenCalledWith('test prompt');
      expect(response.text).toBe('strategy response');
    });

    it('should fall back to default strategy when no conditions are met', async () => {
      const mockStrategy = vi.fn();
      const mockCondition = vi.fn().mockReturnValue(false);

      strategy.addStrategy({
        name: 'test-strategy',
        strategy: mockStrategy,
        condition: mockCondition,
      });

      const response = await strategy.execute('test prompt');
      expect(mockStrategy).not.toHaveBeenCalled();
      expect(response.text).toBe('Mock response for: test prompt');
    });
  });
});
