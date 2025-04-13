/**
 * @file PreferredFallbackStrategy.test.ts
 * @description Test per la strategia di fallback basata su provider preferito
 */

import { describe, it, expect, vi } from 'vitest';
import { PreferredFallbackStrategy } from '../PreferredFallbackStrategy';
import { LLMProviderHandler } from '../../../../providers/provider-registry-stub';
import { ProviderStats } from '../../LLMFallbackManager';

describe('PreferredFallbackStrategy', () => {
  // Crea provider di test
  const createMockProvider = (id: string, isEnabled: boolean = true): LLMProviderHandler =>
    ({
      id,
      name: `Provider ${id}`,
      isEnabled,
      handle: vi.fn(),
    }) as unknown as LLMProviderHandler;

  const providers = [
    createMockProvider('openai'),
    createMockProvider('anthropic'),
    createMockProvider('mistral'),
    createMockProvider('disabled', false),
  ];

  // Crea una mappa di statistiche
  const stats = new Map<string, ProviderStats>();
  providers.forEach((p) => {
    stats.set(p.id, {
      providerId: p.id,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastUsed: 0,
      lastFailureTimestamp: 0,
    });
  });

  // Test di base
  it('dovrebbe selezionare il provider preferito se specificato', () => {
    const strategy = new PreferredFallbackStrategy('anthropic');
    const selected = strategy.selectProvider(providers, stats);

    expect(selected).not.toBeNull();
    expect(selected!.id).toBe('anthropic');
  });

  // Test con provider preferito disabilitato
  it('dovrebbe ignorare un provider preferito disabilitato', () => {
    const strategy = new PreferredFallbackStrategy('disabled');
    const selected = strategy.selectProvider(providers, stats);

    expect(selected).not.toBeNull();
    expect(selected!.id).not.toBe('disabled');
  });

  // Test senza provider preferito
  it('dovrebbe selezionare il primo provider disponibile se nessun preferito è specificato', () => {
    const strategy = new PreferredFallbackStrategy();
    const selected = strategy.selectProvider(providers, stats);

    expect(selected).not.toBeNull();
    expect(selected!.id).toBe('openai');
  });

  // Test con provider preferito non disponibile
  it('dovrebbe fallback al primo provider se quello preferito non esiste', () => {
    const strategy = new PreferredFallbackStrategy('cohere');
    const selected = strategy.selectProvider(providers, stats);

    expect(selected).not.toBeNull();
    expect(selected!.id).toBe('openai');
  });

  // Test con provider falliti
  it('dovrebbe saltare i provider falliti', () => {
    const strategy = new PreferredFallbackStrategy('openai');
    const failedProviders = new Set(['openai']);

    const selected = strategy.selectProvider(providers, stats, failedProviders);

    expect(selected).not.toBeNull();
    expect(selected!.id).toBe('anthropic');
  });

  // Test di getProvidersInOrder
  it('dovrebbe ordinare i provider con il preferito in cima', () => {
    const strategy = new PreferredFallbackStrategy('mistral');
    const orderedProviders = strategy.getProvidersInOrder(providers, stats);

    expect(orderedProviders).toHaveLength(3); // 3 provider abilitati
    expect(orderedProviders[0].id).toBe('mistral');
  });

  // Test di notifySuccess
  it('dovrebbe aggiornare il provider preferito quando notificato di un successo', () => {
    const strategy = new PreferredFallbackStrategy(null, true);

    // Inizialmente nessun provider preferito
    expect(strategy.getPreferredProviderId()).toBeNull();

    // Notifica un successo
    strategy.notifySuccess('anthropic');

    // Verifica che il provider sia stato memorizzato
    expect(strategy.getPreferredProviderId()).toBe('anthropic');
  });

  // Test con rememberSuccessful=false
  it('non dovrebbe memorizzare il provider di successo se rememberSuccessful è false', () => {
    const strategy = new PreferredFallbackStrategy('openai', false);

    // Il provider preferito iniziale è openai
    expect(strategy.getPreferredProviderId()).toBe('openai');

    // Notifica un successo di un provider diverso
    strategy.notifySuccess('anthropic');

    // Verifica che il provider preferito sia rimasto invariato
    expect(strategy.getPreferredProviderId()).toBe('openai');
  });
});
