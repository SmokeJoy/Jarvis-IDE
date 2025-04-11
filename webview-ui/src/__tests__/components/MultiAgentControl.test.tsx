import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MultiAgentControl } from '../../components/MultiAgentControl';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { MasMessageType } from '../../types/mas-message';
import { mockVSCodeAPI } from '../setupWebviewMocks';

// Mock per useExtensionMessage
vi.mock('../../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn()
}));

describe('MultiAgentControl', () => {
  const postMessageMock = vi.fn();
  let originalAddEventListener: typeof window.addEventListener;
  let eventListeners: { [key: string]: EventListener[] } = {};

  const mockAgents = [
    {
      id: 'agent1',
      name: 'Agente 1',
      isActive: true,
      icon: '🤖',
      description: 'Descrizione agente 1',
      mode: 'autonomous'
    },
    {
      id: 'agent2',
      name: 'Agente 2',
      isActive: false,
      icon: '🔧',
      description: 'Descrizione agente 2',
      mode: 'supervised'
    }
  ];

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
    render(<MultiAgentControl />);
    expect(screen.getByText('Controllo Multi-Agent')).toBeInTheDocument();
  });

  it('dovrebbe richiedere lo stato degli agenti all\'avvio quando non ci sono agenti iniziali', () => {
    render(<MultiAgentControl />);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di richiesta stato agenti
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MasMessageType.GET_AGENTS_STATUS
      })
    );
  });

  it('dovrebbe visualizzare gli agenti forniti come prop', () => {
    render(<MultiAgentControl initialAgents={mockAgents} />);
    
    // Verifica che gli agenti siano visualizzati
    expect(screen.getByText('Agente 1')).toBeInTheDocument();
    expect(screen.getByText('Agente 2')).toBeInTheDocument();
    expect(screen.getByText('1 di 2 agenti attivi')).toBeInTheDocument();
  });

  it('dovrebbe cambiare la modalità del sistema quando viene selezionata una nuova modalità', async () => {
    render(<MultiAgentControl initialAgents={mockAgents} />);
    
    // Resetta il mock di postMessage
    postMessageMock.mockClear();
    
    // Trova e seleziona una modalità diversa dal dropdown
    const dropdown = screen.getByLabelText('Modalità di Collaborazione:');
    fireEvent.change(dropdown, { target: { value: 'single' }});
    
    // Verifica che postMessage sia stato chiamato con il messaggio di cambio modalità
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MasMessageType.SET_SYSTEM_MODE,
        payload: expect.objectContaining({
          mode: 'single'
        })
      })
    );
  });

  it('dovrebbe cambiare lo stile di codice predefinito quando viene selezionato un nuovo stile', async () => {
    render(<MultiAgentControl initialAgents={mockAgents} />);
    
    // Resetta il mock di postMessage
    postMessageMock.mockClear();
    
    // Trova e seleziona uno stile di codice diverso dal dropdown
    const dropdown = screen.getByLabelText('Stile di Codice Predefinito:');
    fireEvent.change(dropdown, { target: { value: 'concise' }});
    
    // Verifica che postMessage sia stato chiamato con il messaggio di cambio stile
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MasMessageType.SET_DEFAULT_STYLE,
        payload: expect.objectContaining({
          style: 'concise'
        })
      })
    );
  });

  it('dovrebbe aggiornare lo stato degli agenti quando riceve un messaggio di aggiornamento', async () => {
    // Prepara un mock di risposta
    const mockAgentsUpdate = {
      type: MasMessageType.AGENTS_STATUS_UPDATE,
      payload: [
        { id: 'agent1', name: 'Agente 1 Aggiornato', isActive: true, icon: '🤖', mode: 'active' },
        { id: 'agent3', name: 'Nuovo Agente', isActive: true, icon: '🔍', mode: 'active' }
      ]
    };
    
    // Render del componente
    render(<MultiAgentControl initialAgents={mockAgents} />);
    
    // Estrai il message handler dai listeners registrati
    const messageHandler = eventListeners.message?.[0];
    expect(messageHandler).toBeDefined();
    
    // Simula ricezione messaggio
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockAgentsUpdate }));
    }

    // Verifica che lo stato sia aggiornato nel componente
    await waitFor(() => {
      expect(screen.getByText('Agente 1 Aggiornato')).toBeInTheDocument();
      expect(screen.getByText('Nuovo Agente')).toBeInTheDocument();
      expect(screen.queryByText('Agente 2')).not.toBeInTheDocument();
    });
  });

  it('dovrebbe usare il pattern Union Dispatcher Type-Safe con postMessage', () => {
    render(<MultiAgentControl />);
    
    // Verifica che postMessage sia stato chiamato
    expect(postMessageMock).toHaveBeenCalled();
    
    // Verifica che tutte le chiamate usino il parametro generico appropriato
    const calls = postMessageMock.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    // Controlla che postMessage sia tipizzato correttamente
    const postMessageTSDefinition = useExtensionMessageModule.useExtensionMessage().postMessage;
    expect(typeof postMessageTSDefinition).toBe('function');
    
    // Verifica che postMessage sia stato chiamato con i tipi di messaggio appropriati
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: MasMessageType.GET_AGENTS_STATUS })
    );
  });

  it('dovrebbe mostrare un messaggio di stato quando riceve una conferma di salvataggio della configurazione', async () => {
    // Prepara un mock di risposta di configurazione salvata
    const mockConfigSaved = {
      type: MasMessageType.CONFIGURATION_SAVED
    };
    
    // Render del componente
    render(<MultiAgentControl initialAgents={mockAgents} />);
    
    // Estrai il message handler dai listeners registrati
    const messageHandler = eventListeners.message?.[0];
    expect(messageHandler).toBeDefined();
    
    // Simula ricezione messaggio
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockConfigSaved }));
    }

    // Verifica che il messaggio di conferma sia visualizzato
    await waitFor(() => {
      expect(screen.getByText('Configurazione salvata con successo')).toBeInTheDocument();
    });
  });
}); 

