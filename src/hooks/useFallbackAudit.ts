import { useState, useEffect, useCallback } from 'react';
import type { LLMProviderHandler } from '../providers/provider-registry-stub';
import type { LLMEventBus } from '../mas/core/fallback/LLMEventBus';
import type { ProviderStats } from '../mas/core/fallback/LLMFallbackManager';
import type { FallbackStrategy } from '../mas/core/fallback/strategies/FallbackStrategy';

interface AuditEvent {
  type: string;
  timestamp: number;
  payload: any;
  metadata: {
    strategy: string;
    provider?: string;
    conditions?: Array<{
      name: string;
      isActive: boolean;
    }>;
  };
}

interface AuditSnapshot {
  timestamp: number;
  strategy: string;
  provider: string | null;
  stats: Map<string, ProviderStats>;
  conditions: Array<{
    name: string;
    isActive: boolean;
  }>;
}

interface UseFallbackAuditOptions {
  eventBus: LLMEventBus;
  strategy: FallbackStrategy;
  providers: LLMProviderHandler[];
  maxEvents?: number;
  snapshotInterval?: number;
  onAuditEvent?: (event: AuditEvent) => void;
  onSnapshot?: (snapshot: AuditSnapshot) => void;
}

export function useFallbackAudit({
  eventBus,
  strategy,
  providers,
  maxEvents = 1000,
  snapshotInterval = 60000, // 1 minuto
  onAuditEvent,
  onSnapshot
}: UseFallbackAuditOptions) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [snapshots, setSnapshots] = useState<AuditSnapshot[]>([]);

  // Gestisce gli eventi di cambio strategia
  const handleStrategyChange = useCallback((payload: any) => {
    const event: AuditEvent = {
      type: 'strategy:adaptive:change',
      timestamp: Date.now(),
      payload,
      metadata: {
        strategy: payload.toStrategy,
        provider: payload.providerId
      }
    };

    setEvents(prev => [event, ...prev.slice(0, maxEvents - 1)]);
    onAuditEvent?.(event);
  }, [maxEvents, onAuditEvent]);

  // Gestisce gli eventi dei provider
  const handleProviderEvent = useCallback((type: string, payload: any) => {
    const event: AuditEvent = {
      type,
      timestamp: Date.now(),
      payload,
      metadata: {
        strategy: strategy.getCurrentStrategyName?.(providers) || 'unknown',
        provider: payload.providerId
      }
    };

    setEvents(prev => [event, ...prev.slice(0, maxEvents - 1)]);
    onAuditEvent?.(event);
  }, [strategy, providers, onAuditEvent]);

  // Crea uno snapshot dello stato corrente
  const createSnapshot = useCallback(() => {
    const snapshot: AuditSnapshot = {
      timestamp: Date.now(),
      strategy: strategy.getCurrentStrategyName?.(providers) || 'unknown',
      provider: strategy.selectProvider(providers, new Map())?.id || null,
      stats: new Map(), // TODO: Implementare raccolta stats
      conditions: 'getActiveConditions' in strategy 
        ? strategy.getActiveConditions?.(new Map()) || []
        : []
    };

    setSnapshots(prev => [snapshot, ...prev.slice(0, maxEvents - 1)]);
    onSnapshot?.(snapshot);
  }, [strategy, providers, maxEvents, onSnapshot]);

  // Setup degli event listeners
  useEffect(() => {
    const strategyChangeListener = (payload: any) => handleStrategyChange(payload);
    const successListener = (payload: any) => handleProviderEvent('provider:success', payload);
    const failureListener = (payload: any) => handleProviderEvent('provider:failure', payload);

    eventBus.on('strategy:adaptive:change', strategyChangeListener);
    eventBus.on('provider:success', successListener);
    eventBus.on('provider:failure', failureListener);

    // Snapshot periodico
    const interval = setInterval(createSnapshot, snapshotInterval);

    return () => {
      eventBus.off('strategy:adaptive:change', strategyChangeListener);
      eventBus.off('provider:success', successListener);
      eventBus.off('provider:failure', failureListener);
      clearInterval(interval);
    };
  }, [eventBus, handleStrategyChange, handleProviderEvent, createSnapshot, snapshotInterval]);

  // Funzioni di esportazione
  const exportEvents = useCallback((format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }
    // TODO: Implementare export CSV
    return '';
  }, [events]);

  const exportSnapshots = useCallback((format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      return JSON.stringify(snapshots, null, 2);
    }
    // TODO: Implementare export CSV
    return '';
  }, [snapshots]);

  return {
    events,
    snapshots,
    exportEvents,
    exportSnapshots,
    createSnapshot
  };
} 