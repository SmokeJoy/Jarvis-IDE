/**
 * @file CompositeFallbackStrategy.ts
 * @description Strategia di fallback che combina più strategie in sequenza
 */

import type { FallbackStrategy } from './FallbackStrategy';
import type { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import type { ProviderStats } from '../LLMFallbackManager';

/**
 * Strategia che combina più strategie di fallback, consultandole in sequenza
 * per ottenere un comportamento più complesso e flessibile
 */
export class CompositeFallbackStrategy implements FallbackStrategy {
  /**
   * Crea una nuova strategia composita
   * @param strategies Array di strategie da combinare, in ordine di priorità
   */
  constructor(private strategies: FallbackStrategy[]) {
    if (!strategies || strategies.length === 0) {
      throw new Error('CompositeFallbackStrategy richiede almeno una strategia');
    }
  }
  
  /**
   * Seleziona il provider consultando ogni strategia in sequenza
   * Restituisce il primo provider valido trovato da una delle strategie
   */
  selectProvider(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler | null {
    // Filtra i provider validi (abilitati e non falliti)
    const validProviders = providers.filter(
      p => p.isEnabled && !failedProviders.has(p.id)
    );
    
    if (validProviders.length === 0) return null;
    
    // Consulta ogni strategia in sequenza
    for (const strategy of this.strategies) {
      const provider = strategy.selectProvider(validProviders, stats, failedProviders);
      if (provider) return provider;
    }
    
    // Se nessuna strategia ha restituito un provider valido, usa il primo disponibile
    return validProviders[0];
  }
  
  /**
   * Ottiene i provider in ordine combinando gli ordinamenti di tutte le strategie
   * e rimuovendo i duplicati
   */
  getProvidersInOrder(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler[] {
    // Filtra i provider validi (abilitati e non falliti)
    const validProviders = providers.filter(
      p => p.isEnabled && !failedProviders.has(p.id)
    );
    
    if (validProviders.length === 0) return [];
    
    // Set per tracciare i provider già inclusi (per rimuovere duplicati)
    const includedProviderIds = new Set<string>();
    const result: LLMProviderHandler[] = [];
    
    // Per ogni strategia, ottieni i provider ordinati e aggiungi quelli non ancora inclusi
    for (const strategy of this.strategies) {
      const orderedProviders = strategy.getProvidersInOrder(validProviders, stats, failedProviders);
      
      for (const provider of orderedProviders) {
        if (!includedProviderIds.has(provider.id)) {
          result.push(provider);
          includedProviderIds.add(provider.id);
        }
      }
    }
    
    // Aggiungi eventuali provider validi rimanenti che non sono stati inclusi da nessuna strategia
    for (const provider of validProviders) {
      if (!includedProviderIds.has(provider.id)) {
        result.push(provider);
        includedProviderIds.add(provider.id);
      }
    }
    
    return result;
  }
  
  /**
   * Notifica tutte le strategie interne di un successo
   */
  notifySuccess(providerId: string): void {
    // Propaga la notifica a tutte le strategie
    for (const strategy of this.strategies) {
      strategy.notifySuccess(providerId);
    }
  }
  
  /**
   * Notifica tutte le strategie interne di un fallimento
   */
  notifyFailure(providerId: string): void {
    // Propaga la notifica a tutte le strategie
    for (const strategy of this.strategies) {
      strategy.notifyFailure(providerId);
    }
  }
  
  /**
   * Restituisce l'array di strategie contenute in questa strategia composita
   */
  getStrategies(): FallbackStrategy[] {
    return [...this.strategies];
  }
  
  /**
   * Aggiunge una strategia alla composizione
   * @param strategy Strategia da aggiungere
   */
  addStrategy(strategy: FallbackStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Rimuove una strategia dalla composizione
   * @param index Indice della strategia da rimuovere
   * @returns La strategia rimossa o undefined se l'indice non è valido
   */
  removeStrategy(index: number): FallbackStrategy | undefined {
    if (index < 0 || index >= this.strategies.length) {
      return undefined;
    }
    
    // Verifica che rimanga almeno una strategia
    if (this.strategies.length <= 1) {
      throw new Error('CompositeFallbackStrategy deve mantenere almeno una strategia');
    }
    
    return this.strategies.splice(index, 1)[0];
  }
} 