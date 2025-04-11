import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowSummary } from '../AgentFlowSummary';
import { useAgentFlowContext } from '../../../../context/AgentFlowContext';

// Mock del contesto
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlowContext: vi.fn()
}));

describe('AgentFlowSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dovrebbe mostrare un messaggio di caricamento quando isLoading è true', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: true,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  test('dovrebbe mostrare un messaggio quando non ci sono dati disponibili', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    expect(screen.getByText(/nessun dato disponibile/i)).toBeInTheDocument();
  });

  test('dovrebbe mostrare il numero corretto di agenti e interazioni', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' },
          { id: 'a3', name: 'Agent 3', status: 'error', type: 'analyzer' }
        ],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' },
          { id: 'i2', sourceId: 'a2', targetId: 'a3', type: 'request', content: 'Analyze this' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    // Utilizziamo una funzione per verificare i label con i due punti
    const agentiLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Totale Agenti:';
    });
    expect(agentiLabel).toBeInTheDocument();
    
    const totalAgentiValue = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 
             element?.className === 'agentflowdebugger-summary-value' && 
             content === '3';
    });
    expect(totalAgentiValue).toBeInTheDocument();
    
    const interazioniLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Totale Interazioni:';
    });
    expect(interazioniLabel).toBeInTheDocument();
    
    const totalInterazioniValue = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 
             element?.className === 'agentflowdebugger-summary-value' && 
             content === '2';
    });
    expect(totalInterazioniValue).toBeInTheDocument();
  });

  test('dovrebbe mostrare il numero corretto di agenti per stato', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [
          { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
          { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' },
          { id: 'a3', name: 'Agent 3', status: 'error', type: 'analyzer' },
          { id: 'a4', name: 'Agent 4', status: 'active', type: 'summarizer' }
        ],
        interactions: []
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    // Verifichiamo che ci siano gli elementi UI con matcher personalizzati
    const attiviLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Attivi:';
    });
    expect(attiviLabel).toBeInTheDocument();
    
    const attiviValue = screen.getByText((content, element) => {
      return element?.previousSibling?.textContent === 'Attivi:' && content === '2';
    });
    expect(attiviValue).toBeInTheDocument();
    
    const completatiLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Completati:';
    });
    expect(completatiLabel).toBeInTheDocument();
    
    const errorLabel = screen.getByText((content, element) => {
      return element?.textContent === 'In errore:';
    });
    expect(errorLabel).toBeInTheDocument();
  });

  test('dovrebbe mostrare il numero corretto di interazioni per tipo', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [],
        interactions: [
          { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' },
          { id: 'i2', sourceId: 'a2', targetId: 'a3', type: 'request', content: 'Analyze this' },
          { id: 'i3', sourceId: 'a3', targetId: 'a1', type: 'response', content: 'Result' },
          { id: 'i4', sourceId: 'a1', targetId: 'a4', type: 'message', content: 'Another message' }
        ]
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    // Verifichiamo che ci siano gli elementi UI con matcher personalizzati
    const messaggiLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Messaggi:';
    });
    expect(messaggiLabel).toBeInTheDocument();
    
    const richiesteLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Richieste:';
    });
    expect(richiesteLabel).toBeInTheDocument();
    
    const risposteLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Risposte:';
    });
    expect(risposteLabel).toBeInTheDocument();
  });

  test('dovrebbe mostrare il tempo di esecuzione quando disponibile', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [],
        interactions: [],
        executionTime: 1500 // 1.5 secondi
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    const tempoLabel = screen.getByText((content, element) => {
      return element?.textContent === 'Tempo di esecuzione:';
    });
    expect(tempoLabel).toBeInTheDocument();
    
    // Verifichiamo che il valore sia presente nel DOM
    const executionTimeValue = screen.getByText((content, element) => {
      return element?.className === 'agentflowdebugger-summary-value' && 
             element?.textContent.includes('1.5');
    });
    expect(executionTimeValue).toBeInTheDocument();
  });

  test('dovrebbe nascondere il tempo di esecuzione quando non disponibile', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: {
        agents: [],
        interactions: []
        // executionTime non definito
      },
      isLoading: false,
      refreshData: vi.fn()
    });

    render(<AgentFlowSummary />);
    
    expect(screen.queryByText(/tempo di esecuzione/i)).not.toBeInTheDocument();
  });
}); 