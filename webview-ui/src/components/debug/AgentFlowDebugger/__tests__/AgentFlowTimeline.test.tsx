import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentFlowTimeline from '../AgentFlowTimeline';
import { useAgentFlow } from '../../../../context/AgentFlowContext';

// Mock del contesto AgentFlowContext
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlow: vi.fn()
}));

describe('AgentFlowTimeline Component', () => {
  const mockFilters = {
    search: '',
    status: [],
    interactionType: [],
    timeRange: null,
    zoom: 100
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dovrebbe mostrare un indicatore di caricamento quando loading=true', () => {
    // Setup del mock
    (useAgentFlow as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      flowData: null,
      loading: true
    });

    render(<AgentFlowTimeline filters={mockFilters} />);
    
    expect(screen.getByText('Caricamento cronologia...')).toBeInTheDocument();
  });

  test('dovrebbe mostrare un messaggio quando non ci sono interazioni', () => {
    // Setup del mock con dati ma senza interazioni
    (useAgentFlow as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      flowData: {
        agents: [],
        interactions: []
      },
      loading: false
    });

    render(<AgentFlowTimeline filters={mockFilters} />);
    
    expect(screen.getByText(/Nessuna interazione disponibile/)).toBeInTheDocument();
  });

  test('dovrebbe renderizzare le interazioni quando ci sono dati', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Setup del mock con dati completi
    (useAgentFlow as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      flowData: {
        agents: [
          { id: 'agent-1', name: 'Agent 1', type: 'planner', status: 'active' },
          { id: 'agent-2', name: 'Agent 2', type: 'searcher', status: 'waiting' }
        ],
        interactions: [
          { 
            id: 'int-1', 
            sourceId: 'agent-1', 
            targetId: 'agent-2', 
            type: 'request', 
            label: 'Request Message', 
            content: 'Test content',
            timestamp: fiveMinutesAgo.toISOString() 
          }
        ]
      },
      loading: false
    });

    render(<AgentFlowTimeline filters={mockFilters} />);
    
    // Verifica che la timeline contenga l'intestazione
    expect(screen.getByText('Cronologia')).toBeInTheDocument();
    
    // Verifica che vengano mostrati i nomi degli agenti
    expect(screen.getByText(/Agent 1/)).toBeInTheDocument();
    expect(screen.getByText(/Agent 2/)).toBeInTheDocument();
    
    // Verifica che il tipo di interazione sia mostrato
    expect(screen.getByText('request')).toBeInTheDocument();
    
    // Verifica che l'etichetta e il contenuto siano mostrati
    expect(screen.getByText('Request Message')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('dovrebbe filtrare le interazioni in base ai filtri', () => {
    // Setup del mock con dati
    (useAgentFlow as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      flowData: {
        agents: [
          { id: 'agent-1', name: 'Agent 1', type: 'planner', status: 'active' },
          { id: 'agent-2', name: 'Agent 2', type: 'searcher', status: 'waiting' },
          { id: 'agent-3', name: 'Agent 3', type: 'executor', status: 'completed' }
        ],
        interactions: [
          { id: 'int-1', sourceId: 'agent-1', targetId: 'agent-2', type: 'request', label: 'Request 1', timestamp: '2025-04-10T10:00:00Z' },
          { id: 'int-2', sourceId: 'agent-2', targetId: 'agent-1', type: 'response', label: 'Response 1', timestamp: '2025-04-10T10:01:00Z' },
          { id: 'int-3', sourceId: 'agent-1', targetId: 'agent-3', type: 'request', label: 'Request 2', timestamp: '2025-04-10T10:02:00Z' }
        ]
      },
      loading: false
    });

    // Applica un filtro per tipo di interazione
    const filteredFilters = { 
      ...mockFilters, 
      interactionType: ['request'] 
    };
    
    render(<AgentFlowTimeline filters={filteredFilters} />);
    
    // Dovrebbe mostrare solo "Request 1" e "Request 2", non "Response 1"
    expect(screen.getByText('Request 1')).toBeInTheDocument();
    expect(screen.getByText('Request 2')).toBeInTheDocument();
    expect(screen.queryByText('Response 1')).not.toBeInTheDocument();
  });

  test('dovrebbe calcolare e mostrare i tempi relativi tra le interazioni', () => {
    const baseTime = new Date('2025-04-10T10:00:00Z').getTime();
    
    // Setup del mock con due interazioni con timestamp in sequenza
    (useAgentFlow as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      flowData: {
        agents: [
          { id: 'agent-1', name: 'Agent 1', status: 'active' },
          { id: 'agent-2', name: 'Agent 2', status: 'waiting' }
        ],
        interactions: [
          { id: 'int-1', sourceId: 'agent-1', targetId: 'agent-2', type: 'request', label: 'First', timestamp: new Date(baseTime).toISOString() },
          { id: 'int-2', sourceId: 'agent-2', targetId: 'agent-1', type: 'response', label: 'Second', timestamp: new Date(baseTime + 30000).toISOString() }
        ]
      },
      loading: false
    });

    render(<AgentFlowTimeline filters={mockFilters} />);
    
    // Verifica che venga mostrato il tempo relativo (30 secondi)
    expect(screen.getByText(/\+30s/)).toBeInTheDocument();
  });
}); 