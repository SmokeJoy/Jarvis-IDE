import { useEffect, useState } from "react";
import { MASEvent } from '@core/messages/events';

export type TypingState = Record<string, Record<string, boolean>>;

export function useAgentTypingState(agentEventBus: any) {
  const [agentTypingState, setAgentTypingState] = useState<TypingState>({});

  useEffect(() => {
    const dispatchMASContextApply = (agentId: string, threadId: string) => {
      if (!agentId) return; // Non dispatchare se agentId è falsy
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent(MASEvent.CONTEXT_APPLY, { detail: { agentId, threadId } });
        window.dispatchEvent(event);
      }
    };

    const unsubscribeTyping = agentEventBus.on('AGENT_TYPING', (event: any) => {
      setAgentTypingState(prev => {
        const threadKey = event.threadId;
        const agentKey = event.agentId;
        // Dispatch evento ogni cambio typing attivo
        dispatchMASContextApply(agentKey, threadKey);
        return {
          ...prev,
          [threadKey]: {
            ...(prev[threadKey] || {}),
            [agentKey]: true
          }
        };
      });
    });
    const unsubscribeTypingDone = agentEventBus.on('AGENT_TYPING_DONE', (event: any) => {
      setAgentTypingState(prev => {
        const threadKey = event.threadId;
        const agentKey = event.agentId;
        // Dispatch evento anche su typing done
        dispatchMASContextApply(agentKey, threadKey);
        return {
          ...prev,
          [threadKey]: {
            ...(prev[threadKey] || {}),
            [agentKey]: false
          }
        };
      });
    });
    return () => {
      unsubscribeTyping();
      unsubscribeTypingDone();
    };
  }, [agentEventBus]);

  return agentTypingState;
}