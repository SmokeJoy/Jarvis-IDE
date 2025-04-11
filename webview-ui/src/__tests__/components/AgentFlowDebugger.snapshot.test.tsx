/**
 * @file AgentFlowDebugger.snapshot.test.tsx
 * @description Test snapshot per il componente AgentFlowDebugger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AgentFlowDebugger, { AgentFlow } from '../../components/debug/AgentFlowDebugger';

// Mock per Mermaid.js
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mock SVG Diagram</svg>' })
  }
}));

// Dati di test deterministici (usiamo timestamp costanti per snapshot deterministici)
const mockAgentFlow: AgentFlow = {
  id: 'snapshot-flow',
  name: 'Flusso Snapshot',
  description: 'Test snapshot del componente AgentFlowDebugger',
  agents: [
    {
      id: 'agent1',
      name: 'Agente 1',
      role: 'Ruolo test 1',
      status: 'completed',
      startTime: 1677500000000, // Timestamp fisso
      endTime: 1677500010000    // 10 secondi dopo
    },
    {
      id: 'agent2',
      name: 'Agente 2',
      role: 'Ruolo test 2',
      status: 'running',
      startTime: 1677500008000  // 8 secondi dopo l'inizio
    },
    {
      id: 'agent3',
      name: 'Agente 3',
      role: 'Ruolo test 3',
      status: 'error',
      startTime: 1677500005000, // 5 secondi dopo l'inizio
      endTime: 1677500007000,   // 2 secondi di esecuzione
      error: 'Errore di test per snapshot'
    }
  ],
  interactions: [
    {
      id: 'interaction1',
      fromAgentId: 'agent1',
      toAgentId: 'agent2',
      message: 'Messaggio di test per snapshot 1',
      timestamp: 1677500005000
    },
    {
      id: 'interaction2',
      fromAgentId: 'agent2',
      toAgentId: 'agent1',
      message: 'Messaggio di test per snapshot 2',
      timestamp: 1677500009000
    }
  ],
  startTime: 1677500000000,
  endTime: 1677500015000,
  status: 'completed',
  maxTurns: 5,
  currentTurn: 3
};

// Funzione per preparare il test
const prepareSnapshotTest = () => {
  // Imposta un mock per Date.now() per renderlo deterministico
  const originalDateNow = Date.now;
  Date.now = vi.fn(() => 1677500020000); // 20 secondi dopo l'inizio del flusso
  
  // Reset il body e imposta una larghezza fissa per il container
  document.body.innerHTML = '';
  document.body.style.width = '1024px';
  
  // Mock per elementi DOM che potrebbero non essere disponibili in ambiente test
  Object.defineProperty(window, 'innerWidth', { value: 1024 });
  Object.defineProperty(window, 'innerHeight', { value: 768 });
  
  return () => {
    // Cleanup
    Date.now = originalDateNow;
  };
};

describe('AgentFlowDebugger Snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('corrisponde allo snapshot in stato iniziale', () => {
    const cleanup = prepareSnapshotTest();
    
    const { container } = render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Genera lo snapshot
    expect(container).toMatchSnapshot();
    
    cleanup();
  });
  
  it('corrisponde allo snapshot con un agente selezionato', async () => {
    const cleanup = prepareSnapshotTest();
    
    const { container } = render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Simuliamo manualmente lo stato con un agente selezionato
    // Questo approccio è necessario perché non possiamo aspettare il rendering di Mermaid
    // e il DOM reale in un test Jest/Vitest
    
    // Crea l'elemento "agent1" selezionato
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent1';
    const diagramContainer = container.querySelector('.agentflowdebugger-diagram-container');
    if (diagramContainer) {
      diagramContainer.innerHTML = '<svg>Mock SVG Diagram</svg>';
      diagramContainer.appendChild(mockSvgElement);
      
      // Forziamo il click sull'agente per simulare la selezione
      mockSvgElement.click();
      
      // Snapshot con agente selezionato
      expect(container).toMatchSnapshot();
    }
    
    cleanup();
  });
  
  it('corrisponde allo snapshot con un agente con errore selezionato', async () => {
    const cleanup = prepareSnapshotTest();
    
    const { container } = render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Simuliamo manualmente lo stato con un agente con errore selezionato
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent3'; // L'agente con errore
    const diagramContainer = container.querySelector('.agentflowdebugger-diagram-container');
    if (diagramContainer) {
      diagramContainer.innerHTML = '<svg>Mock SVG Diagram</svg>';
      diagramContainer.appendChild(mockSvgElement);
      
      // Forziamo il click sull'agente per simulare la selezione
      mockSvgElement.click();
      
      // Snapshot con agente con errore selezionato
      expect(container).toMatchSnapshot();
    }
    
    cleanup();
  });
  
  it('applica correttamente le classi personalizzate', () => {
    const cleanup = prepareSnapshotTest();
    
    const customClassName = 'custom-debugger-class';
    const { container } = render(
      <AgentFlowDebugger 
        flow={mockAgentFlow} 
        className={customClassName}
      />
    );
    
    // Verifica che la classe personalizzata sia applicata
    expect(container.firstChild).toHaveClass(customClassName);
    expect(container.firstChild).toHaveClass('agentflowdebugger-container');
    
    // Snapshot con classe personalizzata
    expect(container).toMatchSnapshot();
    
    cleanup();
  });
}); 

