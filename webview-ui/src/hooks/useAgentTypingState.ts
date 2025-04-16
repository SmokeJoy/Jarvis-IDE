import { useEffect, useState } from "react";

export type TypingState = Record<string, Record<string, boolean>>;

export function useAgentTypingState(agentEventBus: any) {
  const [agentTypingState, setAgentTypingState] = useState<TypingState>({});

  useEffect(() => {
    const unsubscribeTyping = agentEventBus.on('AGENT_TYPING', (event: any) => {
      setAgentTypingState(prev => {
        const threadKey = event.threadId;
        const agentKey = event.agentId;
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