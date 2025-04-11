/**
 * @file FallbackStrategy.ts
 * @description Interfaccia per le strategie di selezione dei provider di fallback
 */

import type { LLMProviderHandler } from '../../../providers/provider-registry-stub';
import type { ProviderStats } from '../LLMFallbackManager';

/**
 * Interfaccia per le strategie di selezione dei provider di fallback
 * Ogni strategia implementa un algoritmo specifico per selezionare il prossimo provider da utilizzare
 */
export interface FallbackStrategy {
  /**
   * Seleziona il provider da utilizzare in base alla strategia implementata
   * @param providers Array di provider disponibili
   * @param stats Statistiche di utilizzo dei provider
   * @param failedProviders Set opzionale di ID dei provider che hanno già fallito 
   * nella sequenza di fallback corrente
   * @returns Il provider selezionato o null se nessun provider è disponibile
   */
  selectProvider(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders?: Set<string>
  ): LLMProviderHandler | null;
  
  /**
   * Determina l'ordine di utilizzo dei provider per il fallback
   * @param providers Array di provider disponibili
   * @param stats Statistiche di utilizzo dei provider
   * @param failedProviders Set opzionale di ID dei provider che hanno già fallito
   * @returns Array ordinato di provider da provare in sequenza
   */
  getProvidersInOrder(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders?: Set<string>
  ): LLMProviderHandler[];
  
  /**
   * Notifica alla strategia che un provider ha avuto successo
   * Può essere utilizzato per aggiornare lo stato interno della strategia
   * @param providerId ID del provider che ha avuto successo
   */
  notifySuccess(providerId: string): void;
  
  /**
   * Notifica alla strategia che un provider ha fallito
   * Può essere utilizzato per aggiornare lo stato interno della strategia
   * @param providerId ID del provider che ha fallito 
   */
  notifyFailure(providerId: string): void;
} 