/**
 * @file AdaptiveFallbackStrategy.ts
 * @description Strategia di fallback che seleziona dinamicamente la strategia più appropriata in base a condizioni
 */

import { FallbackStrategy } from './FallbackStrategy';
import { LLMProviderHandler, ProviderStats } from '@/mas/types/llm-provider.types';
import { LLMEventBus, AdaptiveStrategyChangePayload } from '@/mas/types/llm-events';
import { PreferredFallbackStrategy } from './PreferredFallbackStrategy';
import { AdaptiveCondition } from './adaptive-conditions';

/**
 * Definisce una strategia con la sua condizione di attivazione
 */
export interface StrategyWithCondition {
  /** La strategia di fallback da utilizzare quando la condizione è soddisfatta */
  strategy: FallbackStrategy;

  /** Condizione che determina quando la strategia dovrebbe essere attivata */
  condition: AdaptiveCondition;

  /** Nome opzionale per identificare questa entry di strategia nei log */
  name?: string;
}

/**
 * Strategia che seleziona dinamicamente la migliore strategia di fallback
 * in base a condizioni di sistema e performance dei provider.
 *
 * Se nessuna condizione è soddisfatta, viene utilizzata la strategia predefinita (la prima nell'array).
 */
export class AdaptiveFallbackStrategy implements FallbackStrategy {
  private currentStrategyName: string = 'default';
  private debugEnabled: boolean = false;

  constructor(
    private strategies: Array<{
      name: string;
      strategy: FallbackStrategy;
      condition: AdaptiveCondition;
    }>,
    private defaultStrategy: FallbackStrategy = new PreferredFallbackStrategy(),
    private eventBus?: LLMEventBus
  ) {
    if (!strategies || strategies.length === 0) {
      throw new Error('AdaptiveFallbackStrategy richiede almeno una strategia');
    }
  }

  selectProvider(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler | null {
    try {
      const activeStrategy = this.getActiveStrategy(stats, providers);
      return activeStrategy.selectProvider(providers, stats, failedProviders);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`❌ Errore nella selezione della strategia: ${error.message}`);
      throw error;
    }
  }

  getProvidersInOrder(
    providers: LLMProviderHandler[],
    stats: Map<string, ProviderStats>,
    failedProviders: Set<string> = new Set()
  ): LLMProviderHandler[] {
    const activeStrategy = this.getActiveStrategy(stats, providers);
    return activeStrategy.getProvidersInOrder(providers, stats, failedProviders);
  }

  private getActiveStrategy(
    stats: Map<string, ProviderStats>,
    providers: LLMProviderHandler[]
  ): FallbackStrategy {
    // Controlla ogni strategia in ordine, la prima con condizione soddisfatta viene utilizzata
    for (const entry of this.strategies) {
      if (entry.condition(stats)) {
        const strategyName = entry.name || 'unnamed';

        // Se è cambiata la strategia attiva, emetti l'evento
        if (this.currentStrategyName !== strategyName) {
          if (this.debugEnabled) {
            console.log(
              `[AdaptiveFallbackStrategy] Cambio strategia: ${this.currentStrategyName} -> ${strategyName}`
            );
          }

          if (this.eventBus) {
            const payload: AdaptiveStrategyChangePayload = {
              providerId: providers[0]?.id || 'unknown',
              timestamp: Date.now(),
              fromStrategy: this.currentStrategyName,
              toStrategy: strategyName,
              reason: 'Condition met',
              stats,
            };
            this.eventBus.emit('strategy:adaptive:change', payload);
          }

          this.currentStrategyName = strategyName;
        }

        return entry.strategy;
      }
    }

    // Se nessuna condizione è soddisfatta, usa la strategia predefinita
    if (this.currentStrategyName !== 'default') {
      if (this.debugEnabled) {
        console.log(`[AdaptiveFallbackStrategy] Ritorno alla strategia predefinita`);
      }

      if (this.eventBus) {
        const payload: AdaptiveStrategyChangePayload = {
          providerId: providers[0]?.id || 'unknown',
          timestamp: Date.now(),
          fromStrategy: this.currentStrategyName,
          toStrategy: 'default',
          reason: 'No conditions satisfied',
          stats,
        };
        this.eventBus.emit('strategy:adaptive:change', payload);
      }

      this.currentStrategyName = 'default';
    }

    return this.defaultStrategy;
  }

  notifySuccess(providerId: string): void {
    // Propaga la notifica a tutte le strategie
    this.strategies.forEach((entry) => entry.strategy.notifySuccess(providerId));
    this.defaultStrategy.notifySuccess(providerId);
  }

  notifyFailure(providerId: string): void {
    // Propaga la notifica a tutte le strategie
    this.strategies.forEach((entry) => entry.strategy.notifyFailure(providerId));
    this.defaultStrategy.notifyFailure(providerId);
  }

  getCurrentStrategyName(): string {
    return this.currentStrategyName;
  }
}
