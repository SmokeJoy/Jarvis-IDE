import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentFlowDebugger } from './AgentFlowDebugger';
import { AgentEventBus } from '@shared/types/agent-messages.guard';

describe('AgentFlowDebugger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe visualizzare lo stato di un agent completato', () => {
    render(<AgentFlowDebugger />);
    
    AgentEventBus.emit('INSTRUCTION_COMPLETED', {
      agentId: 'agent1',
      payload: { output: 'Task completato' }
    });

    expect(screen.getByText('agent1')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
    expect(screen.getByText('Task completato')).toBeInTheDocument();
  });

  it('dovrebbe mostrare lo stato di errore', () => {
    render(<AgentFlowDebugger />);
    
    AgentEventBus.emit('FAILED', {
      agentId: 'agent2',
      payload: { error: 'Errore runtime' }
    });

    expect(screen.getByText('agent2')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('dovrebbe aggiornare lo stato da running a done', async () => {
    const { rerender } = render(<AgentFlowDebugger />);
    
    AgentEventBus.emit('AGENT_MEMORY_RESPONSE', {
      agentId: 'agent3',
      status: 'running'
    });

    rerender(<AgentFlowDebugger />);
    
    AgentEventBus.emit('INSTRUCTION_COMPLETED', {
      agentId: 'agent3',
      payload: { output: 'Memoria aggiornata' }
    });

    expect(screen.getByText('agent3')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });
});