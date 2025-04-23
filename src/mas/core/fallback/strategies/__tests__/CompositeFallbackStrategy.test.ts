import { vi } from 'vitest';
/**
 * @file CompositeFallbackStrategy.test.ts
 * @description Test per la strategia di fallback composita
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CompositeFallbackStrategy,
  PreferredFallbackStrategy,
  RoundRobinFallbackStrategy,
  ReliabilityFallbackStrategy,
} from '../';
import { LLMProviderHandler } from '../../../../providers/provider-registry-stub';
import { ProviderStats } from '../../LLMFallbackManager';

describe('CompositeFallbackStrategy', () => {
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
  const stats = new Map<string, ProviderStats>();
  providers.forEach((p) => {
    stats.set(p.id, {
      providerId: p.id,
      successCount: p.id === 'anthropic' ? 100 : 10,
      failureCount: p.id === 'anthropic' ? 0 : 5,
      successRate: p.id === 'anthropic' ? 100 : 67,
      avgResponseTime: 100,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });
  });

  // Test di inizializzazione
  it('dovrebbe richiedere almeno una strategia', () => {
    expect(() => {
      new CompositeFallbackStrategy([]);
    }).toThrow('CompositeFallbackStrategy richiede almeno una strategia');

    expect(() => {
      new CompositeFallbackStrategy([new PreferredFallbackStrategy()]);
    }).not.toThrow();
  });

  // Test di base per selectProvider
  it('dovrebbe consultare le strategie in ordine per selezionare un provider', () => {
    // Mock delle strategie
    const strategy1 = {
      selectProvider: vi.fn().mockReturnValue(null),
      getProvidersInOrder: vi.fn().mockReturnValue([]),
      notifySuccess: vi.fn(),
      notifyFailure: vi.fn(),
    } as unknown as FallbackStrategy;

    const strategy2 = {
      selectProvider: vi.fn().mockReturnValue(providers[1]), // anthropic
      getProvidersInOrder: vi.fn().mockReturnValue([]),
      notifySuccess: vi.fn(),
      notifyFailure: vi.fn(),
    } as unknown as FallbackStrategy;

    // Crea la strategia composita
    const composite = new CompositeFallbackStrategy([strategy1, strategy2]);

    // Verifica che le strategie vengano consultate in ordine
    const selected = composite.selectProvider(providers, stats);

    expect(strategy1.selectProvider).toHaveBeenCalled();
    expect(strategy2.selectProvider).toHaveBeenCalled();
    expect(selected).toBe(providers[1]); // anthropic da strategy2
  });

  // Test con strategie reali
  it('dovrebbe combinare correttamente strategie reali', () => {
    const preferredStrategy = new PreferredFallbackStrategy('mistral');
    const reliabilityStrategy = new ReliabilityFallbackStrategy();

    const composite = new CompositeFallbackStrategy([preferredStrategy, reliabilityStrategy]);

    // Verifica che venga selezionato il provider preferito
    const selected = composite.selectProvider(providers, stats);
    expect(selected!.id).toBe('mistral'); // da preferredStrategy

    // Con preferredProvider fallito, dovrebbe usare la seconda strategia
    const failedProviders = new Set(['mistral']);
    const fallbackSelected = composite.selectProvider(providers, stats, failedProviders);

    // Verifichiamo che il provider selezionato sia uno di quelli abilitati e non fallito
    expect(failedProviders.has(fallbackSelected!.id)).toBe(false);
    expect(fallbackSelected!.isEnabled).toBe(true);

    // Basandosi sulle statistiche, dovrebbe selezionare un provider valido
    // Nota: il comportamento esatto dipende dall'implementazione delle strategie,
    // quindi verifichiamo solo che sia uno dei provider disponibili
    const availableIds = providers
      .filter((p) => p.isEnabled && !failedProviders.has(p.id))
      .map((p) => p.id);
    expect(availableIds).toContain(fallbackSelected!.id);
  });

  // Test di getProvidersInOrder
  it('dovrebbe combinare i provider ordinati da tutte le strategie, rimuovendo duplicati', () => {
    // Prima strategia: mistral in cima, poi il resto
    const preferredStrategy = new PreferredFallbackStrategy('mistral');

    // Seconda strategia: ordina per affidabilità (anthropic in cima per success rate 100%)
    const reliabilityStrategy = new ReliabilityFallbackStrategy();

    const composite = new CompositeFallbackStrategy([preferredStrategy, reliabilityStrategy]);

    const orderedProviders = composite.getProvidersInOrder(providers, stats);
    const orderedIds = orderedProviders.map((p) => p.id);

    // Risultato atteso: l'ordine esatto può dipendere dall'implementazione interna
    // L'importante è che mistral sia primo (dalla preferredStrategy)
    // e che tutti i provider abilitati siano inclusi senza duplicati
    expect(orderedIds).toContain('mistral');
    expect(orderedIds).toContain('anthropic');
    expect(orderedIds).toContain('openai');
    expect(orderedIds).toHaveLength(3);
    expect(orderedIds[0]).toBe('mistral'); // Il primo deve essere mistral (preferito)

    // Non dovrebbe includere provider disabilitati
    expect(orderedIds).not.toContain('disabled');
  });

  // Test di propagazione delle notifiche
  it('dovrebbe propagare le notifiche a tutte le strategie interne', () => {
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

    const composite = new CompositeFallbackStrategy([strategy1, strategy2]);

    // Verifica propagazione di notifySuccess
    composite.notifySuccess('openai');
    expect(strategy1.notifySuccess).toHaveBeenCalledWith('openai');
    expect(strategy2.notifySuccess).toHaveBeenCalledWith('openai');

    // Verifica propagazione di notifyFailure
    composite.notifyFailure('anthropic');
    expect(strategy1.notifyFailure).toHaveBeenCalledWith('anthropic');
    expect(strategy2.notifyFailure).toHaveBeenCalledWith('anthropic');
  });

  // Test di gestione delle strategie
  it('dovrebbe permettere di aggiungere e rimuovere strategie', () => {
    const strategy1 = new PreferredFallbackStrategy('openai');
    const strategy2 = new ReliabilityFallbackStrategy();

    // Inizia con una strategia
    const composite = new CompositeFallbackStrategy([strategy1]);
    expect(composite.getStrategies()).toHaveLength(1);

    // Aggiungi una strategia
    composite.addStrategy(strategy2);
    expect(composite.getStrategies()).toHaveLength(2);

    // Rimuovi una strategia
    const removed = composite.removeStrategy(0);
    expect(removed).toBe(strategy1);
    expect(composite.getStrategies()).toHaveLength(1);
    expect(composite.getStrategies()[0]).toBe(strategy2);
  });

  // Test di rimozione con protezione
  it("non dovrebbe permettere di rimuovere l'ultima strategia", () => {
    const strategy = new PreferredFallbackStrategy();
    const composite = new CompositeFallbackStrategy([strategy]);

    expect(() => {
      composite.removeStrategy(0);
    }).toThrow('CompositeFallbackStrategy deve mantenere almeno una strategia');
  });

  // Test con RoundRobin
  it('dovrebbe funzionare correttamente con RoundRobinFallbackStrategy', () => {
    const roundRobin = new RoundRobinFallbackStrategy();
    const preferred = new PreferredFallbackStrategy('openai');

    const composite = new CompositeFallbackStrategy([preferred, roundRobin]);

    // Prima selezione: dovrebbe usare openai dalla strategia preferred
    const first = composite.selectProvider(providers, stats);
    expect(first!.id).toBe('openai');

    // Con openai fallito, dovrebbe passare alla seconda strategia (round robin)
    const failedProviders = new Set(['openai']);
    const second = composite.selectProvider(providers, stats, failedProviders);

    // Dovrebbe selezionare uno dei provider rimanenti
    expect(second!.id).not.toBe('openai');
    expect(['anthropic', 'mistral']).toContain(second!.id);
  });
});
