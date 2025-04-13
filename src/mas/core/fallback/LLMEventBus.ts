/**
 * @file LLMEventBus.ts
 * @description Sistema di osservabilità per eventi relativi ai provider LLM
 */

import { EventEmitter } from 'events';
import { LLMEventType, type LLMEventPayload, type LLMEventListener } from '../../types/llm-events';
import type { ProviderStats } from '../../../shared/types/provider-stats';
import type { LLMProviderId } from '../../../types/llm-provider.types';

interface LLMEventMap {
  [LLMEventType.PROVIDER_SUCCESS]: LLMEventListener;
  [LLMEventType.PROVIDER_FAILURE]: LLMEventListener;
  [LLMEventType.PROVIDER_STATS_UPDATED]: LLMEventListener;
  [LLMEventType.PROVIDER_VALIDATION_FAILED]: LLMEventListener;
  [LLMEventType.PROVIDER_COOLDOWN_STARTED]: LLMEventListener;
  [LLMEventType.STRATEGY_ADAPTIVE_CHANGE]: LLMEventListener;
}

/**
 * Event bus for LLM-related events
 */
export class LLMEventBus extends EventEmitter {
  private eventListeners: Map<LLMEventType, Set<LLMEventListener>> = new Map();
  private providerStats: Map<LLMProviderId, ProviderStats> = new Map();

  constructor() {
    super();
    this.on(LLMEventType.PROVIDER_STATS_UPDATED, (payload: LLMEventPayload) => {
      if (payload.data?.stats && 'providerId' in payload.data.stats) {
        this.providerStats.set(payload.providerId, payload.data.stats as ProviderStats);
      }
    });
  }

  /**
   * Register an event listener
   */
  override on<K extends LLMEventType>(eventType: K, listener: LLMEventMap[K]): this {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
    return this;
  }

  /**
   * Remove an event listener
   */
  override off<K extends LLMEventType>(eventType: K, listener: LLMEventMap[K]): this {
    this.eventListeners.get(eventType)?.delete(listener);
    return this;
  }

  /**
   * Emit an event with payload
   */
  override emit(eventType: LLMEventType, payload: LLMEventPayload): boolean {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      return false;
    }

    // Ensure timestamp exists
    if (!payload.timestamp) {
      payload.timestamp = Date.now();
    }

    listeners.forEach((listener) => listener(payload));
    return true;
  }

  /**
   * Get the number of listeners for an event type
   */
  override listenerCount(eventType: LLMEventType): number {
    return this.eventListeners.get(eventType)?.size ?? 0;
  }

  /**
   * Remove all listeners for an event type
   */
  override removeAllListeners(eventType?: LLMEventType): this {
    if (eventType) {
      this.eventListeners.delete(eventType);
    } else {
      this.eventListeners.clear();
    }
    return this;
  }

  /**
   * Get stats for a provider
   */
  getProviderStats(providerId: LLMProviderId): ProviderStats | undefined {
    return this.providerStats.get(providerId);
  }
}
