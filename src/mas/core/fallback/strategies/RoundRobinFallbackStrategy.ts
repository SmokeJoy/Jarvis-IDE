/**
 * @file RoundRobinFallbackStrategy.ts
 * @description Strategia che seleziona i provider in modo ciclico
 */

import { FallbackStrategy } from './FallbackStrategy';
import { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import { ProviderStats } from '../LLMFallbackManager';

/**
 * Strategia che seleziona i provider in modo ciclico (round-robin)
 * Ad ogni chiamata, viene selezionato il provider successivo nell'elenco
 */
export class RoundRobinFallbackStrategy implements FallbackStrategy {
  private currentIndex: number = 0;
  
  /**
   * Seleziona il provider successivo in modo ciclico
   */
  selectProvider(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler | null {
    const orderedProviders = this.getProvidersInOrder(providers, stats, failedProviders);
    return orderedProviders.length > 0 ? orderedProviders[0] : null;
  }
  
  /**
   * Ottiene i provider in ordine ciclico, partendo dall'indice corrente
   */
  getProvidersInOrder(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler[] {
    // Filtra i provider abilitati e non falliti
    const availableProviders = providers.filter(
      p => p.isEnabled && !failedProviders.has(p.id)
    );
    
    // Se non ci sono provider disponibili, restituisci array vuoto
    if (availableProviders.length === 0) return [];
    
    // Riordina i provider partendo dall'indice corrente
    if (this.currentIndex >= availableProviders.length) {
      this.currentIndex = 0; // Reset dell'indice se supera il numero di provider
    }
    
    // Crea un array che parte dall'indice corrente e poi continua dall'inizio
    const reorderedProviders = [
      ...availableProviders.slice(this.currentIndex),
      ...availableProviders.slice(0, this.currentIndex)
    ];
    
    // Incrementa l'indice per la prossima chiamata
    this.currentIndex = (this.currentIndex + 1) % availableProviders.length;
    
    return reorderedProviders;
  }
  
  /**
   * Non fa nulla nel caso di successo in questa implementazione
   */
  notifySuccess(providerId: string): void {
    // Non fa nulla in questa implementazione (il round-robin non tiene conto dei successi)
  }
  
  /**
   * Non fa nulla nel caso di fallimento in questa implementazione
   */
  notifyFailure(providerId: string): void {
    // Non fa nulla in questa implementazione (il round-robin non tiene conto dei fallimenti)
  }
  
  /**
   * Resetta l'indice corrente
   */
  reset(): void {
    this.currentIndex = 0;
  }
} 