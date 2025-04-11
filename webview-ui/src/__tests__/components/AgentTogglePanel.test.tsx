/**
 * @file AgentTogglePanel.test.tsx
 * @description Test per il componente AgentTogglePanel
 * @version 1.0.0
 * @added M9-S4
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentTogglePanel } from '../../components/AgentTogglePanel';
import * as useExtensionMessageModule from '../../hooks/useExtensionMessage';
import { MasMessageType, AgentToggleEnableMessage, AgentsStatusUpdateMessage } from '../../types/mas-message';
import { mockVSCodeAPI } from '../setupWebviewMocks';
import { isAgentsStatusUpdateMessage } from '../../types/mas-message-guards';
import '@testing-library/jest-dom/vitest';
import { setupMessageMock, createTestMessage } from '../test-utils/setupMessageMock';

// Mock per useExtensionMessage
vi.mock('../../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn()
}));

describe('AgentTogglePanel', () => {
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

  const mockAgents = [
    { 
      id: 'agent-1', 
      name: 'Agente 1', 
      enabled: true, 
      isActive: true, 
      mode: 'autonomous' as const,
      dependencies: [],
      warnings: []
    },
    { 
      id: 'agent-2', 
      name: 'Agente 2', 
      enabled: false, 
      isActive: false, 
      mode: 'supervised' as const,
      dependencies: [],
      warnings: [] 
    }
  ];

  it('renderizza correttamente la lista agenti con toggle attivi/disattivi', () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);

    expect(screen.getByText('Gestione Agenti')).toBeInTheDocument();
    expect(screen.getByText('Agente 1')).toBeInTheDocument();
    expect(screen.getByText('Agente 2')).toBeInTheDocument();

    const toggles = screen.getAllByRole('switch');
    expect(toggles[0]).toHaveAttribute('aria-checked', 'true');
    expect(toggles[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('invia un messaggio AGENT_TOGGLE_ENABLE quando si interagisce con il toggle', async () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);

    const toggles = screen.getAllByRole('switch');
    fireEvent.click(toggles[1]); // Attiva Agente 2

    const expectedMessage: AgentToggleEnableMessage = {
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      payload: {
        agentId: 'agent-2',
        enabled: true
      }
    };

    expect(mockPostMessage).toHaveBeenCalledWith(expectedMessage);
  });

  it('invia una richiesta di GET_AGENTS_STATUS se non vengono forniti agenti iniziali', () => {
    render(<AgentTogglePanel />);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MasMessageType.GET_AGENTS_STATUS
    });
  });

  it('aggiorna lo stato dei toggle quando riceve AGENTS_STATUS_UPDATE', async () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);
    
    // Verifica che gli handler siano stati registrati
    expect(hasHandlers()).toBe(true);

    // Costruisci un messaggio di aggiornamento stato che cambia lo stato "enabled"
    const updatedAgents = [
      { ...mockAgents[0], enabled: false },
      { ...mockAgents[1], enabled: true }
    ];

    const updatedMessage = createTestMessage<AgentsStatusUpdateMessage>(
      MasMessageType.AGENTS_STATUS_UPDATE,
      { payload: updatedAgents }
    );

    // Verifica che il messaggio sia riconosciuto dal type guard
    expect(isAgentsStatusUpdateMessage(updatedMessage)).toBe(true);

    // Simula la ricezione del messaggio
    simulateMessage(updatedMessage);

    // Verifica che lo stato dei toggle sia stato aggiornato
    await waitFor(() => {
      const updatedToggles = screen.getAllByRole('switch');
      expect(updatedToggles[0]).toHaveAttribute('aria-checked', 'false');
      expect(updatedToggles[1]).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('ignora i messaggi che non sono di tipo MAS', () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);

    // Stato iniziale
    const toggles = screen.getAllByRole('switch');
    expect(toggles[0]).toHaveAttribute('aria-checked', 'true');
    expect(toggles[1]).toHaveAttribute('aria-checked', 'false');

    // Invia un messaggio non pertinente
    simulateMessage({ 
      type: 'NON_MAS_MESSAGE',
      payload: {}
    });

    // Lo stato non dovrebbe cambiare
    const unchangedToggles = screen.getAllByRole('switch');
    expect(unchangedToggles[0]).toHaveAttribute('aria-checked', 'true');
    expect(unchangedToggles[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('mostra un messaggio quando non ci sono agenti disponibili', async () => {
    render(<AgentTogglePanel initialAgents={[]} />);

    // Dovrebbe mostrare un messaggio di stato vuoto
    expect(screen.getByText('Nessun agente disponibile')).toBeInTheDocument();
  });

  it('supporta la navigazione da tastiera per i toggle', async () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);

    const toggles = screen.getAllByRole('switch');
    toggles[1].focus();
    
    // Simula la pressione del tasto Enter
    fireEvent.keyDown(toggles[1], { key: 'Enter' });

    const expectedMessage: AgentToggleEnableMessage = {
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      payload: {
        agentId: 'agent-2',
        enabled: true
      }
    };

    expect(mockPostMessage).toHaveBeenCalledWith(expectedMessage);
  });

  it('utilizza il pattern Union Dispatcher Type-Safe con postMessage<T>', () => {
    render(<AgentTogglePanel initialAgents={mockAgents} />);

    const toggles = screen.getAllByRole('switch');
    fireEvent.click(toggles[0]); // Disattiva Agente 1

    // Verifica che venga usato postMessage<T> con il tipo corretto
    expect(mockPostMessage.mock.calls[0][0].type).toBe(MasMessageType.AGENT_TOGGLE_ENABLE);
  });

  it('gestisce correttamente messaggi AGENTS_STATUS_UPDATE duplicati', async () => {
    // Arrange: renderizza il componente
    render(<AgentTogglePanel initialAgents={mockAgents} />);
    
    // Verifica stato iniziale
    let toggles = screen.getAllByRole('switch');
    expect(toggles[0]).toHaveAttribute('aria-checked', 'true');
    expect(toggles[1]).toHaveAttribute('aria-checked', 'false');
    
    // Act: simula la ricezione di un primo messaggio di aggiornamento
    const firstUpdate = createTestMessage<AgentsStatusUpdateMessage>(
      MasMessageType.AGENTS_STATUS_UPDATE,
      { 
        payload: [
          { ...mockAgents[0], enabled: false },
          { ...mockAgents[1], enabled: true }
        ]
      }
    );
    
    simulateMessage(firstUpdate);
    
    // Assert: verifica che lo stato sia stato aggiornato
    await waitFor(() => {
      toggles = screen.getAllByRole('switch');
      expect(toggles[0]).toHaveAttribute('aria-checked', 'false');
      expect(toggles[1]).toHaveAttribute('aria-checked', 'true');
    });
    
    // Act: simula la ricezione di un messaggio identico (duplicato)
    simulateMessage(firstUpdate);
    
    // Act: simula la ricezione di un terzo messaggio con modifiche diverse
    const thirdUpdate = createTestMessage<AgentsStatusUpdateMessage>(
      MasMessageType.AGENTS_STATUS_UPDATE,
      { 
        payload: [
          { ...mockAgents[0], enabled: true },
          { ...mockAgents[1], enabled: false }
        ]
      }
    );
    
    simulateMessage(thirdUpdate);
    
    // Assert: verifica che lo stato sia stato aggiornato nuovamente
    await waitFor(() => {
      toggles = screen.getAllByRole('switch');
      expect(toggles[0]).toHaveAttribute('aria-checked', 'true');
      expect(toggles[1]).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('gestisce correttamente agenti con stato "locked" (disabilitando i toggle)', async () => {
    // Aggiungiamo l'attributo "locked" a un agente
    const agentsWithLocked = [
      { ...mockAgents[0], locked: true },
      mockAgents[1]
    ];
    
    render(<AgentTogglePanel initialAgents={agentsWithLocked} />);
    
    // Verifica che i toggle siano correttamente abilitati/disabilitati
    const toggles = screen.getAllByRole('switch');
    expect(toggles[0]).toHaveAttribute('aria-disabled', 'true');
    expect(toggles[1]).not.toHaveAttribute('aria-disabled', 'true');
    
    // Tenta di cliccare sul toggle disabilitato
    fireEvent.click(toggles[0]);
    
    // Verifica che non sia stato inviato alcun messaggio di toggle
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: MasMessageType.AGENT_TOGGLE_ENABLE,
        payload: expect.objectContaining({ agentId: 'agent-1' })
      })
    );
    
    // Verifica che sia possibile interagire con il toggle non bloccato
    fireEvent.click(toggles[1]);
    
    // Verifica che sia stato inviato il messaggio per l'agente non bloccato
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MasMessageType.AGENT_TOGGLE_ENABLE,
        payload: expect.objectContaining({ agentId: 'agent-2' })
      })
    );
  });
}); 

