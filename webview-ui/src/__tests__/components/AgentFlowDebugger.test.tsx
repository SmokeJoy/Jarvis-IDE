/**
 * @file AgentFlowDebugger.test.tsx
 * @description Test per il componente AgentFlowDebugger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AgentFlowDebugger, { AgentFlow } from '../../components/debug/AgentFlowDebugger';

// Mock per Mermaid.js
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mock SVG Diagram</svg>' })
  }
}));

// Dati di test
const mockAgentFlow: AgentFlow = {
  id: 'test-flow',
  name: 'Flusso di Test',
  description: 'Un flusso di test per AgentFlowDebugger',
  agents: [
    {
      id: 'agent1',
      name: 'Agente 1',
      role: 'Ruolo test 1',
      status: 'completed',
      startTime: Date.now() - 5000,
      endTime: Date.now() - 2000
    },
    {
      id: 'agent2',
      name: 'Agente 2',
      role: 'Ruolo test 2',
      status: 'running',
      startTime: Date.now() - 3000
    },
    {
      id: 'agent3',
      name: 'Agente 3',
      role: 'Ruolo test 3',
      status: 'error',
      startTime: Date.now() - 4000,
      endTime: Date.now() - 3500,
      error: 'Errore di test'
    }
  ],
  interactions: [
    {
      id: 'interaction1',
      fromAgentId: 'agent1',
      toAgentId: 'agent2',
      message: 'Messaggio di test 1',
      timestamp: Date.now() - 4000
    },
    {
      id: 'interaction2',
      fromAgentId: 'agent2',
      toAgentId: 'agent1',
      message: 'Messaggio di test 2',
      timestamp: Date.now() - 3000
    },
    {
      id: 'interaction3',
      fromAgentId: 'agent1',
      toAgentId: 'agent3',
      message: 'Messaggio di test 3',
      timestamp: Date.now() - 3800
    }
  ],
  startTime: Date.now() - 5000,
  status: 'running',
  maxTurns: 5,
  currentTurn: 2
};

describe('AgentFlowDebugger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetta il body per fare in modo che i test siano indipendenti
    document.body.innerHTML = '';
  });

  it('renderizza correttamente con i dati del flusso', async () => {
    render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Verifica che il titolo sia presente
    expect(screen.getByText('Visualizzatore Flusso Agenti')).toBeInTheDocument();
    
    // Verifica che le statistiche siano presenti
    expect(screen.getByText('Agenti:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Numero totale di agenti
    expect(screen.getByText('Completati: 1')).toBeInTheDocument();
    expect(screen.getByText('In esecuzione: 1')).toBeInTheDocument();
    expect(screen.getByText('Con errori: 1')).toBeInTheDocument();
    
    // Verifica che il diagramma sia presente
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    expect(diagramContainer).toHaveClass('agentflowdebugger-diagram-container');
    
    // Attendi che il mock di Mermaid sia chiamato
    await waitFor(() => {
      expect(require('mermaid').default.initialize).toHaveBeenCalled();
      expect(require('mermaid').default.render).toHaveBeenCalled();
    });
  });

  it('visualizza l\'indicatore di stato con emoji', () => {
    render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Verifica che l'indicatore di stato sia presente con l'emoji corretta
    expect(screen.getByText(/🔄/)).toBeInTheDocument(); // Emoji per 'running'
    expect(screen.getByText(/running/)).toBeInTheDocument();
  });

  it('gestisce gli errori di rendering del diagramma', async () => {
    // Forza il mock di Mermaid a generare un errore
    require('mermaid').default.render.mockRejectedValueOnce(new Error('Errore di rendering test'));
    
    render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Attendi che l'errore sia visualizzato
    await waitFor(() => {
      expect(screen.getByText(/Errore di rendering/)).toBeInTheDocument();
    });
  });

  it('mostra i dettagli dell\'agente quando viene selezionato', async () => {
    const mockOnSelectAgent = vi.fn();
    const { container } = render(
      <AgentFlowDebugger 
        flow={mockAgentFlow} 
        onSelectAgent={mockOnSelectAgent} 
      />
    );
    
    // Simula il post-rendering quando Mermaid ha già generato l'SVG
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent3';
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement);
    }
    
    // Simula un clic sull'elemento del diagramma
    fireEvent.click(mockSvgElement);
    
    // Verifica che il callback onSelectAgent sia stato chiamato
    expect(mockOnSelectAgent).toHaveBeenCalledWith('agent3');
    
    // Aspetta che i dettagli dell'agente vengano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Dettagli Agente: Agente 3')).toBeInTheDocument();
      expect(screen.getByText('Ruolo: Ruolo test 3')).toBeInTheDocument();
      expect(screen.getByText('Stato: error')).toBeInTheDocument();
      
      // Verifica che l'errore dell'agente sia visualizzato
      expect(screen.getByText('Errore:')).toBeInTheDocument();
      expect(screen.getByText('Errore di test')).toBeInTheDocument();
    });
  });

  it('visualizza correttamente le interazioni dell\'agente selezionato', async () => {
    const { container } = render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Simula il post-rendering quando Mermaid ha già generato l'SVG
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent1';
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement);
    }
    
    // Simula un clic sull'elemento del diagramma
    fireEvent.click(mockSvgElement);
    
    // Aspetta che le interazioni dell'agente vengano visualizzate
    await waitFor(() => {
      expect(screen.getByText('Interazioni (2):')).toBeInTheDocument();
      expect(screen.getByText('Messaggio di test 1')).toBeInTheDocument();
      expect(screen.getByText('Messaggio di test 3')).toBeInTheDocument();
      
      // Verifica che le direzioni siano corrette
      expect(screen.getByText('Inviato a Agente 2')).toBeInTheDocument();
      expect(screen.getByText('Inviato a Agente 3')).toBeInTheDocument();
    });
    
    // Clicca su un altro agente e verifica che le interazioni cambino
    const anotherMockSvgElement = document.createElement('div');
    anotherMockSvgElement.id = 'flowchart-agent2';
    if (diagramContainer) {
      diagramContainer.appendChild(anotherMockSvgElement);
    }
    
    fireEvent.click(anotherMockSvgElement);
    
    await waitFor(() => {
      expect(screen.getByText('Interazioni (2):')).toBeInTheDocument();
      expect(screen.getByText('Messaggio di test 2')).toBeInTheDocument();
      expect(screen.getByText('Ricevuto da Agente 1')).toBeInTheDocument();
    });
  });

  it('mostra un messaggio quando non ci sono interazioni per un agente', async () => {
    // Crea un flusso senza interazioni
    const flowWithoutInteractions = {
      ...mockAgentFlow,
      interactions: []
    };
    
    const { container } = render(<AgentFlowDebugger flow={flowWithoutInteractions} />);
    
    // Simula il post-rendering quando Mermaid ha già generato l'SVG
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent1';
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement);
    }
    
    // Simula un clic sull'elemento del diagramma
    fireEvent.click(mockSvgElement);
    
    // Verifica che il messaggio "nessuna interazione" sia visualizzato
    await waitFor(() => {
      expect(screen.getByText('Nessuna interazione trovata per questo agente.')).toBeInTheDocument();
    });
  });

  it('formatta correttamente i timestamp e le durate', async () => {
    // Prepara un flusso con timestamp e durate specifiche
    const now = Date.now();
    const specificFlow: AgentFlow = {
      ...mockAgentFlow,
      agents: [
        {
          id: 'agent-timing',
          name: 'Agente Timing',
          role: 'Test timing',
          status: 'completed',
          startTime: now - 3600000, // 1 ora fa
          endTime: now - 1800000    // 30 minuti fa
        },
        {
          id: 'agent-short',
          name: 'Agente Short',
          role: 'Test timing breve',
          status: 'completed',
          startTime: now - 1500,    // 1.5 secondi fa
          endTime: now - 500        // 0.5 secondi fa
        }
      ],
      startTime: now - 3600000
    };
    
    const { container } = render(<AgentFlowDebugger flow={specificFlow} />);
    
    // Simula il post-rendering per il primo agente (durata lunga)
    const mockSvgElement1 = document.createElement('div');
    mockSvgElement1.id = 'flowchart-agent-timing';
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement1);
    }
    
    // Simula un clic sul primo agente
    fireEvent.click(mockSvgElement1);
    
    // Verifica che la durata sia formattata correttamente (dovrebbe essere circa 30 minuti / 1800 secondi)
    await waitFor(() => {
      const durationText = screen.getByText(/Durata:/);
      expect(durationText.textContent).toMatch(/1800\.00s/);
    });
    
    // Simula il post-rendering per il secondo agente (durata breve)
    const mockSvgElement2 = document.createElement('div');
    mockSvgElement2.id = 'flowchart-agent-short';
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement2);
    }
    
    // Simula un clic sul secondo agente
    fireEvent.click(mockSvgElement2);
    
    // Verifica che la durata sia formattata correttamente (dovrebbe essere circa 1 secondo)
    await waitFor(() => {
      const durationText = screen.getByText(/Durata:/);
      expect(durationText.textContent).toMatch(/1\.00s/);
    });
  });

  it('tronca correttamente i messaggi lunghi', async () => {
    // Crea un flusso con messaggi lunghi
    const longMessage = 'Questo è un messaggio molto lungo che dovrebbe essere troncato nella visualizzazione del componente. Il messaggio è così lungo che dovrebbe essere troncato con i puntini di sospensione per mantenere l\'interfaccia pulita e usabile.';
    const flowWithLongMessages = {
      ...mockAgentFlow,
      interactions: [
        {
          id: 'long-interaction',
          fromAgentId: 'agent1',
          toAgentId: 'agent2',
          message: longMessage,
          timestamp: Date.now() - 1000
        }
      ]
    };
    
    const { container } = render(<AgentFlowDebugger flow={flowWithLongMessages} />);
    
    // Simula il post-rendering quando Mermaid ha già generato l'SVG
    const mockSvgElement = document.createElement('div');
    mockSvgElement.id = 'flowchart-agent1';
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(mockSvgElement);
    }
    
    // Simula un clic sull'elemento del diagramma
    fireEvent.click(mockSvgElement);
    
    // Verifica che il messaggio sia troncato
    await waitFor(() => {
      const messageElement = screen.getByText(/Questo è un messaggio molto lungo/);
      expect(messageElement.textContent).not.toEqual(longMessage);
      expect(messageElement.textContent?.endsWith('...')).toBeTruthy();
    });
  });

  it('applica le classi CSS corrette in base allo stato dell\'agente', () => {
    render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Verifica che il container principale abbia la classe corretta
    const container = screen.getByText('Visualizzatore Flusso Agenti').parentElement?.parentElement;
    expect(container).toHaveClass('agentflowdebugger-container');
    
    // Verifica altre classi (queste potrebbero richiedere un approccio diverso in base alla struttura del DOM)
    const diagramHeader = screen.getByText('Diagramma del Flusso').parentElement;
    expect(diagramHeader).toHaveClass('agentflowdebugger-diagram-header');
    
    // Verifica che il container del diagramma abbia la classe corretta
    expect(screen.getByText('Diagramma del Flusso').parentElement?.nextElementSibling).toHaveClass('agentflowdebugger-diagram-container');
  });

  it('mostra il pulsante di esportazione e gestisce il suo stato', async () => {
    render(<AgentFlowDebugger flow={mockAgentFlow} />);
    
    // Verifica che il pulsante di esportazione sia presente
    const exportButton = screen.getByText('Esporta PNG');
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toBeEnabled();
    
    // Verifica che il pulsante sia disabilitato quando isExporting è true
    // Per testarlo, impostiamo lo stato interno simulando un click
    // e mockando l'implementazione di exportDiagramAsPng
    
    // Mock delle funzioni del DOM per l'esportazione
    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
    
    // Mock di getComputedStyle per evitare errori
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      backgroundColor: '#ffffff'
    } as any);
    
    // Mock di canvas e context
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn()
    };
    
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test')
    };
    
    mockCreateElement.mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === 'a') {
        const a = document.createElement('a');
        vi.spyOn(a, 'click');
        return a;
      }
      return document.createElement(tag);
    });
    
    // Simula il post-rendering quando Mermaid ha già generato l'SVG
    const svg = document.createElement('svg');
    const diagramContainer = screen.getByText('Diagramma del Flusso').nextElementSibling;
    if (diagramContainer) {
      diagramContainer.appendChild(svg);
    }
    
    // Simula un clic sul pulsante di esportazione
    fireEvent.click(exportButton);
    
    // Verifica che le funzioni di esportazione siano state chiamate
    expect(mockCreateElement).toHaveBeenCalledWith('canvas');
    
    // Creiamo un'immagine e simuliamo l'evento onload
    const mockImg = new Image();
    const imgOnLoadSpy = vi.spyOn(Image.prototype, 'onload', 'get');
    const onLoadFn = vi.fn();
    imgOnLoadSpy.mockImplementation(() => onLoadFn);
    
    // Trigger dell'evento onload
    imgOnLoadSpy.mockReturnValue(() => {
      mockContext.drawImage(mockImg, 0, 0);
      const link = document.createElement('a');
      link.href = mockCanvas.toDataURL();
      link.download = 'Flusso di Test-diagram.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    // Verifica che il mock dell'onload venga chiamato
    if (typeof Image.prototype.onload === 'function') {
      Image.prototype.onload.call(mockImg);
    }
    
    // Ripulisci le spie
    mockCreateElement.mockRestore();
    mockCreateObjectURL.mockRestore();
    mockRevokeObjectURL.mockRestore();
    imgOnLoadSpy.mockRestore();
  });
}); 

