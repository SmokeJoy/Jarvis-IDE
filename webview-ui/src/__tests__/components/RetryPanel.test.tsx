/**
 * @file RetryPanel.test.tsx
 * @description Test per il componente RetryPanel
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RetryPanel } from '../../components/RetryPanel';
import { MasMessageType } from '@shared/messages';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { setupMessageMock, createTestMessage } from '../test-utils/setupMessageMock';
import '@testing-library/jest-dom/vitest';

// Mock del sistema di messaggi della webview
let messageHandlers: Array<(event: MessageEvent) => void> = [];
const hasHandlers = () => messageHandlers.length > 0;
const clearHandlers = () => { messageHandlers = []; };

// Mock per window.addEventListener e removeEventListener
vi.stubGlobal('window', {
  ...window,
  addEventListener: vi.fn((event, handler) => {
    if (event === 'message') {
      messageHandlers.push(handler as any);
    }
  }),
  removeEventListener: vi.fn((event, handler) => {
    if (event === 'message') {
      const index = messageHandlers.indexOf(handler as any);
      if (index > -1) {
        messageHandlers.splice(index, 1);
      }
    }
  }),
  postMessage: vi.fn(),
});

// Funzione per inviare messaggi simulati
function sendMessage(data: any) {
  const event = new MessageEvent('message', { data });
  messageHandlers.forEach(handler => handler(event));
}

// Inizializziamo il mock
function setupMessageMock() {
  clearHandlers();
  console.log('setupMessageMock initialized, handlers:', messageHandlers.length);
}

// Setup e teardown
beforeEach(() => {
  setupMessageMock();
  vi.useFakeTimers();
});

afterEach(() => {
  clearHandlers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('RetryPanel', () => {
  it('rende correttamente il pulsante di ripetizione', () => {
    render(<RetryPanel />);
    
    // Verifica che il pulsante è presente
    expect(screen.getByRole('button', { name: /riprova operazione/i })).toBeInTheDocument();
    
    // Verifica che il componente ha il titolo corretto
    expect(screen.getByText(/Stato Retry/i)).toBeInTheDocument();
  });
  
  it('invia un messaggio AGENT_RETRY_REQUEST quando si fa clic sul pulsante', () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Fai clic sul pulsante
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Verifica che il messaggio è stato inviato
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'AGENT_RETRY_REQUEST'
    });
  });
  
  it('mostra lo stato di caricamento dopo aver fatto clic sul pulsante', () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Fai clic sul pulsante
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Verifica che il pulsante mostra lo stato di caricamento
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/In corso.../i)).toBeInTheDocument();
  });
  
  it('mostra un messaggio di successo dopo la ricezione di un risultato positivo', async () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Verifica che gli handler per i messaggi siano registrati
    expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    
    // Clicca sul pulsante per attivare lo stato di caricamento
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Invia un messaggio di successo
    sendMessage({
      type: 'AGENT_RETRY_RESULT',
      success: true,
      message: 'Operazione completata con successo'
    });
    
    // Avanza il tempo per permettere l'aggiornamento del componente
    vi.advanceTimersByTime(100);
    
    // Verifica che sia visualizzato un messaggio di successo
    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
      const item = items[0]; 
      expect(item).toHaveTextContent(/successo/i);
    });
    
    // Il pulsante dovrebbe essere riabilitato
    expect(screen.getByRole('button', { name: /riprova operazione/i })).not.toBeDisabled();
  });
  
  it('mostra un messaggio di errore dopo la ricezione di un risultato negativo', async () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Clicca sul pulsante per attivare lo stato di caricamento
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Invia un messaggio di errore
    sendMessage({
      type: 'AGENT_RETRY_RESULT',
      success: false,
      message: 'Errore durante l\'operazione'
    });
    
    // Avanza il tempo per permettere l'aggiornamento del componente
    vi.advanceTimersByTime(100);
    
    // Verifica che sia visualizzato un messaggio di errore
    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
      const item = items[0];
      expect(item).toHaveTextContent(/errore/i);
    });
    
    // Il pulsante dovrebbe essere riabilitato
    expect(screen.getByRole('button', { name: /riprova operazione/i })).not.toBeDisabled();
  });
  
  it('ignora i messaggi che non sono di tipo AGENT_RETRY_RESULT', () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Clicca sul pulsante per attivare lo stato di caricamento
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Invia un messaggio di tipo diverso
    sendMessage({
      type: 'OTHER_MESSAGE',
      data: 'Alcuni dati'
    });
    
    // Il pulsante dovrebbe rimanere disabilitato
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('gestisce i messaggi di retry per agenti specifici', async () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    render(<RetryPanel />);
    
    // Clicca sul pulsante per attivare lo stato di caricamento
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Invia un messaggio di successo per un agente specifico
    sendMessage({
      type: 'AGENT_RETRY_RESULT',
      agentId: 'test-agent',
      success: true,
      message: 'Successo per l\'agente corretto'
    });
    
    // Avanza il tempo per permettere l'aggiornamento del componente
    vi.advanceTimersByTime(100);
    
    // Verifica che sia visualizzato un messaggio di successo
    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
      const item = items[0];
      expect(item).toHaveTextContent(/successo/i);
      expect(item).toHaveTextContent(/test-agent/i);
    });
    
    // Il pulsante dovrebbe essere riabilitato
    expect(screen.getByRole('button', { name: /riprova operazione/i })).not.toBeDisabled();
  });
  
  it('è accessibile - il pulsante ha un role e aria-label appropriati', () => {
    render(<RetryPanel />);
    
    // Verifica che il pulsante abbia l'attributo aria-label
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Riprova operazione');
  });
  
  it('gestisce correttamente lo smontaggio durante lo stato di caricamento', () => {
    const mockPostMessage = vi.fn();
    vi.stubGlobal('vscode', { postMessage: mockPostMessage });
    
    const { unmount } = render(<RetryPanel />);
    
    // Clicca sul pulsante per attivare lo stato di caricamento
    fireEvent.click(screen.getByRole('button', { name: /riprova operazione/i }));
    
    // Smonta il componente
    unmount();
    
    // Non dovrebbero esserci errori (event listener rimosso)
    sendMessage({
      type: 'AGENT_RETRY_RESULT',
      success: true
    });
    
    // Verifica che gli event listener sono stati rimossi
    expect(window.removeEventListener).toHaveBeenCalled();
  });
}); 

