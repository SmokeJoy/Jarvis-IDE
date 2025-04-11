/**
 * @file mas-dispatcher.toggle.test.ts
 * @description Test per la funzionalità AGENT_TOGGLE_ENABLE del MasDispatcher
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MasDispatcher } from '../mas-dispatcher';
import { MasMessageType } from '../../../types/mas-message';
import { createMockAgent, Agent } from './test-utils';

describe('MAS Dispatcher - Agent Toggle Enable', () => {
  let dispatcher: MasDispatcher;
  let mockMemoryManager: any;
  let testAgent1: Agent;
  let testAgent2: Agent;

  beforeEach(() => {
    // Mock del memory manager
    mockMemoryManager = {
      saveAgentState: vi.fn().mockResolvedValue(true),
      getAgentState: vi.fn().mockResolvedValue(null)
    };
    
    // Creazione del dispatcher con agenti di test
    dispatcher = new MasDispatcher({ memoryManager: mockMemoryManager as any });
    
    // Creazione degli agenti mock
    testAgent1 = createMockAgent('agent1', 'Test Agent 1');
    testAgent2 = createMockAgent('agent2', 'Test Agent 2');
    
    // Registrazione degli agenti
    dispatcher['agents'] = {
      agent1: testAgent1,
      agent2: testAgent2
    };
  });

  it('should toggle agent enabled state when valid agent id is provided', async () => {
    // Verifica dello stato iniziale
    expect(testAgent1.status.enabled).toBe(true);
    
    // Chiamata alla funzione di toggle con enabled=false
    await dispatcher.handleMessage({
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      agentId: 'agent1',
      enabled: false
    });
    
    // Verifica che l'agente sia stato disabilitato
    expect(testAgent1.setEnabled).toHaveBeenCalledWith(false);
    expect(testAgent1.status.enabled).toBe(false);
    
    // Verifica che lo stato sia stato salvato in memoria
    expect(mockMemoryManager.saveAgentState).toHaveBeenCalledWith('agent1', { enabled: false });
  });
  
  it('should toggle agent enabled state back to true', async () => {
    // Prima impostiamo lo stato a false
    testAgent1.status.enabled = false;
    
    // Chiamata alla funzione di toggle con enabled=true
    await dispatcher.handleMessage({
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      agentId: 'agent1',
      enabled: true
    });
    
    // Verifica che l'agente sia stato abilitato
    expect(testAgent1.setEnabled).toHaveBeenCalledWith(true);
    expect(testAgent1.status.enabled).toBe(true);
    
    // Verifica che lo stato sia stato salvato in memoria
    expect(mockMemoryManager.saveAgentState).toHaveBeenCalledWith('agent1', { enabled: true });
  });
  
  it('should not take action if agent does not exist', async () => {
    // Chiamata alla funzione di toggle con un agente inesistente
    await dispatcher.handleMessage({
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      agentId: 'non-existent',
      enabled: false
    });
    
    // Verifica che nessuna azione sia stata intrapresa
    expect(mockMemoryManager.saveAgentState).not.toHaveBeenCalled();
  });
  
  it('should restore agent enabled state from memory on initialization', async () => {
    // Mock dei dati presenti in memoria
    mockMemoryManager.getAgentState.mockResolvedValueOnce({ enabled: false });
    
    // Simuliamo l'inizializzazione dell'agente
    await dispatcher.initializeAgent('agent2');
    
    // Verifica che lo stato sia stato ripristinato dalla memoria
    expect(testAgent2.setEnabled).toHaveBeenCalledWith(false);
    expect(testAgent2.status.enabled).toBe(false);
  });
}); 