import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PromptHistory, PromptHistoryMessageType } from '../../components/PromptHistory';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { mockVSCodeAPI } from '../setupWebviewMocks';

// Mock per useExtensionMessage
vi.mock('../../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn()
}));

describe('PromptHistory', () => {
  const postMessageMock = vi.fn();
  let originalAddEventListener: typeof window.addEventListener;
  let eventListeners: { [key: string]: EventListener[] } = {};

  const mockHistoryItems = [
    {
      id: '1',
      prompt: 'Test prompt 1',
      timestamp: Date.now(),
      type: 'success',
      result: 'Test result 1'
    },
    {
      id: '2',
      prompt: 'Test prompt 2',
      timestamp: Date.now() - 1000,
      type: 'error',
      result: 'Test result 2'
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
    render(<PromptHistory />);
    expect(screen.getByText('Cronologia Prompt')).toBeInTheDocument();
  });

  it('dovrebbe richiedere la cronologia all\'avvio', () => {
    render(<PromptHistory />);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di richiesta cronologia
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PromptHistoryMessageType.GET_HISTORY,
        payload: expect.objectContaining({
          limit: 100
        })
      })
    );
  });

  it('dovrebbe visualizzare gli elementi della cronologia quando riceve una risposta', async () => {
    // Prepara un mock di risposta
    const mockResponse = {
      type: PromptHistoryMessageType.HISTORY_RESPONSE,
      payload: {
        items: mockHistoryItems
      }
    };
    
    // Render del componente
    render(<PromptHistory />);
    
    // Estrai il message handler dai listeners registrati
    const messageHandler = eventListeners.message?.[0];
    expect(messageHandler).toBeDefined();
    
    // Simula ricezione messaggio
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockResponse }));
    }

    // Verifica che la cronologia sia visualizzata
    await waitFor(() => {
      expect(screen.getByText('Test prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Test prompt 2')).toBeInTheDocument();
    });
  });

  it('dovrebbe eliminare un elemento quando si clicca su elimina', async () => {
    // Prepara un mock di risposta per inizializzare la cronologia
    const mockResponse = {
      type: PromptHistoryMessageType.HISTORY_RESPONSE,
      payload: {
        items: mockHistoryItems
      }
    };
    
    // Render del componente
    const { container } = render(<PromptHistory />);
    
    // Simula ricezione messaggio con la cronologia
    const messageHandler = eventListeners.message?.[0];
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockResponse }));
    }
    
    // Attendi che la cronologia si carichi
    await waitFor(() => {
      expect(screen.getByText('Test prompt 1')).toBeInTheDocument();
    });
    
    // Resetta il mock di postMessage
    postMessageMock.mockClear();
    
    // Trova e clicca sul pulsante di eliminazione del primo elemento
    const deleteButtons = container.querySelectorAll('.delete-btn');
    fireEvent.click(deleteButtons[0]);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di eliminazione
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PromptHistoryMessageType.DELETE_ITEM,
        payload: expect.objectContaining({
          id: '1'
        })
      })
    );
  });

  it('dovrebbe usare il pattern Union Dispatcher Type-Safe con postMessage', () => {
    render(<PromptHistory />);
    
    // Analizza i parametri delle chiamate
    const calls = postMessageMock.mock.calls;
    
    // Verifica che tutte le chiamate usino il parametro generico appropriato
    expect(calls.length).toBeGreaterThan(0);
    
    // Controlla che postMessage sia tipizzato correttamente
    const postMessageTSDefinition = useExtensionMessageModule.useExtensionMessage().postMessage;
    expect(typeof postMessageTSDefinition).toBe('function');
    
    // Verifica che postMessage sia stato chiamato con i tipi di messaggio appropriati
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: PromptHistoryMessageType.GET_HISTORY })
    );
  });

  it('dovrebbe chiamare onSelectPrompt quando si seleziona un prompt', async () => {
    // Mock per la callback onSelectPrompt
    const onSelectPromptMock = vi.fn();
    
    // Prepara un mock di risposta per inizializzare la cronologia
    const mockResponse = {
      type: PromptHistoryMessageType.HISTORY_RESPONSE,
      payload: {
        items: mockHistoryItems
      }
    };
    
    // Render del componente
    const { container } = render(<PromptHistory onSelectPrompt={onSelectPromptMock} />);
    
    // Simula ricezione messaggio con la cronologia
    const messageHandler = eventListeners.message?.[0];
    if (messageHandler) {
      messageHandler(new MessageEvent('message', { data: mockResponse }));
    }
    
    // Attendi che la cronologia si carichi
    await waitFor(() => {
      expect(screen.getByText('Test prompt 1')).toBeInTheDocument();
    });
    
    // Resetta il mock di postMessage
    postMessageMock.mockClear();
    
    // Trova e clicca sul primo elemento della cronologia
    const historyItems = container.querySelectorAll('.item-content');
    fireEvent.click(historyItems[0]);
    
    // Verifica che postMessage sia stato chiamato con il messaggio di utilizzo prompt
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PromptHistoryMessageType.USE_PROMPT,
        payload: expect.objectContaining({
          id: '1'
        })
      })
    );
    
    // Verifica che onSelectPrompt sia stato chiamato con il prompt selezionato
    expect(onSelectPromptMock).toHaveBeenCalledWith('Test prompt 1');
  });
}); 

