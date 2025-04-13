/**
 * @file RoundRobinFallbackStrategy.test.ts
 * @description Test per la strategia di fallback basata su round robin
 */

import { describe, it, expect, vi } from 'vitest';
import { RoundRobinFallbackStrategy } from '../RoundRobinFallbackStrategy';
import { LLMProviderHandler } from '../../../../providers/provider-registry-stub';
import { ProviderStats } from '../../LLMFallbackManager';

describe('RoundRobinFallbackStrategy', () => {
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

  // Test di selezione ciclica
  it('dovrebbe selezionare i provider in modo ciclico', () => {
    const strategy = new RoundRobinFallbackStrategy();

    // Prima selezione: dovrebbe essere il primo provider
    const first = strategy.selectProvider(providers, stats);
    expect(first!.id).toBe('openai');

    // Seconda selezione: dovrebbe essere il secondo provider
    const second = strategy.selectProvider(providers, stats);
    expect(second!.id).toBe('anthropic');

    // Terza selezione: dovrebbe essere il terzo provider
    const third = strategy.selectProvider(providers, stats);
    expect(third!.id).toBe('mistral');

    // Quarta selezione: dovrebbe ricominciare dal primo
    const fourth = strategy.selectProvider(providers, stats);
    expect(fourth!.id).toBe('openai');
  });

  // Test con provider disabilitati
  it('dovrebbe saltare i provider disabilitati', () => {
    const disabledProviders = [
      createMockProvider('openai', false),
      createMockProvider('anthropic'),
      createMockProvider('mistral'),
    ];

    const strategy = new RoundRobinFallbackStrategy();

    // Prima selezione: dovrebbe essere anthropic (il primo abilitato)
    const first = strategy.selectProvider(disabledProviders, stats);
    expect(first!.id).toBe('anthropic');

    // Seconda selezione: dovrebbe essere mistral
    const second = strategy.selectProvider(disabledProviders, stats);
    expect(second!.id).toBe('mistral');

    // Terza selezione: dovrebbe ricominciare da anthropic
    const third = strategy.selectProvider(disabledProviders, stats);
    expect(third!.id).toBe('anthropic');
  });

  // Test con provider falliti
  it('dovrebbe saltare i provider falliti', () => {
    const strategy = new RoundRobinFallbackStrategy();
    const failedProviders = new Set(['openai', 'anthropic']);

    // Dovrebbe selezionare mistral (l'unico non fallito)
    const selected = strategy.selectProvider(providers, stats, failedProviders);
    expect(selected!.id).toBe('mistral');

    // La successiva chiamata dovrebbe ancora selezionare mistral
    // perché gli altri sono ancora nel set dei falliti
    const nextSelected = strategy.selectProvider(providers, stats, failedProviders);
    expect(nextSelected!.id).toBe('mistral');
  });

  // Test con reset
  it("dovrebbe resettare l'indice corrente", () => {
    const strategy = new RoundRobinFallbackStrategy();

    // Consumiamo alcuni provider
    strategy.selectProvider(providers, stats); // openai
    strategy.selectProvider(providers, stats); // anthropic

    // Reset dell'indice
    strategy.reset();

    // La prossima selezione dovrebbe ripartire dal primo
    const selected = strategy.selectProvider(providers, stats);
    expect(selected!.id).toBe('openai');
  });

  // Test con array vuoto
  it('dovrebbe restituire null se non ci sono provider disponibili', () => {
    const strategy = new RoundRobinFallbackStrategy();

    // Array vuoto
    const selected = strategy.selectProvider([], stats);
    expect(selected).toBeNull();

    // Solo provider disabilitati
    const disabledOnly = [createMockProvider('disabled', false)];
    const selectedDisabled = strategy.selectProvider(disabledOnly, stats);
    expect(selectedDisabled).toBeNull();
  });

  // Test di notifySuccess e notifyFailure (che non fanno nulla in questa strategia)
  it('i metodi notifySuccess e notifyFailure non dovrebbero cambiare il comportamento', () => {
    const strategy = new RoundRobinFallbackStrategy();

    // Prima selezione
    const first = strategy.selectProvider(providers, stats);
    expect(first!.id).toBe('openai');

    // Notifichiamo un successo e un fallimento
    strategy.notifySuccess('mistral');
    strategy.notifyFailure('anthropic');

    // La selezione successiva dovrebbe seguire comunque il ciclo
    const second = strategy.selectProvider(providers, stats);
    expect(second!.id).toBe('anthropic');
  });
});
