/**
 * @file AgentManager.test.ts
 * @description Test per la classe AgentManager
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AgentManager } from '../AgentManager';
import { Agent, AgentContext, AgentOutput } from '../types';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  // Creazione di un agente di prova
  const createMockAgent = (id: string): Agent => {
    return {
      id,
      role: `ruolo-${id}`,
      description: `descrizione-${id}`,
      execute: vi.fn().mockResolvedValue({
        thought: 'pensiero di test',
        message: 'messaggio di test',
        context: {},
      } as AgentOutput),
      getSystemPrompt: vi.fn().mockReturnValue(`system prompt per ${id}`),
    };
  };

  describe('registerAgent', () => {
    it('dovrebbe registrare un agente correttamente', () => {
      const mockAgent = createMockAgent('test-agent');
      agentManager.registerAgent(mockAgent);
      
      const risultato = agentManager.getAgent('test-agent');
      expect(risultato).toBe(mockAgent);
    });

    it('dovrebbe sovrascrivere un agente esistente con lo stesso ID', () => {
      const mockAgent1 = createMockAgent('stesso-id');
      const mockAgent2 = createMockAgent('stesso-id');
      mockAgent2.description = 'descrizione aggiornata';
      
      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      
      const risultato = agentManager.getAgent('stesso-id');
      expect(risultato).toBe(mockAgent2);
      expect(risultato?.description).toBe('descrizione aggiornata');
    });

    it('dovrebbe lanciare un errore se si tenta di registrare un agente null o undefined', () => {
      // @ts-expect-error: Test con valore non valido
      expect(() => agentManager.registerAgent(null)).toThrow();
      // @ts-expect-error: Test con valore non valido
      expect(() => agentManager.registerAgent(undefined)).toThrow();
    });

    it('dovrebbe lanciare un errore se l\'agente non ha un ID valido', () => {
      const invalidAgent = createMockAgent('');
      expect(() => agentManager.registerAgent(invalidAgent)).toThrow();
    });
  });

  describe('getAgent', () => {
    it('dovrebbe restituire l\'agente corretto in base all\'ID', () => {
      const mockAgent1 = createMockAgent('agent1');
      const mockAgent2 = createMockAgent('agent2');
      
      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      
      expect(agentManager.getAgent('agent1')).toBe(mockAgent1);
      expect(agentManager.getAgent('agent2')).toBe(mockAgent2);
    });

    it('dovrebbe restituire undefined per un ID inesistente', () => {
      const risultato = agentManager.getAgent('non-esiste');
      expect(risultato).toBeUndefined();
    });
  });

  describe('getAllAgents', () => {
    it('dovrebbe restituire un array vuoto se non ci sono agenti', () => {
      const risultato = agentManager.getAllAgents();
      expect(risultato).toEqual([]);
    });

    it('dovrebbe restituire tutti gli agenti registrati', () => {
      const mockAgent1 = createMockAgent('agent1');
      const mockAgent2 = createMockAgent('agent2');
      const mockAgent3 = createMockAgent('agent3');
      
      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      agentManager.registerAgent(mockAgent3);
      
      const risultato = agentManager.getAllAgents();
      expect(risultato.length).toBe(3);
      expect(risultato).toContain(mockAgent1);
      expect(risultato).toContain(mockAgent2);
      expect(risultato).toContain(mockAgent3);
    });
  });

  describe('removeAgent', () => {
    it('dovrebbe rimuovere un agente esistente', () => {
      const mockAgent = createMockAgent('remove-test');
      agentManager.registerAgent(mockAgent);
      
      agentManager.removeAgent('remove-test');
      expect(agentManager.getAgent('remove-test')).toBeUndefined();
    });

    it('non dovrebbe generare errori quando si rimuove un agente inesistente', () => {
      expect(() => agentManager.removeAgent('non-esiste')).not.toThrow();
    });

    it('dovrebbe ridurre il numero di agenti registrati', () => {
      const mockAgent1 = createMockAgent('agent1');
      const mockAgent2 = createMockAgent('agent2');
      
      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      expect(agentManager.getAllAgents().length).toBe(2);
      
      agentManager.removeAgent('agent1');
      expect(agentManager.getAllAgents().length).toBe(1);
    });
  });

  describe('comportamento dell\'agente', () => {
    it('dovrebbe poter chiamare il metodo execute dell\'agente', async () => {
      const mockAgent = createMockAgent('exec-test');
      const mockContext: AgentContext = {
        query: 'query di test',
        history: [],
        memory: {},
      };
      
      agentManager.registerAgent(mockAgent);
      const agent = agentManager.getAgent('exec-test');
      
      const risultato = await agent?.execute(mockContext);
      expect(risultato).toEqual({
        thought: 'pensiero di test',
        message: 'messaggio di test',
        context: {},
      });
      expect(mockAgent.execute).toHaveBeenCalledWith(mockContext);
    });

    it('dovrebbe poter chiamare il metodo getSystemPrompt dell\'agente', () => {
      const mockAgent = createMockAgent('prompt-test');
      agentManager.registerAgent(mockAgent);
      
      const agent = agentManager.getAgent('prompt-test');
      const risultato = agent?.getSystemPrompt();
      
      expect(risultato).toBe('system prompt per prompt-test');
      expect(mockAgent.getSystemPrompt).toHaveBeenCalled();
    });
  });
}); 