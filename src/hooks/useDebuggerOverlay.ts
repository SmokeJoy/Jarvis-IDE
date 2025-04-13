import { useState, useEffect } from 'react';
import { LLMEventBus } from '../lib/eventBus';
import { MitigatorOverlayProps } from '../components/MitigatorOverlay';

interface DebuggerState {
  current: MitigatorOverlayProps | null;
  history: MitigatorOverlayProps[];
}

// Interfacce per i tipi di eventi
interface StrategyChangeEvent {
  reason: string;
  strategyName: string;
  selectedProvider: string;
  candidates?: string[];
  conditions?: Array<{ name: string; isActive: boolean }>;
}

interface ProviderFailureEvent {
  providerId: string;
  reason: string;
  strategyName: string;
  newProvider: string;
  candidates?: string[];
  conditions?: Array<{ name: string; isActive: boolean }>;
}

interface ProviderSuccessEvent {
  providerId: string;
  strategyName: string;
  candidates?: string[];
  conditions?: Array<{ name: string; isActive: boolean }>;
}

export function useDebuggerOverlay(eventBus: LLMEventBus): DebuggerState {
  const [state, setState] = useState<DebuggerState>({
    current: null,
    history: [],
  });

  useEffect(() => {
    const handleStrategyChange = (event: StrategyChangeEvent) => {
      const newState: MitigatorOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: event.reason || 'Strategy changed',
        strategyName: event.strategyName,
        selectedProvider: event.selectedProvider,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || [],
      };

      setState((prev) => ({
        current: newState,
        history: [...prev.history, newState],
      }));
    };

    const handleProviderFailure = (event: ProviderFailureEvent) => {
      const newState: MitigatorOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: `Provider ${event.providerId} failed: ${event.reason}`,
        strategyName: event.strategyName,
        selectedProvider: event.newProvider,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || [],
      };

      setState((prev) => ({
        current: newState,
        history: [...prev.history, newState],
      }));
    };

    const handleProviderSuccess = (event: ProviderSuccessEvent) => {
      const newState: MitigatorOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: 'Provider restored',
        strategyName: event.strategyName,
        selectedProvider: event.providerId,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || [],
      };

      setState((prev) => ({
        current: newState,
        history: [...prev.history, newState],
      }));
    };

    eventBus.on('strategy:adaptive:change', handleStrategyChange);
    eventBus.on('provider:failure', handleProviderFailure);
    eventBus.on('provider:success', handleProviderSuccess);

    return () => {
      eventBus.off('strategy:adaptive:change', handleStrategyChange);
      eventBus.off('provider:failure', handleProviderFailure);
      eventBus.off('provider:success', handleProviderSuccess);
    };
  }, [eventBus]);

  return state;
}
