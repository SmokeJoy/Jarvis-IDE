import { useState, useMemo } from 'react';
import { MitigatorOverlayProps } from '../components/MitigatorOverlay';

export type EventType =
  | 'all'
  | 'provider:failure'
  | 'strategy:adaptive:change'
  | 'provider:success';
export type ProviderFilter = 'all' | string;

interface FilterOptions {
  eventType: EventType;
  provider: ProviderFilter;
  strategy: string;
}

export function useFilteredHistory(history: MitigatorOverlayProps[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    eventType: 'all',
    provider: 'all',
    strategy: 'all',
  });

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesEventType =
        filters.eventType === 'all' ||
        (filters.eventType === 'provider:failure' && entry.fallbackReason.includes('failed')) ||
        (filters.eventType === 'strategy:adaptive:change' &&
          entry.fallbackReason.includes('strategy')) ||
        (filters.eventType === 'provider:success' && entry.fallbackReason.includes('restored'));

      const matchesProvider =
        filters.provider === 'all' ||
        entry.selectedProvider === filters.provider ||
        entry.providerCandidates.some((p) => p.id === filters.provider);

      const matchesStrategy = filters.strategy === 'all' || entry.strategyName === filters.strategy;

      return matchesEventType && matchesProvider && matchesStrategy;
    });
  }, [history, filters]);

  const availableProviders = useMemo(() => {
    const providers = new Set<string>();
    history.forEach((entry) => {
      providers.add(entry.selectedProvider);
      entry.providerCandidates.forEach((p) => providers.add(p.id));
    });
    return Array.from(providers);
  }, [history]);

  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    history.forEach((entry) => strategies.add(entry.strategyName));
    return Array.from(strategies);
  }, [history]);

  return {
    filteredHistory,
    filters,
    setFilters,
    availableProviders,
    availableStrategies,
  };
}
