import { vi } from 'vitest';
import { z } from 'zod';
/**
 * @file AdaptiveFallbackStrategy.test.ts
 * @description Test per la strategia di fallback adattiva
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AdaptiveFallbackStrategy,
  StrategyWithCondition,
  PreferredFallbackStrategy,
  ReliabilityFallbackStrategy,
  RoundRobinFallbackStrategy,
  failureRateAbove,
  totalFailuresAbove,
  avgLatencyAbove,
  providerLatencyAbove,
  providerFailedRecently,
  duringTimeWindow,
  allConditions,
  anyCondition,
  notCondition,
} from '../';
import { LLMProviderHandler } from '../../../../providers/provider-registry-stub';
import { ProviderStats } from '../../LLMFallbackManager';
import { FallbackStrategy } from '../FallbackStrategy';

describe('AdaptiveFallbackStrategy', () => {
  // Utility per creare provider di test
  const createMockProvider = (id: string, isEnabled: boolean = true): LLMProviderHandler =>
    ({
      id,
      name: `Provider ${id}`,
      isEnabled,
      handle: vi.fn(),
    }) as unknown as LLMProviderHandler;

  // Dati di test condivisi
  const providers = [
    createMockProvider('openai'),
    createMockProvider('anthropic'),
    createMockProvider('mistral'),
    createMockProvider('disabled', false),
  ];

  // Statistiche di test
  let stats: Map<string, ProviderStats>;

  // Mock di Date.now per i test
  const realDate = global.Date;
  const mockTimestamp = new realDate('2023-01-01T12:00:00Z').getTime();

  beforeEach(() => {
    // Mock di Date.now
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new realDate(mockTimestamp);
        }
        return new realDate(...args);
      }

      static now() {
        return mockTimestamp;
      }
    } as any;

    // Resetta le statistiche prima di ogni test
    stats = new Map<string, ProviderStats>();

    // Statistiche normali
    providers.forEach((p) => {
      if (p.id === 'anthropic') {
        stats.set(p.id, {
          providerId: p.id,
          successCount: 100,
          failureCount: 0,
          successRate: 100,
          avgResponseTime: 100,
          lastUsed: mockTimestamp,
          lastFailureTimestamp: 0,
        });
      } else if (p.id === 'openai') {
        stats.set(p.id, {
          providerId: p.id,
          successCount: 90,
          failureCount: 10,
          successRate: 90,
          avgResponseTime: 150,
          lastUsed: mockTimestamp,
          lastFailureTimestamp: 0,
        });
      } else if (p.id === 'mistral') {
        stats.set(p.id, {
          providerId: p.id,
          successCount: 80,
          failureCount: 20,
          successRate: 80,
          avgResponseTime: 200,
          lastUsed: mockTimestamp,
          lastFailureTimestamp: 0,
        });
      }
    });
  });

  // Ripristina Date originale dopo ogni test
  afterEach(() => {
    global.Date = realDate;
  });

  // Test di inizializzazione
  it('dovrebbe richiedere almeno una strategia', () => {
    expect(() => {
      new AdaptiveFallbackStrategy([]);
    }).toThrow('AdaptiveFallbackStrategy richiede almeno una strategia');

    const defaultStrategy = new PreferredFallbackStrategy('openai');
    expect(() => {
      new AdaptiveFallbackStrategy([{ strategy: defaultStrategy, condition: () => true }]);
    }).not.toThrow();
  });

  // Test delle condizioni predefinite
  describe('Condizioni predefinite', () => {
    it('failureRateAbove dovrebbe valutare correttamente il tasso di fallimento', () => {
      // Statistiche con tasso di fallimento del 10%
      const statsWithLowFailureRate = new Map<string, ProviderStats>();
      statsWithLowFailureRate.set('test', {
        providerId: 'test',
        successCount: 90,
        failureCount: 10,
        successRate: 90,
        avgResponseTime: 100,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      // Statistiche con tasso di fallimento del 30%
      const statsWithHighFailureRate = new Map<string, ProviderStats>();
      statsWithHighFailureRate.set('test', {
        providerId: 'test',
        successCount: 70,
        failureCount: 30,
        successRate: 70,
        avgResponseTime: 100,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      const condition1 = failureRateAbove(20);
      expect(condition1(statsWithLowFailureRate)).toBe(false);
      expect(condition1(statsWithHighFailureRate)).toBe(true);
    });

    it('totalFailuresAbove dovrebbe contare correttamente il numero di fallimenti', () => {
      // Statistiche con 5 fallimenti
      const statsWithFewFailures = new Map<string, ProviderStats>();
      statsWithFewFailures.set('test', {
        providerId: 'test',
        successCount: 95,
        failureCount: 5,
        successRate: 95,
        avgResponseTime: 100,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      // Statistiche con 15 fallimenti
      const statsWithManyFailures = new Map<string, ProviderStats>();
      statsWithManyFailures.set('test', {
        providerId: 'test',
        successCount: 85,
        failureCount: 15,
        successRate: 85,
        avgResponseTime: 100,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      const condition = totalFailuresAbove(10);
      expect(condition(statsWithFewFailures)).toBe(false);
      expect(condition(statsWithManyFailures)).toBe(true);
    });

    it('avgLatencyAbove dovrebbe valutare correttamente la latenza media', () => {
      // Statistiche con latenza bassa
      const statsWithLowLatency = new Map<string, ProviderStats>();
      statsWithLowLatency.set('test', {
        providerId: 'test',
        successCount: 100,
        failureCount: 0,
        successRate: 100,
        avgResponseTime: 50,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      // Statistiche con latenza alta
      const statsWithHighLatency = new Map<string, ProviderStats>();
      statsWithHighLatency.set('test', {
        providerId: 'test',
        successCount: 100,
        failureCount: 0,
        successRate: 100,
        avgResponseTime: 150,
        lastUsed: mockTimestamp,
        lastFailureTimestamp: 0,
      });

      const condition = avgLatencyAbove(100);
      expect(condition(statsWithLowLatency)).toBe(false);
      expect(condition(statsWithHighLatency)).toBe(true);
    });

    it('providerLatencyAbove dovrebbe valutare correttamente la latenza di un provider specifico', () => {
      const condition = providerLatencyAbove('openai', 120);

      // Imposta una latenza sotto la soglia
      stats.get('openai')!.avgResponseTime = 100;
      expect(condition(stats)).toBe(false);

      // Imposta una latenza sopra la soglia
      stats.get('openai')!.avgResponseTime = 150;
      expect(condition(stats)).toBe(true);

      // Dovrebbe gestire provider non esistenti
      const conditionForNonExistentProvider = providerLatencyAbove('non-existent', 100);
      expect(conditionForNonExistentProvider(stats)).toBe(false);
    });

    it('providerFailedRecently dovrebbe verificare correttamente i fallimenti recenti', () => {
      // Mock per simulare diversi timestamp
      const now = mockTimestamp;
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const tenMinutesAgo = now - 10 * 60 * 1000;

      // Condizione: fallimento negli ultimi 7 minuti
      const condition = providerFailedRecently('openai', 7 * 60 * 1000);

      // Nessun fallimento recente
      stats.get('openai')!.lastFailureTimestamp = 0;
      expect(condition(stats)).toBe(false);

      // Fallimento 10 minuti fa (oltre la finestra)
      stats.get('openai')!.lastFailureTimestamp = tenMinutesAgo;
      expect(condition(stats)).toBe(false);

      // Fallimento 5 minuti fa (dentro la finestra)
      stats.get('openai')!.lastFailureTimestamp = fiveMinutesAgo;
      expect(condition(stats)).toBe(true);
    });

    it('duringTimeWindow dovrebbe verificare correttamente la finestra temporale', () => {
      // Simula diversi orari per testare le finestre temporali
      const testHour = (hour: number) => {
        // Override dell'ora corrente
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(hour);

        // Condizione: orario di ufficio (9-17)
        const workHoursCondition = duringTimeWindow(9, 17);

        // Condizione: orario notturno (22-6)
        const nightHoursCondition = duringTimeWindow(22, 6);

        if (hour >= 9 && hour <= 17) {
          expect(workHoursCondition(stats)).toBe(true);
          expect(nightHoursCondition(stats)).toBe(false);
        } else if (hour >= 22 || hour <= 6) {
          expect(workHoursCondition(stats)).toBe(false);
          expect(nightHoursCondition(stats)).toBe(true);
        } else {
          expect(workHoursCondition(stats)).toBe(false);
          expect(nightHoursCondition(stats)).toBe(false);
        }

        vi.restoreAllMocks();
      };

      // Test con varie ore
      testHour(12); // Orario di ufficio
      testHour(23); // Orario notturno
      testHour(3); // Orario notturno
      testHour(20); // Né ufficio né notte
    });

    it('allConditions dovrebbe combinare correttamente le condizioni con AND', () => {
      // Due condizioni: tasso di fallimento > 5% E latenza media > 120ms
      const condition = allConditions([failureRateAbove(5), avgLatencyAbove(120)]);

      // Solo la prima condizione è soddisfatta
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      stats.get('openai')!.avgResponseTime = 100;
      expect(condition(stats)).toBe(false);

      // Solo la seconda condizione è soddisfatta
      stats.get('openai')!.failureCount = 2;
      stats.get('openai')!.successCount = 98;
      stats.get('openai')!.avgResponseTime = 150;
      expect(condition(stats)).toBe(false);

      // Entrambe le condizioni sono soddisfatte
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      stats.get('openai')!.avgResponseTime = 150;
      expect(condition(stats)).toBe(true);
    });

    it('anyCondition dovrebbe combinare correttamente le condizioni con OR', () => {
      // Due condizioni: tasso di fallimento > 15% O latenza media > 180ms
      const condition = anyCondition([failureRateAbove(15), avgLatencyAbove(180)]);

      // Nessuna condizione è soddisfatta
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      stats.get('openai')!.avgResponseTime = 150;
      expect(condition(stats)).toBe(false);

      // Solo la prima condizione è soddisfatta
      stats.get('openai')!.failureCount = 20;
      stats.get('openai')!.successCount = 80;
      stats.get('openai')!.avgResponseTime = 150;
      expect(condition(stats)).toBe(true);

      // Solo la seconda condizione è soddisfatta
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      stats.get('openai')!.avgResponseTime = 200;
      expect(condition(stats)).toBe(true);

      // Entrambe le condizioni sono soddisfatte
      stats.get('openai')!.failureCount = 20;
      stats.get('openai')!.successCount = 80;
      stats.get('openai')!.avgResponseTime = 200;
      expect(condition(stats)).toBe(true);
    });

    it('notCondition dovrebbe negare correttamente una condizione', () => {
      const condition = notCondition(failureRateAbove(15));

      // Tasso di fallimento sotto la soglia (10%)
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      expect(condition(stats)).toBe(true);

      // Tasso di fallimento sopra la soglia (20%)
      stats.get('openai')!.failureCount = 20;
      stats.get('openai')!.successCount = 80;
      expect(condition(stats)).toBe(false);
    });
  });

  // Test di selezione delle strategie
  describe('Selezione delle strategie', () => {
    it('dovrebbe usare la strategia predefinita se nessuna condizione è soddisfatta', () => {
      // Mock delle strategie
      const defaultStrategy = {
        selectProvider: vi.fn().mockReturnValue(providers[0]), // openai
        getProvidersInOrder: vi.fn().mockReturnValue([providers[0]]),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      const secondaryStrategy = {
        selectProvider: vi.fn().mockReturnValue(providers[1]), // anthropic
        getProvidersInOrder: vi.fn().mockReturnValue([providers[1]]),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      // La condizione sarà sempre falsa
      const adaptive = new AdaptiveFallbackStrategy([
        { strategy: defaultStrategy, condition: () => false, name: 'default' },
        { strategy: secondaryStrategy, condition: () => false, name: 'secondary' },
      ]);

      // Dovrebbe usare la strategia predefinita
      const selected = adaptive.selectProvider(providers, stats);
      expect(defaultStrategy.selectProvider).toHaveBeenCalled();
      expect(secondaryStrategy.selectProvider).not.toHaveBeenCalled();
      expect(selected).toBe(providers[0]);
    });

    it('dovrebbe usare la prima strategia con condizione soddisfatta', () => {
      // Mock delle strategie
      const defaultStrategy = {
        selectProvider: vi.fn().mockReturnValue(providers[0]), // openai
        getProvidersInOrder: vi.fn().mockReturnValue([providers[0]]),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      const secondaryStrategy = {
        selectProvider: vi.fn().mockReturnValue(providers[1]), // anthropic
        getProvidersInOrder: vi.fn().mockReturnValue([providers[1]]),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      const tertiaryStrategy = {
        selectProvider: vi.fn().mockReturnValue(providers[2]), // mistral
        getProvidersInOrder: vi.fn().mockReturnValue([providers[2]]),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      // Solo la seconda condizione sarà vera
      const adaptive = new AdaptiveFallbackStrategy([
        { strategy: defaultStrategy, condition: () => false, name: 'default' },
        { strategy: secondaryStrategy, condition: () => true, name: 'secondary' },
        { strategy: tertiaryStrategy, condition: () => true, name: 'tertiary' },
      ]);

      // Dovrebbe usare la seconda strategia (la prima con condizione vera)
      const selected = adaptive.selectProvider(providers, stats);
      expect(defaultStrategy.selectProvider).not.toHaveBeenCalled();
      expect(secondaryStrategy.selectProvider).toHaveBeenCalled();
      expect(tertiaryStrategy.selectProvider).not.toHaveBeenCalled();
      expect(selected).toBe(providers[1]);
    });

    it('dovrebbe propagare le notifiche a tutte le strategie', () => {
      // Mock delle strategie
      const strategy1 = {
        selectProvider: vi.fn(),
        getProvidersInOrder: vi.fn(),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      const strategy2 = {
        selectProvider: vi.fn(),
        getProvidersInOrder: vi.fn(),
        notifySuccess: vi.fn(),
        notifyFailure: vi.fn(),
      } as unknown as FallbackStrategy;

      const adaptive = new AdaptiveFallbackStrategy([
        { strategy: strategy1, condition: () => true, name: 'strategy1' },
        { strategy: strategy2, condition: () => false, name: 'strategy2' },
      ]);

      // Notifica di successo
      adaptive.notifySuccess('openai');
      expect(strategy1.notifySuccess).toHaveBeenCalledWith('openai');
      expect(strategy2.notifySuccess).toHaveBeenCalledWith('openai');

      // Notifica di fallimento
      adaptive.notifyFailure('anthropic');
      expect(strategy1.notifyFailure).toHaveBeenCalledWith('anthropic');
      expect(strategy2.notifyFailure).toHaveBeenCalledWith('anthropic');
    });
  });

  // Test con strategie reali
  describe('Integrazione con strategie reali', () => {
    it('dovrebbe passare dalla strategia preferred a reliability quando il tasso di fallimento è alto', () => {
      // Strategia preferred con OpenAI come preferito
      const preferred = new PreferredFallbackStrategy('openai');

      // Strategia reliability che preferisce il provider con il miglior tasso di successo
      const reliability = new ReliabilityFallbackStrategy();

      // Strategia adattiva che usa preferred normalmente, ma passa a reliability quando il tasso di fallimento supera il 15%
      const adaptive = new AdaptiveFallbackStrategy(
        [
          {
            strategy: preferred,
            condition: notCondition(failureRateAbove(15)),
            name: 'preferred',
          },
          {
            strategy: reliability,
            condition: failureRateAbove(15),
            name: 'reliability',
          },
        ],
        true
      ); // abilita il debug

      // In condizioni normali (tasso di fallimento basso), dovrebbe usare la strategia preferred
      stats.get('openai')!.failureCount = 10;
      stats.get('openai')!.successCount = 90;
      stats.get('anthropic')!.failureCount = 5;
      stats.get('anthropic')!.successCount = 95;

      const selected1 = adaptive.selectProvider(providers, stats);
      expect(selected1!.id).toBe('openai'); // Da preferred (openai è preferito)
      expect(adaptive.getCurrentStrategyName()).toBe('preferred');

      // Con un tasso di fallimento alto, dovrebbe passare alla strategia reliability
      stats.get('openai')!.failureCount = 20;
      stats.get('openai')!.successCount = 80;
      stats.get('anthropic')!.failureCount = 5;
      stats.get('anthropic')!.successCount = 95;

      const selected2 = adaptive.selectProvider(providers, stats);
      expect(selected2!.id).toBe('anthropic'); // Da reliability (anthropic ha il miglior tasso di successo)
      expect(adaptive.getCurrentStrategyName()).toBe('reliability');
    });

    it('dovrebbe passare a round robin durante le ore di picco', () => {
      // Mock di getHours per simulare diversi orari del giorno
      const mockGetHours = vi.fn();
      vi.spyOn(Date.prototype, 'getHours').mockImplementation(mockGetHours);

      // Strategia preferred con OpenAI come preferito
      const preferred = new PreferredFallbackStrategy('openai');

      // Strategia round robin per distribuire il carico
      const roundRobin = new RoundRobinFallbackStrategy();

      // Strategia adattiva che usa preferred normalmente, ma passa a round robin durante l'orario di ufficio
      const adaptive = new AdaptiveFallbackStrategy([
        {
          strategy: preferred,
          condition: notCondition(duringTimeWindow(9, 17)),
          name: 'preferred',
        },
        {
          strategy: roundRobin,
          condition: duringTimeWindow(9, 17),
          name: 'roundRobin',
        },
      ]);

      // Test durante l'orario di ufficio (14:00)
      mockGetHours.mockReturnValue(14);
      const selected1 = adaptive.selectProvider(providers, stats);
      expect(adaptive.getCurrentStrategyName()).toBe('roundRobin');

      // Test fuori dall'orario di ufficio (20:00)
      mockGetHours.mockReturnValue(20);
      const selected2 = adaptive.selectProvider(providers, stats);
      expect(adaptive.getCurrentStrategyName()).toBe('preferred');
      expect(selected2!.id).toBe('openai'); // Da preferred

      vi.restoreAllMocks();
    });
  });

  // Test delle funzionalità di gestione
  describe('Gestione delle strategie', () => {
    it('dovrebbe permettere di aggiungere e rimuovere strategie', () => {
      const preferred = new PreferredFallbackStrategy('openai');
      const reliability = new ReliabilityFallbackStrategy();

      // Inizia con una strategia
      const adaptive = new AdaptiveFallbackStrategy([
        { strategy: preferred, condition: () => true, name: 'preferred' },
      ]);

      expect(adaptive.getStrategies()).toHaveLength(1);

      // Aggiungi una strategia
      adaptive.addStrategy({
        strategy: reliability,
        condition: failureRateAbove(20),
        name: 'reliability',
      });

      expect(adaptive.getStrategies()).toHaveLength(2);

      // Rimuovi una strategia
      const removed = adaptive.removeStrategy(0);
      expect(removed!.strategy).toBe(preferred);
      expect(adaptive.getStrategies()).toHaveLength(1);
      expect(adaptive.getStrategies()[0].strategy).toBe(reliability);
    });

    it("non dovrebbe permettere di rimuovere l'ultima strategia", () => {
      const strategy = new PreferredFallbackStrategy();
      const adaptive = new AdaptiveFallbackStrategy([{ strategy, condition: () => true }]);

      expect(() => {
        adaptive.removeStrategy(0);
      }).toThrow('AdaptiveFallbackStrategy deve mantenere almeno una strategia');
    });

    it('dovrebbe impostare correttamente la strategia predefinita quando si rimuove la prima', () => {
      const strategy1 = new PreferredFallbackStrategy('openai');
      const strategy2 = new ReliabilityFallbackStrategy();
      const strategy3 = new RoundRobinFallbackStrategy();

      const adaptive = new AdaptiveFallbackStrategy([
        { strategy: strategy1, condition: () => false, name: 'preferred' },
        { strategy: strategy2, condition: () => false, name: 'reliability' },
        { strategy: strategy3, condition: () => false, name: 'roundRobin' },
      ]);

      // Inizialmente usa la prima strategia come predefinita (preferred)
      const initial = adaptive.selectProvider(providers, stats);
      expect(initial!.id).toBe('openai');

      // Rimuove la prima strategia
      adaptive.removeStrategy(0);

      // Ora dovrebbe usare la seconda strategia (reliability) come predefinita
      const afterRemoval = adaptive.selectProvider(providers, stats);
      expect(afterRemoval!.id).toBe('anthropic'); // Da reliability (anthropic ha il miglior tasso di successo)
    });
  });
});
