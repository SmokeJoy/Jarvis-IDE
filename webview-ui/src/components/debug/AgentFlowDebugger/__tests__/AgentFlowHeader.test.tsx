import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentFlowHeader from '../AgentFlowHeader';
import * as AgentFlowContext from '../../../../context/AgentFlowContext';

describe('AgentFlowHeader Component', () => {
  const refreshDataMock = vi.fn();
  
  beforeEach(() => {
    vi.spyOn(AgentFlowContext, 'useAgentFlowContext').mockImplementation(() => ({
      flowData: {
        agents: [
          { id: 'agent-1', name: 'Agent 1', type: 'planner', status: 'active' }
        ],
        interactions: [
          { id: 'int-1', sourceId: 'agent-1', targetId: 'system', type: 'request', label: 'Request', timestamp: '2023-01-01T00:00:00Z' }
        ]
      },
      loading: false,
      error: null,
      fetchFlowData: vi.fn(),
      refreshData: refreshDataMock
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('dovrebbe renderizzare il titolo corretto', () => {
    render(<AgentFlowHeader />);
    
    expect(screen.getByText('Debugger Flusso Agenti')).toBeInTheDocument();
  });

  test('dovrebbe mostrare un indicatore di caricamento quando loading è true', () => {
    vi.spyOn(AgentFlowContext, 'useAgentFlowContext').mockImplementation(() => ({
      flowData: null,
      loading: true,
      error: null,
      fetchFlowData: vi.fn(),
      refreshData: refreshDataMock
    }));
    
    render(<AgentFlowHeader />);
    
    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
  });

  test('dovrebbe mostrare un messaggio di errore quando c\'è un errore', () => {
    const errorMessage = 'Errore nel caricamento dei dati';
    
    vi.spyOn(AgentFlowContext, 'useAgentFlowContext').mockImplementation(() => ({
      flowData: null,
      loading: false,
      error: new Error(errorMessage),
      fetchFlowData: vi.fn(),
      refreshData: refreshDataMock
    }));
    
    render(<AgentFlowHeader />);
    
    expect(screen.getByText(`Errore: ${errorMessage}`)).toBeInTheDocument();
  });

  test('dovrebbe chiamare refreshData quando si clicca sul pulsante di aggiornamento', () => {
    render(<AgentFlowHeader />);
    
    fireEvent.click(screen.getByRole('button', { name: /aggiorna/i }));
    
    expect(refreshDataMock).toHaveBeenCalledTimes(1);
  });

  test('dovrebbe mostrare la data dell\'ultimo aggiornamento quando disponibile', () => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }).format(now);
    
    vi.spyOn(AgentFlowContext, 'useAgentFlowContext').mockImplementation(() => ({
      flowData: {
        agents: [
          { id: 'agent-1', name: 'Agent 1', type: 'planner', status: 'active' }
        ],
        interactions: [
          { id: 'int-1', sourceId: 'agent-1', targetId: 'system', type: 'request', label: 'Request', timestamp: '2023-01-01T00:00:00Z' }
        ],
        lastUpdated: now.toISOString()
      },
      loading: false,
      error: null,
      fetchFlowData: vi.fn(),
      refreshData: refreshDataMock
    }));
    
    render(<AgentFlowHeader />);
    
    expect(screen.getByText(`Ultimo aggiornamento: ${formattedDate}`)).toBeInTheDocument();
  });
}); 