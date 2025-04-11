import { useState, useEffect, useCallback } from 'react';
import type { LLMProviderHandler } from '../providers/provider-registry-stub';
import type { LLMEventBus } from '../mas/core/fallback/LLMEventBus';
import type { ProviderStats } from '../mas/core/fallback/LLMFallbackManager';
import type { FallbackStrategy } from '../mas/core/fallback/strategies/FallbackStrategy';

interface FallbackTelemetryState {
  activeStrategy: string;
  currentProvider: LLMProviderHandler | null;
  recentEvents: Array<{
    type: string;
    timestamp: number;
    payload: any;
  }>;
  activeConditions: Array<{
    name: string;
    isActive: boolean;
  }>;
  providerStats: Map<string, ProviderStats>;
}

interface UseFallbackTelemetryOptions {
  eventBus: LLMEventBus;
  strategy: FallbackStrategy;
  providers: LLMProviderHandler[];
  maxEvents?: number;
  debug?: boolean;
}

export function useFallbackTelemetry({
  eventBus,
  strategy,
  providers,
  maxEvents = 50,
  debug = false
}: UseFallbackTelemetryOptions) {
  const [state, setState] = useState<FallbackTelemetryState>({
    activeStrategy: strategy.getCurrentStrategyName?.(providers) || 'unknown',
    currentProvider: null,
    recentEvents: [],
    activeConditions: [],
    providerStats: new Map()
  });

  // Gestisce gli eventi di cambio strategia
  const handleStrategyChange = useCallback((payload: any) => {
    setState(prev => ({
      ...prev,
      activeStrategy: payload.toStrategy,
      recentEvents: [
        {
          type: 'strategy:adaptive:change',
          timestamp: Date.now(),
          payload
        },
        ...prev.recentEvents.slice(0, maxEvents - 1)
      ]
    }));
  }, [maxEvents]);

  // Gestisce gli eventi di successo/failure dei provider
  const handleProviderEvent = useCallback((type: string, payload: any) => {
    setState(prev => ({
      ...prev,
      recentEvents: [
        {
          type,
          timestamp: Date.now(),
          payload
        },
        ...prev.recentEvents.slice(0, maxEvents - 1)
      ]
    }));
  }, [maxEvents]);

  // Aggiorna lo stato del provider corrente
  const updateCurrentProvider = useCallback(() => {
    const currentProvider = strategy.selectProvider(providers, state.providerStats);
    setState(prev => ({
      ...prev,
      currentProvider
    }));
  }, [strategy, providers, state.providerStats]);

  // Aggiorna le condizioni attive
  const updateActiveConditions = useCallback(() => {
    if ('getActiveConditions' in strategy) {
      const activeConditions = strategy.getActiveConditions?.(state.providerStats) || [];
      setState(prev => ({
        ...prev,
        activeConditions
      }));
    }
  }, [strategy, state.providerStats]);

  // Setup degli event listeners
  useEffect(() => {
    const strategyChangeListener = (payload: any) => handleStrategyChange(payload);
    const successListener = (payload: any) => handleProviderEvent('provider:success', payload);
    const failureListener = (payload: any) => handleProviderEvent('provider:failure', payload);

    eventBus.on('strategy:adaptive:change', strategyChangeListener);
    eventBus.on('provider:success', successListener);
    eventBus.on('provider:failure', failureListener);

    // Aggiornamento periodico dello stato
    const interval = setInterval(() => {
      updateCurrentProvider();
      updateActiveConditions();
    }, 1000);

    return () => {
      eventBus.off('strategy:adaptive:change', strategyChangeListener);
      eventBus.off('provider:success', successListener);
      eventBus.off('provider:failure', failureListener);
      clearInterval(interval);
    };
  }, [eventBus, handleStrategyChange, handleProviderEvent, updateCurrentProvider, updateActiveConditions]);

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('Fallback Telemetry State:', state);
    }
  }, [state, debug]);

  return {
    ...state,
    updateCurrentProvider,
    updateActiveConditions
  };
} 