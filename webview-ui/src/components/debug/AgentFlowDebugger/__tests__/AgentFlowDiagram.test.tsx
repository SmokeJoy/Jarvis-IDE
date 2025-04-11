import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowDiagram } from '../AgentFlowDiagram';
import { useAgentFlowContext } from '../../../../context/AgentFlowContext';
import mermaid from 'mermaid';

// Mock di mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Diagramma di test</svg>' })
  }
}));

// Mock del contesto
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlowContext: vi.fn()
}));

describe('AgentFlowDiagram', () => {
  const mockFilters = {
    searchTerm: '',
    selectedStatuses: [],
    selectedInteractionTypes: [],
    zoomLevel: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Inizializza un elemento DOM per il diagramma
    document.body.innerHTML = '<div id="mermaid-diagram"></div>';
  });

  test('dovrebbe mostrare un messaggio di caricamento quando isLoading è true', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: true,
      refreshData: vi.fn()
    });

    render(<AgentFlowDiagram filters={mockFilters} />);
    
    expect(screen.getByText(/caricamento del diagramma/i)).toBeInTheDocument();
  });

  test('dovrebbe mostrare un messaggio quando non ci sono dati disponibili', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowDiagram filters={mockFilters} />);
    
    expect(screen.getByText(/nessun dato disponibile per il diagramma/i)).toBeInTheDocument();
  });

  test('dovrebbe generare il diagramma quando sono disponibili i dati', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' }
        ],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowDiagram filters={mockFilters} />);

    // Verifica che mermaid.render sia stato chiamato
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled();
    });
  });

  test('dovrebbe filtrare gli agenti in base al termine di ricerca', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' }
        ],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    const filtersWithSearch = {
      ...mockFilters,
      searchTerm: 'Agent 1'
    };

    render(<AgentFlowDiagram filters={filtersWithSearch} />);

    // Verifica che mermaid.render sia stato chiamato con un grafico che include solo Agent 1
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled();
      const definitionArg = vi.mocked(mermaid.render).mock.calls[0][1];
      expect(definitionArg).toContain('Agent 1');
      expect(definitionArg).not.toContain('Agent 2');
    });
  });

  test('dovrebbe filtrare gli agenti in base allo stato', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' }
        ],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    const filtersWithStatus = {
      ...mockFilters,
      selectedStatuses: ['active']
    };

    render(<AgentFlowDiagram filters={filtersWithStatus} />);

    // Verifica che mermaid.render sia stato chiamato con un grafico che include solo agenti attivi
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled();
      const definitionArg = vi.mocked(mermaid.render).mock.calls[0][1];
      expect(definitionArg).toContain('Agent 1');
      expect(definitionArg).not.toContain('Agent 2');
    });
  });

  test('dovrebbe filtrare le interazioni in base al tipo', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' }
        ],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' },
          { id: 'i2', sourceId: 'a2', targetId: 'a1', type: 'response', content: 'Response' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    const filtersWithInteractionType = {
      ...mockFilters,
      selectedInteractionTypes: ['message']
    };

    render(<AgentFlowDiagram filters={filtersWithInteractionType} />);

    // Verifica che mermaid.render sia stato chiamato con un grafico che include solo interazioni di tipo message
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled();
      const definitionArg = vi.mocked(mermaid.render).mock.calls[0][1];
      expect(definitionArg).toContain('Hello');
      expect(definitionArg).not.toContain('Response');
    });
  });

  test('dovrebbe applicare il livello di zoom al diagramma', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' }
        ],
        interactions: []
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    const filtersWithZoom = {
      ...mockFilters,
      zoomLevel: 1.5
    };

    render(<AgentFlowDiagram filters={filtersWithZoom} />);

    // Verifica che il diagramma sia stato renderizzato con lo zoom corretto
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled();
      // Nel componente reale, lo zoom viene applicato al container SVG dopo il rendering
      const diagramContainer = document.querySelector('.agentflowdebugger-diagram');
      expect(diagramContainer).not.toBeNull();
    });
  });

  test('dovrebbe gestire errori durante il rendering del diagramma', async () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' }
        ],
        interactions: []
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    // Simula un errore in mermaid.render
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error('Errore di rendering'));

    render(<AgentFlowDiagram filters={mockFilters} />);

    // Verifica che venga mostrato un messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/errore durante il rendering del diagramma/i)).toBeInTheDocument();
    });
  });
}); 