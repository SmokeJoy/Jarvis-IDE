import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowStats } from '../AgentFlowStats';
import { useAgentFlowContext } from '../../../../context/AgentFlowContext';

// Mock del contesto
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlowContext: vi.fn()
}));

describe('AgentFlowStats', () => {
  const mockFlowData = {
    agents: [
      { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' },
      { id: 'a2', name: 'Agent 2', status: 'completed', type: 'executor' },
      { id: 'a3', name: 'Agent 3', status: 'waiting', type: 'searcher' },
      { id: 'a4', name: 'Agent 4', status: 'error', type: 'analyst' }
    ],
    interactions: [
      { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' },
      { id: 'i2', sourceId: 'a2', targetId: 'a3', type: 'request', content: 'Search this' },
      { id: 'i3', sourceId: 'a3', targetId: 'a2', type: 'response', content: 'Results' },
      { id: 'i4', sourceId: 'a2', targetId: 'a4', type: 'message', content: 'Analyze' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: mockFlowData,
      isLoading: false,
      refreshData: vi.fn()
    });
  });

  test('dovrebbe mostrare il conteggio totale degli agenti', () => {
    render(<AgentFlowStats />);
    expect(screen.getByText(/agenti totali/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('dovrebbe mostrare il conteggio delle interazioni totali', () => {
    render(<AgentFlowStats />);
    expect(screen.getByText(/interazioni totali/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('dovrebbe mostrare il conteggio corretto per ogni stato degli agenti', () => {
    render(<AgentFlowStats />);
    
    // Conteggio per stato
    expect(screen.getByText(/attivi/i)).toBeInTheDocument();
    expect(screen.getByText(/completati/i)).toBeInTheDocument();
    expect(screen.getByText(/in attesa/i)).toBeInTheDocument();
    expect(screen.getByText(/in errore/i)).toBeInTheDocument();
    
    // Verifica i valori
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBe(6); // 4 stati + 2 totali
    
    // Trova la carta con "Attivi" e verifica il valore
    const activeCard = statCards.find(card => card.textContent?.includes('Attivi'));
    expect(activeCard).toHaveTextContent('1');
    
    // Trova la carta con "Completati" e verifica il valore
    const completedCard = statCards.find(card => card.textContent?.includes('Completati'));
    expect(completedCard).toHaveTextContent('1');
    
    // Trova la carta con "In attesa" e verifica il valore
    const waitingCard = statCards.find(card => card.textContent?.includes('In attesa'));
    expect(waitingCard).toHaveTextContent('1');
    
    // Trova la carta con "In errore" e verifica il valore
    const errorCard = statCards.find(card => card.textContent?.includes('In errore'));
    expect(errorCard).toHaveTextContent('1');
  });
  
  test('dovrebbe mostrare il messaggio di caricamento quando isLoading è true', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: { agents: [], interactions: [] },
      isLoading: true,
      refreshData: vi.fn()
    });
    
    render(<AgentFlowStats />);
    expect(screen.getByText(/caricamento delle statistiche/i)).toBeInTheDocument();
  });
  
  test('dovrebbe mostrare correttamente i conteggi per tipo di interazione', () => {
    render(<AgentFlowStats />);
    
    // Verifica che ci siano le categorie di interazione
    expect(screen.getByText(/messaggi/i)).toBeInTheDocument();
    expect(screen.getByText(/richieste/i)).toBeInTheDocument();
    expect(screen.getByText(/risposte/i)).toBeInTheDocument();
    
    // Trova le carte con i conteggi per tipo di interazione
    const messageCard = screen.getAllByTestId('stat-card').find(card => 
      card.textContent?.includes('Messaggi'));
    const requestCard = screen.getAllByTestId('stat-card').find(card => 
      card.textContent?.includes('Richieste'));
    const responseCard = screen.getAllByTestId('stat-card').find(card => 
      card.textContent?.includes('Risposte'));
    
    // Verifica i conteggi
    expect(messageCard).toHaveTextContent('2');
    expect(requestCard).toHaveTextContent('1');
    expect(responseCard).toHaveTextContent('1');
  });
  
  test('dovrebbe mostrare il messaggio quando non ci sono dati', () => {
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: { agents: [], interactions: [] },
      isLoading: false,
      refreshData: vi.fn()
    });
    
    render(<AgentFlowStats />);
    expect(screen.getByText(/nessun dato disponibile/i)).toBeInTheDocument();
  });
  
  test('dovrebbe applicare le classi di stile corrette', () => {
    render(<AgentFlowStats />);
    
    // Verifica che il container principale abbia la classe corretta
    const container = screen.getByTestId('stats-container');
    expect(container).toHaveClass('agentflowdebugger-stats');
    
    // Verifica che le carte statistiche abbiano la classe corretta
    const statCards = screen.getAllByTestId('stat-card');
    statCards.forEach(card => {
      expect(card).toHaveClass('stat-card');
    });
  });
}); 