/**
 * @file AgentPanel.test.tsx
 * @description Test per il componente AgentPanel
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AgentPanel } from '../components/AgentPanel';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MasMessageType } from '@shared/messages';
import '@testing-library/jest-dom/vitest';
import { vi, describe, test, beforeAll, beforeEach, expect } from 'vitest';

// Mock di window.matchMedia che è usato dai componenti VS Code UI Toolkit
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

// Mock del hook useExtensionMessage
vi.mock('../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn(),
}));

// Mock dei componenti figli
vi.mock('../components/CoderAgentPrompt', () => ({
  CoderAgentPrompt: () => <div data-testid="coder-agent-prompt">CoderAgentPrompt</div>,
}));

vi.mock('../components/AgentActivityMonitor', () => ({
  AgentActivityMonitor: () => <div data-testid="agent-activity-monitor">AgentActivityMonitor</div>,
}));

vi.mock('../components/AgentConfigurationPanel', () => ({
  AgentConfigurationPanel: () => <div data-testid="agent-configuration-panel">AgentConfigurationPanel</div>,
}));

vi.mock('../components/MasTaskQueueView', () => ({
  MasTaskQueueView: () => <div data-testid="mas-task-queue-view">MasTaskQueueView</div>,
}));

// Mock di vscode
vi.mock('../utilities/vscode', () => ({
  vscode: {
    postMessage: vi.fn(),
  },
}));

describe('AgentPanel Component', () => {
  // Dati di mock per i test
  const mockAgentsStatus = [
    { id: 'coder-agent', name: 'Coder Agent', isActive: true, mode: 'autonomous' },
    { id: 'review-agent', name: 'Review Agent', isActive: false, mode: 'interactive' },
  ];

  const mockTaskQueue = {
    pendingTasks: [{ id: 'task1', name: 'Task 1', status: 'pending' }],
    completedTasks: [{ id: 'task2', name: 'Task 2', status: 'completed' }],
  };

  // Funzione di mock per postMessage
  const mockPostMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup del mock per useExtensionMessage
    (useExtensionMessage as any).mockReturnValue({
      postMessage: mockPostMessage,
    });
  });

  test('Renderizza correttamente il componente con stato di caricamento', () => {
    render(<AgentPanel />);
    
    // Verifica lo stato di caricamento
    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
    
    // Verifica che i componenti figli siano renderizzati
    expect(screen.getByTestId('coder-agent-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('agent-activity-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('mas-task-queue-view')).toBeInTheDocument();
    expect(screen.getByTestId('agent-configuration-panel')).toBeInTheDocument();
  });

  test('Invia richieste di stato all\'inizializzazione', () => {
    render(<AgentPanel />);
    
    // Verifica che postMessage sia chiamato per richiedere lo stato degli agenti e della coda
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MasMessageType.GET_AGENTS_STATUS,
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MasMessageType.GET_TASK_QUEUE_STATUS,
    });
  });

  test('Aggiorna lo stato quando riceve messaggi di aggiornamento', async () => {
    // Mock di addEventListener
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    // Renderizza il componente
    render(<AgentPanel />);
    
    // Simula la risposta dai messaggi dell'estensione
    const agentsUpdateMessage = {
      type: MasMessageType.AGENTS_STATUS_UPDATE,
      payload: mockAgentsStatus,
    };
    
    const taskQueueUpdateMessage = {
      type: MasMessageType.TASK_QUEUE_UPDATE,
      payload: mockTaskQueue,
    };
    
    // Recupera il gestore dei messaggi
    const messageListener = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Invia messaggi di aggiornamento
    act(() => {
      messageListener({ data: agentsUpdateMessage });
      messageListener({ data: taskQueueUpdateMessage });
    });
    
    // Verifica che lo stato sia aggiornato
    await waitFor(() => {
      expect(screen.getByText('1 agenti attivi')).toBeInTheDocument();
    });
    
    // Ripristina la funzione originale
    addEventListenerSpy.mockRestore();
  });

  test('Ignora messaggi che non sono di tipo AgentMessageUnion', async () => {
    // Mock di addEventListener
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    // Renderizza il componente
    render(<AgentPanel />);
    
    // Simula un messaggio non valido
    const invalidMessage = {
      type: 'INVALID_TYPE',
      payload: 'Invalid payload',
    };
    
    // Recupera il gestore dei messaggi
    const messageListener = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Invia il messaggio non valido
    act(() => {
      messageListener({ data: invalidMessage });
    });
    
    // Verifica che lo stato di caricamento sia ancora presente
    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
    
    // Ripristina la funzione originale
    addEventListenerSpy.mockRestore();
  });

  test('Rimuove event listener quando viene smontato', () => {
    const { unmount } = render(<AgentPanel />);
    
    // Mock della funzione removeEventListener
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    // Smonta il componente
    unmount();
    
    // Verifica che removeEventListener sia stato chiamato
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    
    // Ripristina la funzione originale
    removeEventListenerSpy.mockRestore();
  });

  test('Aggiorna lo stato dopo l\'invio di un\'istruzione', () => {
    // Mock di setTimeout
    vi.useFakeTimers();
    
    render(<AgentPanel />);
    
    // Recupera il componente CoderAgentPrompt
    const coderAgentPromptProps = require('../components/CoderAgentPrompt').CoderAgentPrompt.mock.calls[0][0];
    
    // Chiama onInstructionSent
    act(() => {
      coderAgentPromptProps.onInstructionSent();
      vi.runAllTimers();
    });
    
    // Verifica che le richieste siano state inviate nuovamente
    expect(mockPostMessage).toHaveBeenCalledTimes(4); // 2 all'inizio + 2 dopo l'istruzione
    
    // Ripristina setTimeout
    vi.useRealTimers();
  });
}); 

