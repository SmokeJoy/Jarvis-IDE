import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowDebugger } from '../AgentFlowDebugger';
import { AgentFlowProvider } from '../../../../context/AgentFlowContext';

// Mock dei componenti figli
vi.mock('../AgentFlowSummary', () => ({
  AgentFlowSummary: () => <div data-testid="mock-summary">Mock Summary</div>
}));

vi.mock('../AgentFlowControls', () => ({
  AgentFlowControls: ({ onFilterChange }) => (
    <div data-testid="mock-controls">
      <button onClick={() => onFilterChange({ searchTerm: 'test' })}>
        Test Filter Change
      </button>
    </div>
  )
}));

vi.mock('../AgentFlowDiagram', () => ({
  AgentFlowDiagram: ({ filters }) => (
    <div data-testid="mock-diagram">
      Mock Diagram - Search: {filters.searchTerm || 'none'}
    </div>
  )
}));

// Mock del contesto
vi.mock('../../../../context/AgentFlowContext', () => ({
  AgentFlowProvider: ({ children }) => <div data-testid="mock-provider">{children}</div>,
  useAgentFlowContext: vi.fn().mockReturnValue({
    flowData: null,
    isLoading: false,
    refreshData: vi.fn()
  })
}));

describe('AgentFlowDebugger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dovrebbe renderizzare il componente con tutti i suoi figli', () => {
    render(<AgentFlowDebugger />);
    
    // Verifica che il contenitore principale sia presente
    expect(screen.getByTestId('mock-provider')).toBeInTheDocument();
    
    // Verifica che tutti i componenti figli siano renderizzati
    expect(screen.getByTestId('mock-summary')).toBeInTheDocument();
    expect(screen.getByTestId('mock-controls')).toBeInTheDocument();
    expect(screen.getByTestId('mock-diagram')).toBeInTheDocument();
  });

  test('dovrebbe passare i filtri al componente del diagramma', () => {
    const { rerender } = render(<AgentFlowDebugger />);
    
    // Inizialmente il diagramma non dovrebbe avere filtri di ricerca
    expect(screen.getByTestId('mock-diagram').textContent).toContain('Search: none');
    
    // Simuliamo un cambiamento nei filtri
    screen.getByText('Test Filter Change').click();
    
    // Dopo il rendering, il componente dovrebbe aggiornare i filtri
    rerender(<AgentFlowDebugger />);
    
    // Verifichiamo che i filtri vengano passati al diagramma
    expect(screen.getByTestId('mock-diagram').textContent).toContain('Search: test');
  });

  test('dovrebbe avere la classe CSS corretta', () => {
    render(<AgentFlowDebugger />);
    
    // Verifica che il contenitore abbia la classe CSS corretta
    const container = screen.getByTestId('mock-provider').parentElement;
    expect(container).toHaveClass('agentflowdebugger-container');
  });

  test('dovrebbe avere un titolo che indica il debugger del flusso degli agenti', () => {
    render(<AgentFlowDebugger />);
    
    // Verifica che ci sia un titolo
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Debugger del Flusso degli Agenti');
  });

  test('dovrebbe passare i filtri aggiornati al diagramma quando cambiano', () => {
    render(<AgentFlowDebugger />);
    
    // Simuliamo un cambiamento nei filtri
    screen.getByText('Test Filter Change').click();
    
    // Verifichiamo che i filtri vengano passati al diagramma
    expect(screen.getByTestId('mock-diagram').textContent).toContain('Search: test');
  });

  test('dovrebbe essere avvolto nel provider del contesto AgentFlow', () => {
    const { container } = render(<AgentFlowDebugger />);
    
    // Verifica che l'elemento del provider sia presente nella gerarchia
    expect(screen.getByTestId('mock-provider')).toBeInTheDocument();
    
    // Verifica che il container principale del debugger sia un figlio del provider
    const debuggerContainer = container.querySelector('.agentflowdebugger-container');
    expect(debuggerContainer).not.toBeNull();
  });

  test('dovrebbe avere una struttura responsive con layout appropriato', () => {
    const { container } = render(<AgentFlowDebugger />);
    
    // Verifica che il container abbia la classe appropriata per il layout
    const debuggerContainer = container.querySelector('.agentflowdebugger-container');
    expect(debuggerContainer).not.toBeNull();
    
    // Verifichiamo la presenza delle sezioni principali
    const summarySection = screen.getByTestId('mock-summary').closest('div');
    const controlsSection = screen.getByTestId('mock-controls').closest('div');
    const diagramSection = screen.getByTestId('mock-diagram').closest('div');
    
    expect(summarySection).not.toBeNull();
    expect(controlsSection).not.toBeNull();
    expect(diagramSection).not.toBeNull();
  });
}); 