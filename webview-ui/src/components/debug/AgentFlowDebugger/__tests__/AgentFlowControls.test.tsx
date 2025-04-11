import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowControls } from '../AgentFlowControls';
import { useAgentFlowContext } from '../../../../context/AgentFlowContext';

// Mock del contesto AgentFlow
vi.mock('../../../../context/AgentFlowContext', () => ({
  useAgentFlowContext: vi.fn()
}));

describe('AgentFlowControls', () => {
  // Prepariamo un mock per la funzione onFilterChange
  const mockOnFilterChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuriamo il mock del contesto
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
  });

  test('dovrebbe renderizzare tutti i controlli', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Verifica che la barra di ricerca sia presente
    expect(screen.getByPlaceholderText(/cerca agenti/i)).toBeInTheDocument();
    
    // Verifica che il pulsante di aggiornamento sia presente
    expect(screen.getByRole('button', { name: /aggiorna/i })).toBeInTheDocument();
    
    // Verifica che le opzioni di filtro per stato siano presenti
    expect(screen.getByText(/filtra per stato/i)).toBeInTheDocument();
    
    // Verifica che le opzioni di filtro per tipo di interazione siano presenti
    expect(screen.getByText(/filtra per tipo di interazione/i)).toBeInTheDocument();
    
    // Verifica che il controllo dello zoom sia presente
    expect(screen.getByText(/zoom/i)).toBeInTheDocument();
  });

  test('dovrebbe chiamare refreshData quando si clicca sul pulsante di aggiornamento', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    fireEvent.click(refreshButton);
    
    const refreshData = vi.mocked(useAgentFlowContext).mock.results[0].value.refreshData;
    expect(refreshData).toHaveBeenCalledTimes(1);
  });

  test('dovrebbe aggiornare il filtro di ricerca quando si digita nella barra di ricerca', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    const searchInput = screen.getByPlaceholderText(/cerca agenti/i);
    fireEvent.change(searchInput, { target: { value: 'Agent 1' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      searchTerm: 'Agent 1'
    }));
  });

  test('dovrebbe aggiornare i filtri di stato quando si selezionano le checkbox', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Trova tutte le checkbox per lo stato
    const statusCheckboxes = screen.getAllByRole('checkbox', { name: /active|completed|error|waiting/i });
    
    // Simula la selezione della prima checkbox (ad esempio "active")
    fireEvent.click(statusCheckboxes[0]);
    
    // Verifica che onFilterChange sia stato chiamato con lo stato selezionato
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      selectedStatuses: expect.arrayContaining(['active'])
    }));
    
    // Deseleziona la checkbox
    fireEvent.click(statusCheckboxes[0]);
    
    // Verifica che onFilterChange sia stato chiamato con un array vuoto (nessuno stato selezionato)
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      selectedStatuses: []
    }));
  });

  test('dovrebbe aggiornare i filtri di tipo di interazione quando si selezionano le checkbox', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Trova tutte le checkbox per il tipo di interazione
    const interactionTypeCheckboxes = screen.getAllByRole('checkbox', { name: /message|response|command|result/i });
    
    // Simula la selezione della prima checkbox (ad esempio "message")
    fireEvent.click(interactionTypeCheckboxes[0]);
    
    // Verifica che onFilterChange sia stato chiamato con il tipo di interazione selezionato
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      selectedInteractionTypes: expect.arrayContaining(['message'])
    }));
    
    // Deseleziona la checkbox
    fireEvent.click(interactionTypeCheckboxes[0]);
    
    // Verifica che onFilterChange sia stato chiamato con un array vuoto (nessun tipo selezionato)
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      selectedInteractionTypes: []
    }));
  });

  test('dovrebbe aggiornare il livello di zoom quando si muove lo slider', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Trova lo slider per lo zoom
    const zoomSlider = screen.getByRole('slider');
    
    // Simula il cambio del valore dello slider
    fireEvent.change(zoomSlider, { target: { value: '1.5' } });
    
    // Verifica che onFilterChange sia stato chiamato con il nuovo livello di zoom
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      zoomLevel: 1.5
    }));
  });

  test('dovrebbe resettare tutti i filtri quando si clicca su "Reimposta filtri"', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Prima imposta alcuni filtri
    const searchInput = screen.getByPlaceholderText(/cerca agenti/i);
    fireEvent.change(searchInput, { target: { value: 'Agent 1' } });
    
    // Trova il pulsante per resettare i filtri
    const resetButton = screen.getByRole('button', { name: /reimposta filtri/i });
    fireEvent.click(resetButton);
    
    // Verifica che onFilterChange sia stato chiamato con tutti i filtri reimpostati
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      searchTerm: '',
      selectedStatuses: [],
      selectedInteractionTypes: [],
      zoomLevel: 1
    });
  });

  test('dovrebbe mostrare correttamente le opzioni disponibili per i filtri', () => {
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Verifica che siano presenti le opzioni per lo stato
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/completed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/error/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/waiting/i)).toBeInTheDocument();
    
    // Verifica che siano presenti le opzioni per il tipo di interazione
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/response/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/command/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/result/i)).toBeInTheDocument();
  });

  test('dovrebbe disabilitare i controlli durante il caricamento', () => {
    // Imposta isLoading a true nel contesto
    vi.mocked(useAgentFlowContext).mockReturnValue({
      flowData: null,
      isLoading: true,
      refreshData: vi.fn()
    });
    
    render(<AgentFlowControls onFilterChange={mockOnFilterChange} />);
    
    // Verifica che la barra di ricerca sia disabilitata
    expect(screen.getByPlaceholderText(/cerca agenti/i)).toBeDisabled();
    
    // Verifica che il pulsante di aggiornamento sia disabilitato
    expect(screen.getByRole('button', { name: /aggiorna/i })).toBeDisabled();
    
    // Verifica che le checkbox siano disabilitate
    const allCheckboxes = screen.getAllByRole('checkbox');
    allCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
    
    // Verifica che lo slider dello zoom sia disabilitato
    expect(screen.getByRole('slider')).toBeDisabled();
  });
}); 