/**
 * @file MASMemoryPanel.test.tsx
 * @description Test per il componente MASMemoryPanel
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MASMemoryPanel } from '../../components/MASMemoryPanel';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { MasMessageType, AgentMemoryRequestMessage, AgentMemoryResponseMessage } from '@shared/messages';
import { isAgentMemoryResponseMessage } from '../../types/mas-message-guards';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { setupMessageMock, createTestMessage } from '../test-utils/setupMessageMock';

describe('MASMemoryPanel', () => {
  const mockPostMessage = vi.fn();
  const { simulateMessage, hasHandlers, reset } = setupMessageMock();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock per useExtensionMessage
    vi.spyOn(useExtensionMessageModule, 'useExtensionMessage').mockReturnValue({
      postMessage: mockPostMessage
    });
  });

  afterEach(() => {
    reset();
  });

  it('rende correttamente il titolo e il pulsante di aggiornamento', () => {
    render(<MASMemoryPanel />);

    expect(screen.getByText('Memoria MAS')).toBeInTheDocument();
    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('invia un messaggio AGENT_MEMORY_REQUEST quando si fa clic sul pulsante di aggiornamento', async () => {
    render(<MASMemoryPanel />);

    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    fireEvent.click(refreshButton);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MasMessageType.AGENT_MEMORY_REQUEST,
      payload: {
        scope: 'current_session'
      }
    });
  });

  it('mostra lo stato di caricamento durante la richiesta', async () => {
    render(<MASMemoryPanel />);

    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    fireEvent.click(refreshButton);

    // Verifica che sia visibile l'indicatore di caricamento
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();
  });

  it('aggiorna la visualizzazione quando riceve un messaggio AGENT_MEMORY_RESPONSE', async () => {
    render(<MASMemoryPanel />);
    
    // Verifica che gli handler per i messaggi siano registrati
    expect(hasHandlers()).toBe(true);

    // Simuliamo la ricezione di una risposta con dati di memoria
    const memoryData = {
      user_preference: {
        dark_mode: true,
        last_command: 'help'
      },
      system_settings: {
        notification_level: 'high',
        auto_update: true
      }
    };

    simulateMessage(createTestMessage(MasMessageType.AGENT_MEMORY_RESPONSE, {
      payload: memoryData
    }));

    // Verifica che i dati della memoria siano visualizzati
    await waitFor(() => {
      expect(screen.getByText(/user_preference/)).toBeInTheDocument();
      expect(screen.getByText(/dark_mode/)).toBeInTheDocument();
      expect(screen.getByText(/last_command/)).toBeInTheDocument();
    });
  });

  it('gestisce correttamente una risposta vuota', async () => {
    render(<MASMemoryPanel />);

    // Simuliamo la ricezione di una risposta vuota
    simulateMessage(createTestMessage(MasMessageType.AGENT_MEMORY_RESPONSE, {
      payload: {}
    }));

    // Verifica che sia visualizzato un messaggio di memoria vuota
    await waitFor(() => {
      expect(screen.getByText(/nessun dato in memoria/i)).toBeInTheDocument();
    });
  });

  it('utilizza postMessage con tipo generico per garantire type safety', async () => {
    render(<MASMemoryPanel />);

    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    fireEvent.click(refreshButton);

    const expectedMessage = {
      type: MasMessageType.AGENT_MEMORY_REQUEST,
      payload: {
        scope: 'current_session'
      }
    };

    expect(mockPostMessage).toHaveBeenCalledWith(expectedMessage);
    expect(mockPostMessage.mock.calls[0][0].type).toBe(MasMessageType.AGENT_MEMORY_REQUEST);
  });

  it('permette di cercare dati nella memoria', async () => {
    const user = userEvent.setup();
    render(<MASMemoryPanel />);

    // Simuliamo la ricezione di una risposta con dati
    const memoryData = {
      user_preference: {
        dark_mode: true,
        last_command: 'help'
      },
      system_settings: {
        notification_level: 'high',
        auto_update: true
      }
    };

    simulateMessage(createTestMessage(MasMessageType.AGENT_MEMORY_RESPONSE, {
      payload: memoryData
    }));

    // Attende che i dati siano visualizzati
    await waitFor(() => {
      expect(screen.getByText(/user_preference/)).toBeInTheDocument();
    });

    // Trova il campo di ricerca
    const searchInput = screen.getByPlaceholderText(/cerca/i);
    await user.type(searchInput, 'dark');

    // Verifica che il filtro funzioni
    await waitFor(() => {
      expect(screen.getByText(/dark_mode/)).toBeInTheDocument();
      expect(screen.queryByText(/notification_level/)).not.toBeInTheDocument();
    });
  });

  it('è accessibile - il pulsante ha un role e aria-label appropriati', () => {
    render(<MASMemoryPanel />);
    
    const button = screen.getByRole('button', { name: /aggiorna/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Aggiorna memoria');
  });

  it('invia una richiesta di memoria all\'avvio', async () => {
    render(<MASMemoryPanel />);
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: MasMessageType.AGENT_MEMORY_REQUEST,
        payload: expect.any(Object)
      }));
    });
  });

  it('gestisce la visualizzazione dei messaggi di errore', async () => {
    render(<MASMemoryPanel />);
    
    // Simula una risposta di errore
    simulateMessage(createTestMessage(MasMessageType.ERROR, {
      payload: {
        message: 'Errore nel recupero della memoria',
        code: 'MEMORY_ERROR'
      }
    }));
    
    // Verifica che il messaggio di errore sia visualizzato
    await waitFor(() => {
      expect(screen.getByText(/errore nel recupero/i)).toBeInTheDocument();
    });

    // Verifica che il pulsante di aggiornamento sia riabilitato
    const refreshButton = screen.getByRole('button', { name: /aggiorna/i });
    expect(refreshButton).not.toBeDisabled();
  });

  it('gestisce correttamente l\'aggiornamento e la pulizia degli handler', async () => {
    const { unmount } = render(<MASMemoryPanel />);
    
    // Verifica che gli handler per i messaggi siano registrati
    expect(hasHandlers()).toBe(true);
    
    // Smonta il componente
    unmount();
    
    // Simuliamo la ricezione di una risposta dopo lo smontaggio (non dovrebbe causare errori)
    simulateMessage(createTestMessage(MasMessageType.AGENT_MEMORY_RESPONSE, {
      payload: { test: 'data' }
    }));
    
    // Non è necessario fare ulteriori verifiche, il test passa se non ci sono errori
  });
}); 

