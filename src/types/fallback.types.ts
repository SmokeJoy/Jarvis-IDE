/**
 * @file fallback.types.ts
 * @description Definizioni per il sistema di fallback
 */

export type LLMEventType =
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_SUCCESS'
  | 'FALLBACK_TRIGGERED'
  | 'FALLBACK_SUCCESS'
  | 'FALLBACK_FAILED';

export interface LLMEventPayload {
  providerId: string;
  eventType: LLMEventType;
  timestamp: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface ProviderStats {
  providerId: string;
  successCount: number;
  errorCount: number;
  lastError?: Error;
  lastSuccess?: number;
  isAvailable: boolean;
  cooldownUntil?: number;
}

export interface FallbackStrategy {
  name: string;
  shouldTrigger(stats: ProviderStats): boolean;
  getNextProvider(currentProvider: string, stats: ProviderStats[]): string;
}
