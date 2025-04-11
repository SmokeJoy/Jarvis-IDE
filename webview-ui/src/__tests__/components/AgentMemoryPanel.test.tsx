import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AgentMemoryPanel from '../../components/AgentMemoryPanel';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { AgentMemoryMessageType } from '../../types/agent-memory-message';
import { mockVSCodeAPI } from '../setupWebviewMocks';

// Mock per useExtensionMessage
vi.mock('../../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn()
}));

// Mock per antd message
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  return {
    ...antd,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    }
  };
});

describe('AgentMemoryPanel', () => {
  const postMessageMock = vi.fn();
  let originalAddEventListener: typeof window.addEventListener;
  let eventListeners: { [key: string]: EventListener[] } = {};

  const mockMemoryItems = [
    {
      id: 'm1',
      content: 'Memoria test 1',
      timestamp: Date.now(),
      tags: ['test', 'importante']
    },
    {
      id: 'm2',
      content: 'Memoria test 2',
      timestamp: Date.now() - 1000,
      tags: ['test', 'secondario']
    }
  ];

  const mockAgentId = 'agent-test-123';

  beforeEach(() => {
    // Salva l'addEventListener originale
    originalAddEventListener = window.addEventListener;
    
    // Resetta i mock
    postMessageMock.mockClear();
    mockVSCodeAPI.postMessage.mockClear();
    
    // Mock per useExtensionMessage
    vi.mocked(useExtensionMessageModule.useExtensionMessage).mockReturnValue({
      postMessage: postMessageMock,
      sendMessageByType: vi.fn()
    });
    
    // Mock per addEventListener/removeEventListener
    eventListeners = {};
    window.addEventListener = vi.fn((event, callback) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback as EventListener);
    });
    
    window.removeEventListener = vi.fn((event, callback) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
      }
    });
  });

  afterEach(() => {
    // Ripristina l'addEventListener originale
    window.addEventListener = originalAddEventListener;
    
    // Cancella tutti i mock
    vi.clearAllMocks();
  });

  it('dovrebbe renderizzare correttamente', () => {
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    expect(screen.getByText('Memoria dell\'Agente')).toBeInTheDocument();
  });

  it('dovrebbe richiedere uno snapshot della memoria all\'avvio', () => {
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di richiesta snapshot
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AgentMemoryMessageType.REQUEST_MEMORY_SNAPSHOT,
        payload: expect.objectContaining({
          agentId: mockAgentId
        })
      })
    );
  });

  it('dovrebbe visualizzare gli elementi di memoria quando riceve una risposta', async () => {
    // Prepara un mock di risposta
    const mockResponse = {
      type: AgentMemoryMessageType.MEMORY_SNAPSHOT_RECEIVED,
      payload: {
        agentId: mockAgentId,
        memories: mockMemoryItems
      }
    };
    
    // Render del componente
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    
    // Estrai il message handler dai listeners registrati
    const messageHandler = eventListeners.message?.[0];
    expect(messageHandler).toBeDefined();
    
    // Simula ricezione messaggio
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockResponse }));
    }

    // Verifica che gli elementi di memoria siano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Memoria test 1')).toBeInTheDocument();
      expect(screen.getByText('Memoria test 2')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('importante')).toBeInTheDocument();
    });
  });

  it('dovrebbe salvare un nuovo elemento di memoria', async () => {
    // Render del componente
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    
    // Resetta il mock di postMessage
    postMessageMock.mockClear();
    
    // Inserisci contenuto nel campo di testo
    const textareaElement = screen.getByPlaceholderText('Aggiungi un nuovo elemento alla memoria...');
    fireEvent.change(textareaElement, { target: { value: 'Nuova memoria di test' } });
    
    // Inserisci tag nel campo apposito
    const tagInput = screen.getByPlaceholderText('Tag (separati da virgole)');
    fireEvent.change(tagInput, { target: { value: 'test, nuovo' } });
    
    // Trova e clicca sul pulsante Salva
    const saveButton = screen.getByText('Salva');
    fireEvent.click(saveButton);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di salvataggio
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AgentMemoryMessageType.SAVE_MEMORY_ITEM,
        payload: expect.objectContaining({
          agentId: mockAgentId,
          content: 'Nuova memoria di test',
          tags: ['test', 'nuovo']
        })
      })
    );
  });

  it('dovrebbe usare il pattern Union Dispatcher Type-Safe con postMessage', () => {
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    
    // Analizza i parametri delle chiamate
    const calls = postMessageMock.mock.calls;
    
    // Verifica che tutte le chiamate usino il parametro generico appropriato
    expect(calls.length).toBeGreaterThan(0);
    
    // Controlla che postMessage sia tipizzato correttamente
    const postMessageTSDefinition = useExtensionMessageModule.useExtensionMessage().postMessage;
    expect(typeof postMessageTSDefinition).toBe('function');
    
    // Verifica che postMessage sia stato chiamato con i tipi di messaggio appropriati
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: AgentMemoryMessageType.REQUEST_MEMORY_SNAPSHOT })
    );
  });

  it('dovrebbe filtrare gli elementi in base al testo di ricerca', async () => {
    // Prepara un mock di risposta
    const mockResponse = {
      type: AgentMemoryMessageType.MEMORY_SNAPSHOT_RECEIVED,
      payload: {
        agentId: mockAgentId,
        memories: mockMemoryItems
      }
    };
    
    // Render del componente
    render(<AgentMemoryPanel agentId={mockAgentId} />);
    
    // Simula ricezione messaggio
    const messageHandler = eventListeners.message?.[0];
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockResponse }));
    }
    
    // Attendi che gli elementi di memoria si carichino
    await waitFor(() => {
      expect(screen.getByText('Memoria test 1')).toBeInTheDocument();
      expect(screen.getByText('Memoria test 2')).toBeInTheDocument();
    });
    
    // Inserisci testo nel campo di ricerca
    const searchInput = screen.getByPlaceholderText('Cerca nella memoria...');
    fireEvent.change(searchInput, { target: { value: 'test 1' } });
    
    // Verifica che solo l'elemento corrispondente sia visualizzato
    await waitFor(() => {
      expect(screen.getByText('Memoria test 1')).toBeInTheDocument();
      expect(screen.queryByText('Memoria test 2')).not.toBeInTheDocument();
    });
  });
}); 

