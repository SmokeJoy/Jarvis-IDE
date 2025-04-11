/**
 * @file SuggestionsPanel.test.tsx
 * @description Test per il componente SuggestionsPanel
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuggestionsPanel } from '../SuggestionsPanel';
import { useExtensionMessage } from '../../hooks/useExtensionMessage';
import { SuggestionsMessageType, Suggestion } from '../../types/suggestions-message';

// Mock dell'hook useExtensionMessage
jest.mock('../../hooks/useExtensionMessage');

describe('SuggestionsPanel', () => {
  const mockPostMessage = jest.fn();
  const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  
  // Mock dei suggerimenti per i test
  const mockSuggestions: Suggestion[] = [
    {
      id: 'sugg-1',
      text: 'Estrai questa funzione in un componente separato',
      type: 'refactor',
      confidence: 85
    },
    {
      id: 'sugg-2',
      text: 'Correggi il tipo di ritorno della funzione',
      type: 'fix',
      preview: 'function add(a: number, b: number): number { return a + b; }',
      confidence: 95
    },
    {
      id: 'sugg-3',
      text: 'Aggiungi documentazione a questa classe',
      type: 'code',
      confidence: 60
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dell'hook con postMessage
    (useExtensionMessage as jest.Mock).mockReturnValue({
      postMessage: mockPostMessage
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('dovrebbe renderizzare lo stato iniziale vuoto', () => {
    render(<SuggestionsPanel />);
    
    expect(screen.getByText('Suggerimenti')).toBeInTheDocument();
    expect(screen.getByText('Nessun suggerimento disponibile per il contesto attuale')).toBeInTheDocument();
    expect(screen.getByText('Aggiorna')).toBeInTheDocument();
  });

  test('dovrebbe aggiungere e rimuovere un event listener per i messaggi', () => {
    const { unmount } = render(<SuggestionsPanel />);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('dovrebbe inviare una richiesta di suggerimenti all\'avvio', () => {
    render(<SuggestionsPanel currentFile="app.tsx" selectedText="function example() {}" />);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SuggestionsMessageType.REQUEST_SUGGESTIONS,
      payload: {
        context: undefined,
        currentFile: 'app.tsx',
        selectedText: 'function example() {}'
      }
    });
  });

  test('dovrebbe mostrare i suggerimenti quando ricevuti', async () => {
    render(<SuggestionsPanel />);
    
    // Simula la ricezione di suggerimenti
    const messageHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTIONS_UPDATED,
        payload: {
          suggestions: mockSuggestions
        }
      }
    }));
    
    // Verifica che i suggerimenti siano mostrati
    expect(screen.getByText('Estrai questa funzione in un componente separato')).toBeInTheDocument();
    expect(screen.getByText('Correggi il tipo di ritorno della funzione')).toBeInTheDocument();
    expect(screen.getByText('Aggiungi documentazione a questa classe')).toBeInTheDocument();
    
    // Verifica che i badge del tipo siano mostrati correttamente
    expect(screen.getByText('Refactor')).toBeInTheDocument();
    expect(screen.getByText('Fix')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    
    // Verifica che i badge di confidenza siano mostrati
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  test('dovrebbe inviare un messaggio type-safe quando un suggerimento viene accettato', async () => {
    render(<SuggestionsPanel />);
    
    // Simula la ricezione di suggerimenti
    const messageHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTIONS_UPDATED,
        payload: {
          suggestions: mockSuggestions
        }
      }
    }));
    
    // Clicca sul pulsante "Applica" del primo suggerimento
    const applyButtons = screen.getAllByText('Applica');
    fireEvent.click(applyButtons[0]);
    
    // Verifica che il messaggio type-safe sia stato inviato
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SuggestionsMessageType.SUGGESTION_ACCEPTED,
      payload: {
        suggestionId: 'sugg-1',
        applyMode: 'immediate'
      }
    });
  });

  test('dovrebbe inviare un messaggio type-safe quando un suggerimento viene rifiutato', async () => {
    render(<SuggestionsPanel />);
    
    // Simula la ricezione di suggerimenti
    const messageHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTIONS_UPDATED,
        payload: {
          suggestions: mockSuggestions
        }
      }
    }));
    
    // Clicca sul pulsante "Ignora" del secondo suggerimento
    const ignoreButtons = screen.getAllByText('Ignora');
    fireEvent.click(ignoreButtons[1]);
    
    // Verifica che il messaggio type-safe sia stato inviato
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SuggestionsMessageType.SUGGESTION_REJECTED,
      payload: {
        suggestionId: 'sugg-2'
      }
    });
  });

  test('dovrebbe inviare un messaggio type-safe quando i suggerimenti vengono puliti', async () => {
    render(<SuggestionsPanel />);
    
    // Simula la ricezione di suggerimenti
    const messageHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTIONS_UPDATED,
        payload: {
          suggestions: mockSuggestions
        }
      }
    }));
    
    // Clicca sul pulsante "Pulisci"
    const clearButton = screen.getByRole('button', { name: /clear-all/i });
    fireEvent.click(clearButton);
    
    // Verifica che il messaggio type-safe sia stato inviato
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: SuggestionsMessageType.SUGGESTIONS_CLEARED
    });
  });

  test('dovrebbe rimuovere un suggerimento quando riceve un messaggio di accettazione', async () => {
    render(<SuggestionsPanel />);
    
    // Simula la ricezione di suggerimenti
    const messageHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTIONS_UPDATED,
        payload: {
          suggestions: mockSuggestions
        }
      }
    }));
    
    // Verifica che ci siano 3 suggerimenti
    expect(screen.getAllByText(/Ignora/).length).toBe(3);
    
    // Simula la ricezione di un messaggio di accettazione
    messageHandler(new MessageEvent('message', {
      data: {
        type: SuggestionsMessageType.SUGGESTION_ACCEPTED,
        payload: {
          suggestionId: 'sugg-1'
        }
      }
    }));
    
    // Verifica che ora ci siano 2 suggerimenti
    expect(screen.getAllByText(/Ignora/).length).toBe(2);
    
    // Verifica che il suggerimento rimosso non sia più presente
    expect(screen.queryByText('Estrai questa funzione in un componente separato')).not.toBeInTheDocument();
  });

  test('dovrebbe mostrare lo stato di caricamento durante la richiesta', async () => {
    render(<SuggestionsPanel />);
    
    // Clicca sul pulsante di aggiornamento per richiedere i suggerimenti
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    // Verifica che lo stato di caricamento sia mostrato
    expect(screen.getByText('Caricamento suggerimenti...')).toBeInTheDocument();
  });
}); 