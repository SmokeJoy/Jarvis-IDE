import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveFallbackStrategy } from '../strategies/AdaptiveFallbackStrategy';
import { PreferredFallbackStrategy } from '../strategies/PreferredFallbackStrategy';
import { RoundRobinFallbackStrategy } from '../strategies/RoundRobinFallbackStrategy';
import { ReliabilityFallbackStrategy } from '../strategies/ReliabilityFallbackStrategy';
import {
  providerCostAbove,
  providerFailedRecently,
  allConditions,
  notCondition
} from '../strategies/adaptive-conditions';
import type { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import type { ProviderStats } from '../LLMFallbackManager';
import { LLMEventBus } from '../LLMEventBus';

describe('AdaptiveFallbackStrategy E2E', () => {
  let providers: LLMProviderHandler[];
  let stats: Map<string, ProviderStats>;
  let strategy: AdaptiveFallbackStrategy;
  let eventBus: LLMEventBus;
  let strategyChangeEvents: any[];

  beforeEach(() => {
    // Mock dei provider
    providers = [
      { id: 'openai', name: 'OpenAI' },
      { id: 'anthropic', name: 'Anthropic' },
      { id: 'mistral', name: 'Mistral' }
    ] as LLMProviderHandler[];

    // Inizializza le statistiche
    stats = new Map([
      ['openai', {
        successCount: 10,
        failureCount: 2,
        avgResponseTime: 500,
        lastFailureTimestamp: 0,
        costPerToken: 0.1
      }],
      ['anthropic', {
        successCount: 8,
        failureCount: 1,
        avgResponseTime: 400,
        lastFailureTimestamp: 0,
        costPerToken: 0.08
      }],
      ['mistral', {
        successCount: 12,
        failureCount: 0,
        avgResponseTime: 300,
        lastFailureTimestamp: 0,
        costPerToken: 0.05
      }]
    ]);

    // Inizializza l'event bus e il listener per gli eventi di cambio strategia
    eventBus = new LLMEventBus();
    strategyChangeEvents = [];
    eventBus.on('strategy:adaptive:change', (payload) => {
      strategyChangeEvents.push(payload);
    });

    // Configura la strategia adattiva con l'event bus
    strategy = new AdaptiveFallbackStrategy([
      {
        name: 'low-cost',
        strategy: new PreferredFallbackStrategy('mistral'),
        condition: allConditions([
          notCondition(providerCostAbove('mistral', 0.1)),
          notCondition(providerFailedRecently('mistral'))
        ])
      },
      {
        name: 'high-cost-fallback',
        strategy: new RoundRobinFallbackStrategy(),
        condition: providerCostAbove('mistral', 0.1)
      },
      {
        name: 'reliability-fallback',
        strategy: new ReliabilityFallbackStrategy(5),
        condition: providerFailedRecently('mistral')
      }
    ], true, eventBus);
  });

  it('should select Mistral as preferred provider when conditions are met', () => {
    const selectedProvider = strategy.selectProvider(providers, stats);
    expect(selectedProvider?.id).toBe('mistral');
  });

  it('should switch to round robin when Mistral cost increases', () => {
    // Aggiorna il costo di Mistral
    const mistralStats = stats.get('mistral')!;
    stats.set('mistral', {
      ...mistralStats,
      costPerToken: 0.15
    });

    const selectedProvider = strategy.selectProvider(providers, stats);
    expect(selectedProvider?.id).toBe('openai'); // Primo provider nel round robin
  });

  it('should switch to reliability strategy when Mistral fails', () => {
    // Simula un fallimento recente di Mistral
    const mistralStats = stats.get('mistral')!;
    stats.set('mistral', {
      ...mistralStats,
      lastFailureTimestamp: Date.now() - 1000 // Fallimento 1 secondo fa
    });

    const selectedProvider = strategy.selectProvider(providers, stats);
    // Reliability dovrebbe selezionare Anthropic (migliore success rate)
    expect(selectedProvider?.id).toBe('anthropic');
  });

  it('should maintain provider order consistency', () => {
    // Verifica ordine iniziale con Mistral come preferito
    const initialOrder = strategy.getProvidersInOrder(providers, stats);
    expect(initialOrder.map(p => p.id)).toEqual(['mistral', 'anthropic', 'openai']);

    // Simula un fallimento di Mistral
    const mistralStats = stats.get('mistral')!;
    stats.set('mistral', {
      ...mistralStats,
      lastFailureTimestamp: Date.now() - 1000
    });

    // Verifica che l'ordine cambi quando si attiva la strategia di affidabilità
    const newOrder = strategy.getProvidersInOrder(providers, stats);
    expect(newOrder.map(p => p.id)).toEqual(['anthropic', 'openai', 'mistral']);
  });

  it('should handle provider failures correctly', () => {
    const failedProviders = new Set(['mistral']);
    
    // Verifica che i provider falliti vengano messi in fondo all'ordine
    const orderedProviders = strategy.getProvidersInOrder(providers, stats, failedProviders);
    expect(orderedProviders.map(p => p.id)).toEqual(['anthropic', 'openai', 'mistral']);
    
    // Verifica che il provider selezionato sia il primo non fallito
    const selectedProvider = strategy.selectProvider(providers, stats, failedProviders);
    expect(selectedProvider?.id).toBe('anthropic');
  });

  it('should propagate success/failure notifications to inner strategies', () => {
    const mockStrategy = {
      notifySuccess: vi.fn(),
      notifyFailure: vi.fn(),
      selectProvider: vi.fn(),
      getProvidersInOrder: vi.fn()
    };

    const testStrategy = new AdaptiveFallbackStrategy([
      {
        name: 'test',
        strategy: mockStrategy,
        condition: () => true
      }
    ]);

    testStrategy.notifySuccess('test-provider');
    expect(mockStrategy.notifySuccess).toHaveBeenCalledWith('test-provider');

    testStrategy.notifyFailure('test-provider');
    expect(mockStrategy.notifyFailure).toHaveBeenCalledWith('test-provider');
  });

  it('should update stats when notified of success/failure', () => {
    const initialStats = new Map([
      ['test-provider', {
        successCount: 10,
        failureCount: 2,
        avgResponseTime: 100,
        lastFailureTimestamp: 0
      }]
    ]);

    const mockStrategy = {
      notifySuccess: vi.fn(),
      notifyFailure: vi.fn(),
      selectProvider: vi.fn(),
      getProvidersInOrder: vi.fn()
    };

    const testStrategy = new AdaptiveFallbackStrategy([
      {
        name: 'test',
        strategy: mockStrategy,
        condition: () => true
      }
    ]);

    // Notifica successo
    testStrategy.notifySuccess('test-provider');
    expect(mockStrategy.notifySuccess).toHaveBeenCalledWith('test-provider');

    // Notifica fallimento
    testStrategy.notifyFailure('test-provider');
    expect(mockStrategy.notifyFailure).toHaveBeenCalledWith('test-provider');

    // Verifica che le statistiche siano state aggiornate
    const updatedStats = initialStats.get('test-provider')!;
    expect(updatedStats.successCount).toBe(11);
    expect(updatedStats.failureCount).toBe(3);
  });

  describe('Strategy Change Events', () => {
    it('should emit event when switching to round robin due to cost increase', () => {
      const mistralStats = stats.get('mistral')!;
      stats.set('mistral', {
        ...mistralStats,
        costPerToken: 0.15
      });

      strategy.selectProvider(providers, stats);

      expect(strategyChangeEvents).toHaveLength(1);
      expect(strategyChangeEvents[0]).toMatchObject({
        fromStrategy: 'low-cost',
        toStrategy: 'high-cost-fallback',
        reason: 'Condition satisfied',
        timestamp: expect.any(Number),
        stats: expect.any(Map)
      });

      // Verifica che le statistiche nell'evento siano una copia
      expect(strategyChangeEvents[0].stats).not.toBe(stats);
      expect(strategyChangeEvents[0].stats.get('mistral')).toMatchObject({
        costPerToken: 0.15
      });
    });

    it('should emit event when switching to reliability due to failure', () => {
      const mistralStats = stats.get('mistral')!;
      const failureTime = Date.now() - 1000;
      
      stats.set('mistral', {
        ...mistralStats,
        lastFailureTimestamp: failureTime
      });

      strategy.selectProvider(providers, stats);

      expect(strategyChangeEvents).toHaveLength(1);
      expect(strategyChangeEvents[0]).toMatchObject({
        fromStrategy: 'low-cost',
        toStrategy: 'reliability-fallback',
        reason: 'Condition satisfied',
        timestamp: expect.any(Number),
        stats: expect.any(Map)
      });

      expect(strategyChangeEvents[0].stats.get('mistral')).toMatchObject({
        lastFailureTimestamp: failureTime
      });
    });

    it('should emit event when falling back to default strategy', () => {
      // Modifica le condizioni per far fallire tutte le strategie
      const mistralStats = stats.get('mistral')!;
      stats.set('mistral', {
        ...mistralStats,
        costPerToken: 0.15,
        lastFailureTimestamp: Date.now() - 1000
      });

      strategy.selectProvider(providers, stats);

      expect(strategyChangeEvents).toHaveLength(1);
      expect(strategyChangeEvents[0]).toMatchObject({
        toStrategy: 'default',
        reason: 'No conditions satisfied'
      });
    });
  });
}); 