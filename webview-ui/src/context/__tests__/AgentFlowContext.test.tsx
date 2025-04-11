import React, { useContext } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFlowProvider, AgentFlowContext } from '../AgentFlowContext';
import * as vscode from '../../utils/vscode';

// Mock di vscode
vi.mock('../../utils/vscode', () => ({
  postMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}));

// Componente di test per l'accesso al contesto
const TestComponent = () => {
  const context = useContext(AgentFlowContext);
  
  return (
    <div>
      <div data-testid="loading-state">isLoading: {context.isLoading.toString()}</div>
      <div data-testid="error-state">error: {context.error?.message || 'null'}</div>
      <div data-testid="flow-data">
        flowData: {context.flowData ? 'presente' : 'null'}
      </div>
      <button data-testid="refresh-button" onClick={context.refreshData}>
        Aggiorna dati
      </button>
    </div>
  );
};

describe('AgentFlowContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dovrebbe fornire lo stato iniziale corretto', () => {
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Verifica dello stato iniziale
    expect(screen.getByTestId('loading-state')).toHaveTextContent('isLoading: true');
    expect(screen.getByTestId('error-state')).toHaveTextContent('error: null');
    expect(screen.getByTestId('flow-data')).toHaveTextContent('flowData: null');
  });

  test('dovrebbe registrare un listener per i messaggi durante il montaggio', () => {
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Verifica della registrazione del listener
    expect(vscode.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  test('dovrebbe rimuovere il listener durante lo smontaggio', () => {
    const { unmount } = render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    unmount();
    
    // Verifica della rimozione del listener
    expect(vscode.onMessage.removeListener).toHaveBeenCalledTimes(1);
  });

  test('dovrebbe richiedere i dati del flusso quando viene montato', () => {
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Verifica che sia stato inviato il messaggio request_agent_flow
    expect(vscode.postMessage).toHaveBeenCalledWith({
      command: 'request_agent_flow',
      payload: {}
    });
  });

  test('dovrebbe aggiornare lo stato quando riceve i dati del flusso', async () => {
    // Mock dei dati di risposta
    const mockFlowData = {
      agents: [
        { id: 'a1', name: 'Agent 1', status: 'active', type: 'planner' }
      ],
      interactions: [
        { id: 'i1', sourceId: 'a1', targetId: 'a2', type: 'message', content: 'Hello' }
      ]
    };
    
    // Setup del mock per simulare la ricezione dei dati
    let messageListener;
    vi.mocked(vscode.onMessage.addListener).mockImplementation((callback) => {
      messageListener = callback;
      return { dispose: vi.fn() };
    });
    
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Simulazione della ricezione di un messaggio con i dati del flusso
    act(() => {
      messageListener({
        command: 'agent_flow_data',
        payload: mockFlowData
      });
    });
    
    // Verifica che i dati siano stati aggiornati
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('isLoading: false');
      expect(screen.getByTestId('flow-data')).toHaveTextContent('flowData: presente');
    });
  });

  test('dovrebbe gestire gli errori quando la richiesta fallisce', async () => {
    // Setup del mock per simulare un errore
    let messageListener;
    vi.mocked(vscode.onMessage.addListener).mockImplementation((callback) => {
      messageListener = callback;
      return { dispose: vi.fn() };
    });
    
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Simulazione della ricezione di un messaggio di errore
    act(() => {
      messageListener({
        command: 'agent_flow_error',
        payload: { message: 'Errore durante il recupero dei dati' }
      });
    });
    
    // Verifica che l'errore sia stato gestito
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('isLoading: false');
      expect(screen.getByTestId('error-state')).toHaveTextContent('error: Errore durante il recupero dei dati');
    });
  });

  test('dovrebbe ricaricare i dati quando si chiama refreshData', () => {
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Reset del mock per ignorare la chiamata iniziale
    vi.mocked(vscode.postMessage).mockClear();
    
    // Trigger del refresh
    screen.getByTestId('refresh-button').click();
    
    // Verifica che sia stato inviato nuovamente il messaggio request_agent_flow
    expect(vscode.postMessage).toHaveBeenCalledWith({
      command: 'request_agent_flow',
      payload: {}
    });
    
    // Verifica che isLoading sia stato impostato su true
    expect(screen.getByTestId('loading-state')).toHaveTextContent('isLoading: true');
  });

  test('dovrebbe ignorare messaggi con comandi sconosciuti', async () => {
    // Setup del mock per simulare messaggi
    let messageListener;
    vi.mocked(vscode.onMessage.addListener).mockImplementation((callback) => {
      messageListener = callback;
      return { dispose: vi.fn() };
    });
    
    render(
      <AgentFlowProvider>
        <TestComponent />
      </AgentFlowProvider>
    );
    
    // Simulazione della ricezione di un messaggio con comando sconosciuto
    act(() => {
      messageListener({
        command: 'unknown_command',
        payload: {}
      });
    });
    
    // Verifica che lo stato non sia cambiato
    expect(screen.getByTestId('loading-state')).toHaveTextContent('isLoading: true');
    expect(screen.getByTestId('error-state')).toHaveTextContent('error: null');
    expect(screen.getByTestId('flow-data')).toHaveTextContent('flowData: null');
  });
}); 