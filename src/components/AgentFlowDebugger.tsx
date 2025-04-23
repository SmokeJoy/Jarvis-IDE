import React, { useEffect, useReducer } from 'react';
import { VSCodeProgressRing, VSCodeBadge } from '@vscode/webview-ui-toolkit/react';
import { AgentEventBus, MASInstructionEvent } from '@shared/types/agent-messages.guard';

type AgentState = {
  agentId: string;
  status: 'idle' | 'running' | 'done' | 'error';
  output?: string;
  timestamp: number;
};

const reducer = (state: AgentState[], event: MASInstructionEvent): AgentState[] => {
  const existing = state.find(s => s.agentId === event.agentId);
  const newState = {
    agentId: event.agentId,
    status: event.type === 'INSTRUCTION_COMPLETED' ? 'done' : 
      event.type === 'FAILED' ? 'error' : 'running',
    output: (msg.payload as unknown)?.output,
    timestamp: Date.now()
  };
  
  return existing 
    ? state.map(s => s.agentId === event.agentId ? newState : s) 
    : [...state, newState];
};

export const AgentFlowDebugger: React.FC = () => {
  const [agentStates, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    const unsubscribe = AgentEventBus.on('INSTRUCTION_COMPLETED', (event) => {
      dispatch(event);
    });
    AgentEventBus.on('FAILED', dispatch);
    AgentEventBus.on('AGENT_MEMORY_RESPONSE', dispatch);

    return () => {
      unsubscribe();
      AgentEventBus.off('FAILED', dispatch);
      AgentEventBus.off('AGENT_MEMORY_RESPONSE', dispatch);
    };
  }, []);

  return (
    <div className="mas-flow-debugger" role="log" aria-live="polite">
      {agentStates.map((state) => (
        <div key={state.agentId} className="mas-flow-item">
          <div className="mas-flow-header">
            <VSCodeBadge appearance={state.status === 'done' ? 'success' : 
              state.status === 'error' ? 'warning' : 'secondary'}>
              {state.agentId}
            </VSCodeBadge>
            <span className="mas-status">
              {state.status === 'running' && <VSCodeProgressRing aria-label="In esecuzione" />}
              {state.status.toUpperCase()}
            </span>
          </div>
          {state.output && 
            <div className="mas-output" aria-live="off">
              {state.output}
            </div>}
        </div>
      ))}
    </div>
  );
};