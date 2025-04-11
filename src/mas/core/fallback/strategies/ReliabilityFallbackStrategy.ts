/**
 * @file ReliabilityFallbackStrategy.ts
 * @description Strategia che seleziona i provider in base al loro tasso di successo
 */

import { FallbackStrategy } from './FallbackStrategy';
import { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import { ProviderStats } from '../LLMFallbackManager';

/**
 * Strategia che seleziona i provider in base alla loro affidabilità (tasso di successo)
 * I provider con il tasso di successo più alto vengono utilizzati per primi
 */
export class ReliabilityFallbackStrategy implements FallbackStrategy {
  /**
   * Crea una nuova istanza della strategia con preferenze di affidabilità
   * @param minimumAttempts Numero minimo di tentativi richiesti per considerare affidabile un provider
   */
  constructor(private minimumAttempts: number = 5) {}
  
  /**
   * Seleziona il provider con il miglior tasso di successo
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
   * Ottiene i provider ordinati per affidabilità (tasso di successo)
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
    
    // Crea una mappa di id -> tasso di successo per ordinare i provider
    const successRates = new Map<string, number>();
    const totalAttempts = new Map<string, number>();
    
    // Calcola il tasso di successo e tentativi totali per ogni provider
    for (const provider of availableProviders) {
      const providerStats = stats.get(provider.id);
      
      if (providerStats) {
        const attempts = providerStats.successCount + providerStats.failureCount;
        totalAttempts.set(provider.id, attempts);
        
        // Usa il tasso di successo direttamente se disponibile
        successRates.set(provider.id, providerStats.successRate);
      } else {
        // Se non ci sono statistiche, assegna un valore neutro
        totalAttempts.set(provider.id, 0);
        successRates.set(provider.id, 50); // 50% come valore predefinito neutro
      }
    }
    
    // Ordina i provider per tasso di successo (discendente), 
    // ma considera solo quelli con un numero minimo di tentativi
    return availableProviders.sort((a, b) => {
      const attemptsA = totalAttempts.get(a.id) || 0;
      const attemptsB = totalAttempts.get(b.id) || 0;
      
      // Se entrambi non hanno raggiunto il minimo di tentativi, sono equivalenti
      const aHasEnoughAttempts = attemptsA >= this.minimumAttempts;
      const bHasEnoughAttempts = attemptsB >= this.minimumAttempts;
      
      if (aHasEnoughAttempts && !bHasEnoughAttempts) return -1;
      if (!aHasEnoughAttempts && bHasEnoughAttempts) return 1;
      
      // Se entrambi hanno raggiunto il minimo, o entrambi non l'hanno raggiunto,
      // ordina per tasso di successo
      const rateA = successRates.get(a.id) || 0;
      const rateB = successRates.get(b.id) || 0;
      
      return rateB - rateA; // Ordine discendente
    });
  }
  
  /**
   * Non fa nulla nel caso di successo in questa implementazione
   * Nota: la strategia si basa sulle statistiche aggiornate dal LLMFallbackManager
   */
  notifySuccess(providerId: string): void {
    // La strategia si basa sulle statistiche aggiornate dal LLMFallbackManager
  }
  
  /**
   * Non fa nulla nel caso di fallimento in questa implementazione
   * Nota: la strategia si basa sulle statistiche aggiornate dal LLMFallbackManager
   */
  notifyFailure(providerId: string): void {
    // La strategia si basa sulle statistiche aggiornate dal LLMFallbackManager
  }
} 