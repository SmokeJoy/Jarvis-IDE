/**
 * @file AgentManager.test.ts
 * @description Test per la classe AgentManager
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AgentManager } from '../AgentManager';
import { Agent, AgentContext, AgentOutput, AgentRole } from '../types';

// Tipi per i mock
type MockAgent = Agent & {
  execute: ReturnType<typeof vi.fn>;
  getSystemPrompt: ReturnType<typeof vi.fn>;
};

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockAgent: MockAgent;

  beforeEach(() => {
    agentManager = new AgentManager();
    mockAgent = {
      id: 'test-agent',
      role: 'test-role' as AgentRole,
      description: 'Test agent',
      execute: vi.fn().mockResolvedValue({
        thought: 'test thought',
        message: 'test message',
        context: {},
      } as AgentOutput),
      getSystemPrompt: vi.fn().mockReturnValue('test system prompt'),
    };
  });

  describe('registerAgent', () => {
    it('dovrebbe registrare un agente correttamente', () => {
      agentManager.registerAgent(mockAgent);
      expect(agentManager.getAgent(mockAgent.role)).resolves.toBe(mockAgent);
    });

    it('dovrebbe sovrascrivere un agente esistente con lo stesso ruolo', async () => {
      const updatedAgent: MockAgent = {
        ...mockAgent,
        description: 'updated description',
      };

      agentManager.registerAgent(mockAgent);
      agentManager.registerAgent(updatedAgent);

      const result = await agentManager.getAgent(mockAgent.role);
      expect(result).toBe(updatedAgent);
      expect(result?.description).toBe('updated description');
    });

    it('dovrebbe lanciare un errore se si tenta di registrare un agente null o undefined', () => {
      // @ts-expect-error: Test con valore non valido
      expect(() => agentManager.registerAgent(null)).toThrow();
      // @ts-expect-error: Test con valore non valido
      expect(() => agentManager.registerAgent(undefined)).toThrow();
    });

    it("dovrebbe lanciare un errore se l'agente non ha un ruolo valido", () => {
      const invalidAgent = {
        ...mockAgent,
        role: '' as AgentRole,
      };
      expect(() => agentManager.registerAgent(invalidAgent)).toThrow();
    });
  });

  describe('getAgent', () => {
    it("dovrebbe restituire l'agente corretto in base al ruolo", async () => {
      const mockAgent1: MockAgent = {
        ...mockAgent,
        role: 'role1' as AgentRole,
      };
      const mockAgent2: MockAgent = {
        ...mockAgent,
        role: 'role2' as AgentRole,
      };

      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);

      expect(await agentManager.getAgent('role1' as AgentRole)).toBe(mockAgent1);
      expect(await agentManager.getAgent('role2' as AgentRole)).toBe(mockAgent2);
    });

    it('dovrebbe restituire null per un ruolo inesistente', async () => {
      const result = await agentManager.getAgent('non-existent' as AgentRole);
      expect(result).toBeNull();
    });
  });

  describe('getAllAgents', () => {
    it('dovrebbe restituire un array vuoto se non ci sono agenti', async () => {
      const result = await agentManager.getAllAgents();
      expect(result).toEqual([]);
    });

    it('dovrebbe restituire tutti gli agenti registrati', async () => {
      const mockAgent1: MockAgent = {
        ...mockAgent,
        role: 'role1' as AgentRole,
      };
      const mockAgent2: MockAgent = {
        ...mockAgent,
        role: 'role2' as AgentRole,
      };
      const mockAgent3: MockAgent = {
        ...mockAgent,
        role: 'role3' as AgentRole,
      };

      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      agentManager.registerAgent(mockAgent3);

      const result = await agentManager.getAllAgents();
      expect(result.length).toBe(3);
      expect(result).toContain(mockAgent1);
      expect(result).toContain(mockAgent2);
      expect(result).toContain(mockAgent3);
    });
  });

  describe('removeAgent', () => {
    it('dovrebbe rimuovere un agente esistente', async () => {
      agentManager.registerAgent(mockAgent);
      agentManager.removeAgent(mockAgent.role);
      expect(await agentManager.getAgent(mockAgent.role)).toBeNull();
    });

    it('non dovrebbe generare errori quando si rimuove un agente inesistente', () => {
      expect(() => agentManager.removeAgent('non-existent' as AgentRole)).not.toThrow();
    });

    it('dovrebbe ridurre il numero di agenti registrati', async () => {
      const mockAgent1: MockAgent = {
        ...mockAgent,
        role: 'role1' as AgentRole,
      };
      const mockAgent2: MockAgent = {
        ...mockAgent,
        role: 'role2' as AgentRole,
      };

      agentManager.registerAgent(mockAgent1);
      agentManager.registerAgent(mockAgent2);
      expect((await agentManager.getAllAgents()).length).toBe(2);

      agentManager.removeAgent('role1' as AgentRole);
      expect((await agentManager.getAllAgents()).length).toBe(1);
    });
  });

  describe("comportamento dell'agente", () => {
    it("dovrebbe poter chiamare il metodo execute dell'agente", async () => {
      const mockContext: AgentContext = {
        query: 'test query',
        history: [],
        memory: {},
      };

      agentManager.registerAgent(mockAgent);
      const agent = await agentManager.getAgent(mockAgent.role);

      const result = await agent?.execute(mockContext);
      expect(result).toEqual({
        thought: 'test thought',
        message: 'test message',
        context: {},
      });
      expect(mockAgent.execute).toHaveBeenCalledWith(mockContext);
    });

    it("dovrebbe poter chiamare il metodo getSystemPrompt dell'agente", async () => {
      agentManager.registerAgent(mockAgent);
      const agent = await agentManager.getAgent(mockAgent.role);

      const result = agent?.getSystemPrompt();
      expect(result).toBe('test system prompt');
      expect(mockAgent.getSystemPrompt).toHaveBeenCalled();
    });

    it("dovrebbe gestire correttamente gli errori durante l'esecuzione", async () => {
      const error = new Error('Test error');
      mockAgent.execute.mockRejectedValueOnce(error);

      agentManager.registerAgent(mockAgent);
      const agent = await agentManager.getAgent(mockAgent.role);

      await expect(agent?.execute({ query: 'test', history: [], memory: {} })).rejects.toThrow(
        'Test error'
      );
    });
  });
});
