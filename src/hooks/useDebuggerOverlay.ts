import { useState, useEffect } from 'react';
import { LLMEventBus } from '../lib/eventBus';
import { AIDebuggerOverlayProps } from '../components/AIDebuggerOverlay';

interface DebuggerState {
  current: AIDebuggerOverlayProps | null;
  history: AIDebuggerOverlayProps[];
}

export function useDebuggerOverlay(eventBus: LLMEventBus): DebuggerState {
  const [state, setState] = useState<DebuggerState>({
    current: null,
    history: []
  });

  useEffect(() => {
    const handleStrategyChange = (event: any) => {
      const newState: AIDebuggerOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: event.reason || 'Strategy changed',
        strategyName: event.strategyName,
        selectedProvider: event.selectedProvider,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || []
      };

      setState(prev => ({
        current: newState,
        history: [...prev.history, newState]
      }));
    };

    const handleProviderFailure = (event: any) => {
      const newState: AIDebuggerOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: `Provider ${event.providerId} failed: ${event.reason}`,
        strategyName: event.strategyName,
        selectedProvider: event.newProvider,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || []
      };

      setState(prev => ({
        current: newState,
        history: [...prev.history, newState]
      }));
    };

    const handleProviderSuccess = (event: any) => {
      const newState: AIDebuggerOverlayProps = {
        timestamp: Date.now(),
        fallbackReason: 'Provider restored',
        strategyName: event.strategyName,
        selectedProvider: event.providerId,
        providerCandidates: event.candidates || [],
        activeConditions: event.conditions || []
      };

      setState(prev => ({
        current: newState,
        history: [...prev.history, newState]
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