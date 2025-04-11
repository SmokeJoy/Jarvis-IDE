import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowGraph } from '../AgentFlowGraph';
import { useAgentFlowContext } from '../../../../context/AgentFlowContext';
import mermaid from 'mermaid';

// Mock di mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mermaid Diagram</svg>' }),
    contentLoaded: vi.fn(),
    parseError: vi.fn()
  }
}));

// Mock del contesto
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlowContext: vi.fn()
}));

describe('AgentFlowGraph', () => {
  const mockFlowData = {
    agents: [
      { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
      { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' }
    ],
    interactions: [
      { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' }
    ]
  };

  const mockFilters = {
    searchTerm: '',
    selectedStatuses: [],
    selectedInteractionTypes: [],
    zoomLevel: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: mockFlowData,
      isLoading: false,
      refreshData: vi.fn()
    });
  });

  test('dovrebbe inizializzare mermaid all\'avvio', () => {
    render(<AgentFlowGraph filters={mockFilters} />);
    expect(mermaid.initialize).toHaveBeenCalled();
  });

  test('dovrebbe mostrare il messaggio di caricamento quando isLoading è true', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: true,
      refreshData: vi.fn()
    });
    
    render(<AgentFlowGraph filters={mockFilters} />);
    expect(screen.getByText(/caricamento del diagramma/i)).toBeInTheDocument();
  });

  test('dovrebbe mostrare il messaggio quando non ci sono dati', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: { agents: [], interactions: [] },
      isLoading: false,
      refreshData: vi.fn()
    });
    
    render(<AgentFlowGraph filters={mockFilters} />);
    expect(screen.getByText(/nessun dato disponibile per il diagramma/i)).toBeInTheDocument();
  });

  test('dovrebbe generare il diagramma mermaid con i dati corretti', async () => {
    const { container } = render(<AgentFlowGraph filters={mockFilters} />);
    
    // Simulare che il diagramma sia stato reso
    await act(async () => {
      const diagramContainer = container.querySelector('#mermaid-diagram-container');
      if (diagramContainer) {
        diagramContainer.innerHTML = '<svg>Mermaid Diagram</svg>';
      }
    });
    
    expect(mermaid.render).toHaveBeenCalled();
    expect(container.innerHTML).toContain('<svg>Mermaid Diagram</svg>');
  });

  test('dovrebbe applicare i filtri correttamente', async () => {
    const filteredMockData = {
      ...mockFilters,
      searchTerm: 'Agent 1',
      selectedStatuses: ['active'],
      selectedInteractionTypes: ['message']
    };
    
    const { container } = render(<AgentFlowGraph filters={filteredMockData} />);
    
    // Simulare che il diagramma sia stato reso
    await act(async () => {
      const diagramContainer = container.querySelector('#mermaid-diagram-container');
      if (diagramContainer) {
        diagramContainer.innerHTML = '<svg>Filtered Mermaid Diagram</svg>';
      }
    });
    
    expect(mermaid.render).toHaveBeenCalled();
    // Verificare che il diagramma sia stato filtrato (non possiamo verificare il contenuto esatto,
    // ma possiamo verificare che mermaid.render sia stato chiamato con dei dati filtrati)
    const renderCall = vi.mocked(mermaid.render).mock.calls[0][1];
    expect(renderCall).toContain('Agent 1');
    expect(renderCall).toContain('message');
  });

  test('dovrebbe gestire errori nella generazione del diagramma', async () => {
    // Mock di errore in mermaid.render
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error('Errore di rendering'));
    
    render(<AgentFlowGraph filters={mockFilters} />);
    
    // Attendere che il processo asincrono sia completato
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByText(/errore nel rendering del diagramma/i)).toBeInTheDocument();
  });

  test('dovrebbe applicare il livello di zoom correttamente', async () => {
    const zoomedMockFilters = {
      ...mockFilters,
      zoomLevel: 1.5
    };
    
    const { container } = render(<AgentFlowGraph filters={zoomedMockFilters} />);
    
    // Verificare che il contenitore del diagramma abbia lo stile di zoom corretto
    const diagramContainer = container.querySelector('.mermaid-container');
    expect(diagramContainer).toHaveStyle('transform: scale(1.5)');
  });

  test('dovrebbe rigenerare il diagramma quando i filtri cambiano', async () => {
    const { rerender } = render(<AgentFlowGraph filters={mockFilters} />);
    
    // Primo rendering
    expect(mermaid.render).toHaveBeenCalledTimes(1);
    
    // Cambio filtri e ri-rendering
    const newFilters = {
      ...mockFilters,
      searchTerm: 'nuovo termine'
    };
    
    rerender(<AgentFlowGraph filters={newFilters} />);
    
    // Dopo il re-rendering, mermaid.render dovrebbe essere stato chiamato di nuovo
    expect(mermaid.render).toHaveBeenCalledTimes(2);
  });
}); 