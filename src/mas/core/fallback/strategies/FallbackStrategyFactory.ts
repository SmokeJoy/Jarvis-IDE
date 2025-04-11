/**
 * @file FallbackStrategyFactory.ts
 * @description Factory per la creazione dinamica delle strategie di fallback
 */

import {
  FallbackStrategy,
  PreferredFallbackStrategy,
  RoundRobinFallbackStrategy,
  ReliabilityFallbackStrategy
} from './';

/**
 * Parametri comuni accettati dalla factory
 */
export interface StrategyOptions {
  preferredProvider?: string;
  rememberSuccessful?: boolean;
  minimumAttempts?: number;
}

/**
 * Factory per la creazione dinamica delle strategie di fallback
 */
export class FallbackStrategyFactory {
  /**
   * Crea una strategia di fallback in base al tipo specificato
   * @param type Tipo della strategia (preferred, roundRobin, reliability)
   * @param options Opzioni per configurare la strategia
   */
  static create(type: string, options: StrategyOptions = {}): FallbackStrategy {
    switch (type) {
      case 'preferred':
        return new PreferredFallbackStrategy(
          options.preferredProvider || null,
          options.rememberSuccessful !== false
        );

      case 'roundRobin':
        return new RoundRobinFallbackStrategy();

      case 'reliability':
        return new ReliabilityFallbackStrategy(
          options.minimumAttempts ?? 5
        );

      default:
        throw new Error(`Strategia di fallback non supportata: ${type}`);
    }
  }

  /**
   * Restituisce l'elenco delle strategie supportate
   */
  static getAvailableStrategies(): string[] {
    return ['preferred', 'roundRobin', 'reliability'];
  }
} 