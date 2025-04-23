import { vi } from 'vitest';
/**
 * @file ReliabilityFallbackStrategy.test.ts
 * @description Test per la strategia di fallback basata sull'affidabilità
 */

import { describe, it, expect, vi } from 'vitest';
import { ReliabilityFallbackStrategy } from '../ReliabilityFallbackStrategy';
import { LLMProviderHandler } from '../../../../providers/provider-registry-stub';
import { ProviderStats } from '../../LLMFallbackManager';

describe('ReliabilityFallbackStrategy', () => {
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

  // Test di base con statistiche diverse
  it('dovrebbe selezionare i provider in base al tasso di successo', () => {
    // Configura statistiche con tassi di successo diversi
    const stats = new Map<string, ProviderStats>();

    // OpenAI: 60% di successo con 10 tentativi
    stats.set('openai', {
      providerId: 'openai',
      successCount: 6,
      failureCount: 4,
      successRate: 60,
      avgResponseTime: 100,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Anthropic: 80% di successo con 10 tentativi
    stats.set('anthropic', {
      providerId: 'anthropic',
      successCount: 8,
      failureCount: 2,
      successRate: 80,
      avgResponseTime: 150,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Mistral: 90% di successo con 10 tentativi
    stats.set('mistral', {
      providerId: 'mistral',
      successCount: 9,
      failureCount: 1,
      successRate: 90,
      avgResponseTime: 120,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    const strategy = new ReliabilityFallbackStrategy();

    // Dovrebbe selezionare mistral (il più affidabile)
    const selected = strategy.selectProvider(providers, stats);
    expect(selected!.id).toBe('mistral');

    // Verifica l'ordine completo dei provider
    const orderedProviders = strategy.getProvidersInOrder(providers, stats);
    expect(orderedProviders.map((p) => p.id)).toEqual(['mistral', 'anthropic', 'openai']);
  });

  // Test con statistiche insufficienti
  it('dovrebbe considerare il numero minimo di tentativi', () => {
    // Configura statistiche con tassi di successo diversi ma alcuni con pochi tentativi
    const stats = new Map<string, ProviderStats>();

    // OpenAI: 50% di successo con pochi tentativi (sotto la soglia)
    stats.set('openai', {
      providerId: 'openai',
      successCount: 2,
      failureCount: 2,
      successRate: 50,
      avgResponseTime: 100,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Anthropic: 100% di successo ma con un solo tentativo (sotto la soglia)
    stats.set('anthropic', {
      providerId: 'anthropic',
      successCount: 1,
      failureCount: 0,
      successRate: 100,
      avgResponseTime: 150,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Mistral: 70% di successo con molti tentativi (sopra la soglia)
    stats.set('mistral', {
      providerId: 'mistral',
      successCount: 7,
      failureCount: 3,
      successRate: 70,
      avgResponseTime: 120,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Imposta una soglia di 5 tentativi
    const strategy = new ReliabilityFallbackStrategy(5);

    // Dovrebbe selezionare mistral (l'unico con abbastanza tentativi)
    const selected = strategy.selectProvider(providers, stats);
    expect(selected!.id).toBe('mistral');
  });

  // Test quando tutti i provider hanno pochi tentativi
  it('dovrebbe ordinare per tasso di successo anche se nessun provider ha abbastanza tentativi', () => {
    // Configura statistiche con tassi di successo diversi ma tutti con pochi tentativi
    const stats = new Map<string, ProviderStats>();

    // OpenAI: 50% di successo con pochi tentativi
    stats.set('openai', {
      providerId: 'openai',
      successCount: 1,
      failureCount: 1,
      successRate: 50,
      avgResponseTime: 100,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Anthropic: 100% di successo ma con un solo tentativo
    stats.set('anthropic', {
      providerId: 'anthropic',
      successCount: 2,
      failureCount: 0,
      successRate: 100,
      avgResponseTime: 150,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Mistral: 67% di successo con pochi tentativi
    stats.set('mistral', {
      providerId: 'mistral',
      successCount: 2,
      failureCount: 1,
      successRate: 67,
      avgResponseTime: 120,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    // Imposta una soglia di 10 tentativi (nessuno la raggiunge)
    const strategy = new ReliabilityFallbackStrategy(10);

    // Verifica l'ordine completo dei provider (dovrebbe essere per tasso di successo)
    const orderedProviders = strategy.getProvidersInOrder(providers, stats);
    expect(orderedProviders.map((p) => p.id)).toEqual(['anthropic', 'mistral', 'openai']);
  });

  // Test con provider disabilitati
  it('dovrebbe ignorare i provider disabilitati', () => {
    const stats = new Map<string, ProviderStats>();

    // Imposta statistiche simili per tutti
    providers.forEach((p) => {
      stats.set(p.id, {
        providerId: p.id,
        successCount: 5,
        failureCount: 5,
        successRate: 50,
        avgResponseTime: 100,
        lastUsed: Date.now(),
        lastFailureTimestamp: 0,
      });
    });

    const strategy = new ReliabilityFallbackStrategy();
    const orderedProviders = strategy.getProvidersInOrder(providers, stats);

    // Verifica che il provider disabilitato non sia incluso
    expect(orderedProviders.map((p) => p.id)).not.toContain('disabled');
    expect(orderedProviders.length).toBe(3); // Solo i provider abilitati
  });

  // Test con provider falliti
  it('dovrebbe saltare i provider falliti', () => {
    const stats = new Map<string, ProviderStats>();

    // Imposta statistiche con mistral come il più affidabile
    providers.forEach((p) => {
      const successRate = p.id === 'mistral' ? 90 : 50;
      stats.set(p.id, {
        providerId: p.id,
        successCount: 9,
        failureCount: p.id === 'mistral' ? 1 : 9,
        successRate,
        avgResponseTime: 100,
        lastUsed: Date.now(),
        lastFailureTimestamp: 0,
      });
    });

    const strategy = new ReliabilityFallbackStrategy();

    // Mistral è fallito in questa sequenza
    const failedProviders = new Set(['mistral']);

    // Dovrebbe selezionare uno dei rimanenti provider (non mistral)
    const selected = strategy.selectProvider(providers, stats, failedProviders);
    expect(selected!.id).not.toBe('mistral');
  });

  // Test con provider senza statistiche
  it('dovrebbe gestire correttamente provider senza statistiche', () => {
    // Statistiche solo per alcuni provider
    const stats = new Map<string, ProviderStats>();

    // Statistiche solo per openai e anthropic
    stats.set('openai', {
      providerId: 'openai',
      successCount: 8,
      failureCount: 2,
      successRate: 80,
      avgResponseTime: 100,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    stats.set('anthropic', {
      providerId: 'anthropic',
      successCount: 6,
      failureCount: 4,
      successRate: 60,
      avgResponseTime: 150,
      lastUsed: Date.now(),
      lastFailureTimestamp: 0,
    });

    const strategy = new ReliabilityFallbackStrategy();
    const orderedProviders = strategy.getProvidersInOrder(providers, stats);

    // I provider con statistiche dovrebbero venire prima, ordinati per tasso di successo
    expect(orderedProviders[0].id).toBe('openai');
    expect(orderedProviders[1].id).toBe('anthropic');

    // Mistral dovrebbe essere incluso anche senza statistiche
    expect(orderedProviders.map((p) => p.id)).toContain('mistral');
  });
});
