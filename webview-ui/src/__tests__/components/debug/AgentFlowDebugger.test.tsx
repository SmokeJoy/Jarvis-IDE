/**
 * @file AgentFlowDebugger.test.tsx
 * @description Test per il componente AgentFlowDebugger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AgentFlowDebugger from '../../components/debug/AgentFlowDebugger';

describe('AgentFlowDebugger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renderizza correttamente con props predefinite', () => {
    render(<AgentFlowDebugger />);
    
    // Verifica elementi base
    expect(screen.getByText('Titolo Predefinito')).toBeInTheDocument();
    expect(screen.getByText(`Componente AgentFlowDebugger`)).toBeInTheDocument();
    expect(screen.getByTestId('agentflowdebugger-container')).toBeInTheDocument();
  });
  
  it('renderizza correttamente con titolo personalizzato', () => {
    const customTitle = 'Titolo Custom';
    render(<AgentFlowDebugger title={customTitle} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });
  
  it('chiama onChange quando lo stato cambia', () => {
    const mockOnChange = vi.fn();
    const initialValue = 'valore-iniziale';
    
    render(
      <AgentFlowDebugger 
        onChange={mockOnChange}
        initialValue={initialValue}
      />
    );
    
    // Verifica che il componente abbia il valore iniziale
    // Nota: questo è solo un esempio, adatta in base all'implementazione
    
    // Simula un cambiamento nel componente
    // Esempio: fireEvent.click(screen.getByRole('button'));
    
    // Verifica che onChange sia stato chiamato
    // expect(mockOnChange).toHaveBeenCalledWith(expect.any(String));
  });
  
  it('è accessibile - verifica ARIA e semantica', () => {
    render(<AgentFlowDebugger />);
    
    // Verifica che il container abbia un ID di test
    expect(screen.getByTestId('agentflowdebugger-container')).toBeInTheDocument();
    
    // Verifica intestazione
    expect(screen.getByRole('heading')).toBeInTheDocument();
    
    // Qui puoi aggiungere altri test per verificare l'accessibilità
    // come la presenza di alt, aria-label, ecc.
  });
});


