/**
 * @file PreferredFallbackStrategy.ts
 * @description Strategia che seleziona prima il provider preferito e poi gli altri in ordine
 */

import { FallbackStrategy } from './FallbackStrategy';
import { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import { ProviderStats } from '../LLMFallbackManager';

/**
 * Strategia che seleziona prima il provider preferito e poi gli altri in ordine
 * Questa è la strategia predefinita del fallback manager
 */
export class PreferredFallbackStrategy implements FallbackStrategy {
  private lastSuccessfulProviderId: string | null = null;

  /**
   * Crea una nuova istanza della strategia con provider preferito
   * @param preferredProviderId ID del provider da usare come prima scelta (opzionale)
   * @param rememberSuccessful Se true, memorizza l'ultimo provider di successo come preferito
   */
  constructor(
    private preferredProviderId: string | null = null,
    private rememberSuccessful: boolean = true
  ) {
    this.lastSuccessfulProviderId = preferredProviderId;
  }

  /**
   * Seleziona il provider da utilizzare
   * Prima verifica se esiste un provider preferito, altrimenti usa il primo disponibile
   */
  selectProvider(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler | null {
    // Ottieni i provider in ordine, con il preferito per primo
    const orderedProviders = this.getProvidersInOrder(providers, stats, failedProviders);

    // Restituisci il primo provider disponibile o null se non ce ne sono
    return orderedProviders.length > 0 ? orderedProviders[0] : null;
  }

  /**
   * Ottiene i provider in ordine, con il preferito per primo
   */
  getProvidersInOrder(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler[] {
    // Filtra i provider abilitati e non falliti
    const availableProviders = providers.filter((p) => p.isEnabled && !failedProviders.has(p.id));

    // Se non ci sono provider disponibili, restituisci array vuoto
    if (availableProviders.length === 0) return [];

    // Se c'è un provider preferito, mettilo in cima alla lista
    if (this.lastSuccessfulProviderId) {
      const preferred = availableProviders.find((p) => p.id === this.lastSuccessfulProviderId);

      if (preferred) {
        // Crea un nuovo array con il provider preferito in cima
        return [preferred, ...availableProviders.filter((p) => p.id !== preferred.id)];
      }
    }

    // Nessun provider preferito o non disponibile, restituisci come sono
    return availableProviders;
  }

  /**
   * Memorizza il provider che ha avuto successo come preferito
   */
  notifySuccess(providerId: string): void {
    if (this.rememberSuccessful) {
      this.lastSuccessfulProviderId = providerId;
    }
  }

  /**
   * Non fa nulla nel caso di fallimento in questa implementazione
   */
  notifyFailure(providerId: string): void {
    // Non fa nulla in questa implementazione di base
  }

  /**
   * Imposta il provider preferito
   * @param providerId ID del provider da impostare come preferito
   */
  setPreferredProvider(providerId: string | null): void {
    this.preferredProviderId = providerId;
    this.lastSuccessfulProviderId = providerId;
  }

  /**
   * Ottiene l'ID del provider attualmente preferito
   * @returns ID del provider preferito o null se non impostato
   */
  getPreferredProviderId(): string | null {
    return this.lastSuccessfulProviderId;
  }
}
