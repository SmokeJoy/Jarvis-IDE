/**
 * @file llm-events.ts
 * @description Unified type definitions for LLM events and event bus
 */

import { LLMProviderId } from './llm-provider.types';

/**
 * Interfaccia per le statistiche del provider
 */
export interface ProviderStats {
  /** ID del provider */
  providerId: LLMProviderId;
  /** Numero di richieste eseguite con successo */
  successCount: number;
  /** Numero di richieste fallite */
  failureCount: number;
  /** Numero totale di richieste */
  totalRequests: number;
  /** Tempo medio di risposta in ms */
  averageResponseTime: number;
  /** Se il provider è in cooldown */
  isInCooldown: boolean;
  /** Timestamp di fine cooldown */
  cooldownEndTime: number | null;
  /** Ultimo errore registrato */
  lastError: string | null;
  /** Tasso di successo (opzionale) */
  successRate?: number;
  /** Timestamp dell'ultimo utilizzo (opzionale) */
  lastUsed?: number;
}

/**
 * Tipi di eventi supportati dal sistema
 */
export const LLMEventType = {
  PROVIDER_SUCCESS: 'provider:success',
  PROVIDER_FAILURE: 'provider:failure',
  PROVIDER_VALIDATION_FAILED: 'provider:validationFailed',
  PROVIDER_STATS_UPDATED: 'provider:statsUpdated',
  PROVIDER_COOLDOWN_STARTED: 'provider:cooldownStarted',
  PROVIDER_COOLDOWN_ENDED: 'provider:cooldownEnded',
  STRATEGY_ADAPTIVE_CHANGE: 'strategy:adaptive:change',
} as const;

export type LLMEventType = (typeof LLMEventType)[keyof typeof LLMEventType];

/**
 * Struttura standard di payload per gli eventi
 */
export interface LLMEventPayload {
  /** ID del provider coinvolto nell'evento */
  providerId: LLMProviderId;
  /** Timestamp dell'evento in millisecondi */
  timestamp: number;
  /** Dati aggiuntivi specifici dell'evento */
  data?: Record<string, unknown>;
}

/**
 * Payload per eventi di cambio strategia adattiva
 */
export interface AdaptiveStrategyChangePayload extends LLMEventPayload {
  fromStrategy: string;
  toStrategy: string;
  reason: string;
  stats: Map<string, ProviderStats>;
}

/**
 * Funzione di callback per gli eventi
 */
export type LLMEventListener = (payload: LLMEventPayload) => void;
