/**
 * @file FallbackStrategyFactory.ts
 * @description Factory per la creazione dinamica delle strategie di fallback
 */

import {
  FallbackStrategy,
  PreferredFallbackStrategy,
  RoundRobinFallbackStrategy,
  ReliabilityFallbackStrategy,
  CompositeFallbackStrategy,
  AdaptiveFallbackStrategy,
  StrategyWithCondition,
} from './';

import {
  failureRateAbove,
  totalFailuresAbove,
  avgLatencyAbove,
  providerLatencyAbove,
  providerFailedRecently,
  duringTimeWindow,
  allConditions,
  anyCondition,
  AdaptiveCondition,
} from './adaptive-conditions';

/**
 * Parametri comuni accettati dalla factory
 */
export interface StrategyOptions {
  preferredProvider?: string;
  rememberSuccessful?: boolean;
  minimumAttempts?: number;
  strategies?: Array<{
    type: string;
    options?: StrategyOptions;
  }>;
  // Opzioni specifiche per la strategia adattiva
  adaptiveStrategies?: Array<{
    type: string;
    options?: StrategyOptions;
    condition: AdaptiveConditionOptions;
    name?: string;
  }>;
  debug?: boolean;
}

/**
 * Opzioni per configurare le condizioni adattive
 */
export interface AdaptiveConditionOptions {
  type:
    | 'failureRate'
    | 'totalFailures'
    | 'avgLatency'
    | 'providerLatency'
    | 'providerFailed'
    | 'timeWindow'
    | 'and'
    | 'or'
    | 'not';
  threshold?: number;
  providerId?: string;
  timeWindowMs?: number;
  startHour?: number;
  endHour?: number;
  conditions?: AdaptiveConditionOptions[];
  condition?: AdaptiveConditionOptions;
}

/**
 * Factory per la creazione dinamica delle strategie di fallback
 */
export class FallbackStrategyFactory {
  /**
   * Crea una strategia di fallback in base al tipo specificato
   * @param type Tipo della strategia (preferred, roundRobin, reliability, composite, adaptive)
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
        return new ReliabilityFallbackStrategy(options.minimumAttempts ?? 5);

      case 'composite':
        if (!options.strategies || options.strategies.length === 0) {
          throw new Error('La strategia composite richiede un array di strategie');
        }

        // Crea le strategie interne in base alle configurazioni fornite
        const internalStrategies = options.strategies.map((strategyConfig) =>
          FallbackStrategyFactory.create(strategyConfig.type, strategyConfig.options || {})
        );

        return new CompositeFallbackStrategy(internalStrategies);

      case 'adaptive':
        if (!options.adaptiveStrategies || options.adaptiveStrategies.length === 0) {
          throw new Error('La strategia adaptive richiede almeno una strategia con condizione');
        }

        // Crea le strategie con condizioni
        const adaptiveEntries: StrategyWithCondition[] = options.adaptiveStrategies.map((entry) => {
          const strategy = FallbackStrategyFactory.create(entry.type, entry.options || {});
          const condition = this.createCondition(entry.condition);

          return {
            strategy,
            condition,
            name: entry.name || entry.type,
          };
        });

        return new AdaptiveFallbackStrategy(adaptiveEntries, options.debug || false);

      default:
        throw new Error(`Strategia di fallback non supportata: ${type}`);
    }
  }

  /**
   * Crea una condizione adattiva in base alle opzioni specificate
   * @param options Configurazione della condizione
   * @returns Funzione condizione configurata
   */
  private static createCondition(options: AdaptiveConditionOptions): AdaptiveCondition {
    if (!options) {
      throw new Error('Opzioni condizione richieste');
    }

    switch (options.type) {
      case 'failureRate':
        return failureRateAbove(options.threshold || 20);

      case 'totalFailures':
        return totalFailuresAbove(options.threshold || 3);

      case 'avgLatency':
        return avgLatencyAbove(options.threshold || 1000);

      case 'providerLatency':
        if (!options.providerId) {
          throw new Error('providerLatency richiede un providerId');
        }
        return providerLatencyAbove(options.providerId, options.threshold || 1000);

      case 'providerFailed':
        if (!options.providerId) {
          throw new Error('providerFailed richiede un providerId');
        }
        return providerFailedRecently(options.providerId, options.timeWindowMs);

      case 'timeWindow':
        if (options.startHour === undefined || options.endHour === undefined) {
          throw new Error('timeWindow richiede startHour e endHour');
        }
        return duringTimeWindow(options.startHour, options.endHour);

      case 'and':
        if (!options.conditions || options.conditions.length === 0) {
          throw new Error('La condizione AND richiede un array di condizioni');
        }
        return allConditions(options.conditions.map((c) => this.createCondition(c)));

      case 'or':
        if (!options.conditions || options.conditions.length === 0) {
          throw new Error('La condizione OR richiede un array di condizioni');
        }
        return anyCondition(options.conditions.map((c) => this.createCondition(c)));

      case 'not':
        if (!options.condition) {
          throw new Error('La condizione NOT richiede una condizione da negare');
        }
        return notCondition(this.createCondition(options.condition));

      default:
        throw new Error(`Tipo di condizione non supportato: ${options.type}`);
    }
  }

  /**
   * Restituisce l'elenco delle strategie supportate
   */
  static getAvailableStrategies(): string[] {
    return ['preferred', 'roundRobin', 'reliability', 'composite', 'adaptive'];
  }
}
