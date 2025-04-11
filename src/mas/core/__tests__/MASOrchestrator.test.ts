/**
 * @file MASOrchestrator.test.ts
 * @description Test E2E per l'orchestratore Multi-Agent System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MASOrchestrator } from '../MASOrchestrator';
import { AgentManager } from '../AgentManager';
import { MemoryManager } from '../MemoryManager';
import { Agent, AgentRole, AgentContext, AgentOutput } from '../types';
import { LLMProviderHandler } from '../../providers/provider-registry';
import { ZodSchemaMap } from '../../../utils/validation';
import { WebviewMessageUnion } from '../../../shared/types/webviewMessageUnion';

// Mock delle classi dipendenti
vi.mock('../AgentManager');
vi.mock('../MemoryManager');
vi.mock('../../providers/provider-registry', () => {
  return {
    LLMProviderHandler: vi.fn().mockImplementation(() => ({
      handle: vi.fn(),
      isEnabled: true
    })),
    registerDefaultProviders: vi.fn().mockReturnValue([
      {
        id: 'provider-1',
        name: 'Provider 1',
        handle: vi.fn(),
        isEnabled: true
      },
      {
        id: 'provider-2',
        name: 'Provider 2',
        handle: vi.fn(),
        isEnabled: true
      }
    ])
  };
});

// Definiamo alcuni tipi di base per i mock
interface ExecutionContext {
  query: string;
  history: AgentOutput[];
  memory: Record<string, any>;
  systemPrompt?: string;
}

// Funzione helper per creare oggetti agente mock
function createMockAgent(role: AgentRole, behavior: (context: AgentContext) => Promise<AgentOutput>): Agent {
  return {
    id: `agent-${role}`,
    role,
    description: `Mock agent for ${role}`,
    execute: vi.fn().mockImplementation(behavior),
    getSystemPrompt: vi.fn().mockReturnValue(`System prompt for ${role}`),
  };
}

describe('MASOrchestrator E2E', () => {
  let orchestrator: MASOrchestrator;
  let agentManager: AgentManager;
  let memoryManager: MemoryManager;
  let mockAgents: Record<AgentRole, Agent> = {} as Record<AgentRole, Agent>;
  
  // Setup dei mock prima di ogni test
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock per MemoryManager
    memoryManager = new MemoryManager();
    vi.mocked(memoryManager.get).mockImplementation((key: string) => {
      return Promise.resolve(mockMemory[key] || null);
    });
    vi.mocked(memoryManager.set).mockImplementation((key: string, value: any) => {
      mockMemory[key] = value;
      return Promise.resolve();
    });
    vi.mocked(memoryManager.append).mockImplementation((key: string, value: any) => {
      if (!mockMemory[key]) mockMemory[key] = [];
      mockMemory[key].push(value);
      return Promise.resolve();
    });
    
    // Mock per AgentManager
    agentManager = new AgentManager();
    vi.mocked(agentManager.getAgent).mockImplementation((role: AgentRole) => {
      return Promise.resolve(mockAgents[role] || null);
    });
    vi.mocked(agentManager.getAllAgents).mockImplementation(() => {
      return Promise.resolve(Object.values(mockAgents));
    });
    
    // Creazione dei mock agent con comportamenti specifici
    mockAgents = {
      'planner': createMockAgent('planner', async (context) => {
        return {
          thought: "Devo pianificare i passaggi per rispondere alla query",
          message: "Ecco il piano: 1. Ricerca, 2. Analisi, 3. Risposta",
          nextAgent: 'researcher',
          context: {
            ...context,
            plan: ["ricerca", "analisi", "risposta"]
          }
        };
      }),
      
      'researcher': createMockAgent('researcher', async (context) => {
        return {
          thought: "Sto facendo ricerche sull'argomento",
          message: "Ho trovato diverse informazioni importanti",
          nextAgent: 'analyzer',
          context: {
            ...context,
            research: "Dati di ricerca simulati"
          }
        };
      }),
      
      'analyzer': createMockAgent('analyzer', async (context) => {
        return {
          thought: "Analizzo i dati di ricerca",
          message: "Dall'analisi emerge che...",
          nextAgent: 'writer',
          context: {
            ...context,
            analysis: "Risultati dell'analisi"
          }
        };
      }),
      
      'writer': createMockAgent('writer', async (context) => {
        return {
          thought: "Sto componendo la risposta finale",
          message: "Ecco la risposta completa alla query",
          nextAgent: null, // Termina la catena
          context: {
            ...context,
            finalAnswer: "Risposta finale alla query"
          }
        };
      }),
      
      'critic': createMockAgent('critic', async (context) => {
        return {
          thought: "Valuto la qualità della risposta",
          message: "La risposta è accurata e completa",
          nextAgent: null,
          context: {
            ...context,
            evaluation: "Valutazione positiva"
          }
        };
      })
    };
    
    // Inizializzazione dell'orchestratore
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 2,
      startingAgent: 'planner'
    });
  });
  
  // Stato simulato per MemoryManager
  let mockMemory: Record<string, any> = {};
  
  afterEach(() => {
    // Reset dello stato della memoria
    mockMemory = {};
  });
  
  // Test principale: esecuzione completa del flusso
  it('Dovrebbe orchestrare una sequenza completa di agenti', async () => {
    // Input iniziale
    const query = "Come funziona un sistema multi-agente?";
    
    // Esecuzione dell'orchestratore
    const result = await orchestrator.run({
      query,
      conversationId: 'test-conversation',
      maxTurns: 10
    });
    
    // Verifica che tutti gli agenti siano stati chiamati nella sequenza corretta
    expect(mockAgents.planner.execute).toHaveBeenCalledTimes(1);
    expect(mockAgents.researcher.execute).toHaveBeenCalledTimes(1);
    expect(mockAgents.analyzer.execute).toHaveBeenCalledTimes(1);
    expect(mockAgents.writer.execute).toHaveBeenCalledTimes(1);
    
    // Verifica l'ordine delle chiamate
    const executionOrder = [
      vi.mocked(mockAgents.planner.execute).mock.invocationCallOrder[0],
      vi.mocked(mockAgents.researcher.execute).mock.invocationCallOrder[0],
      vi.mocked(mockAgents.analyzer.execute).mock.invocationCallOrder[0],
      vi.mocked(mockAgents.writer.execute).mock.invocationCallOrder[0],
    ];
    
    expect(executionOrder).toEqual([...executionOrder].sort((a, b) => a - b));
    
    // Verifica che il risultato finale sia corretto
    expect(result).toBeDefined();
    expect(result.finalAnswer).toBe("Risposta finale alla query");
    
    // Verifica che la memoria sia stata aggiornata correttamente
    expect(memoryManager.set).toHaveBeenCalledTimes(expect.any(Number));
    expect(mockMemory).toHaveProperty('test-conversation');
  });
  
  // Test di gestione degli errori
  it('Dovrebbe gestire errori negli agenti e passare al fallback', async () => {
    // Modifica temporanea del comportamento dell'agente researcher per simulare un errore
    mockAgents.researcher.execute = vi.fn().mockRejectedValueOnce(new Error('Errore simulato'));
    
    // Input iniziale
    const query = "Query che causerà un errore";
    
    // Esecuzione dell'orchestratore con fallback configurato
    const result = await orchestrator.run({
      query,
      conversationId: 'test-error',
      maxTurns: 10,
      fallbackAgent: 'critic' // Agente da chiamare in caso di errore
    });
    
    // Verifica che l'agente planner sia stato chiamato
    expect(mockAgents.planner.execute).toHaveBeenCalledTimes(1);
    
    // Verifica che ci sia stato un tentativo di chiamare l'agente researcher
    expect(mockAgents.researcher.execute).toHaveBeenCalledTimes(1);
    
    // Verifica che l'agente di fallback (critic) sia stato chiamato
    expect(mockAgents.critic.execute).toHaveBeenCalledTimes(1);
    
    // Verifica che l'errore sia stato gestito e sia stato registrato nella memoria
    expect(memoryManager.set).toHaveBeenCalledWith(
      expect.stringContaining('test-error'),
      expect.objectContaining({
        error: expect.anything()
      })
    );
  });
  
  // Test del limite di turni
  it('Dovrebbe rispettare il limite massimo di turni', async () => {
    // Modifica temporanea del comportamento dell'agente writer per creare un ciclo
    mockAgents.writer.execute = vi.fn().mockImplementation(async (context) => {
      return {
        thought: "Sto componendo la risposta ma ho bisogno di più ricerche",
        message: "Ho bisogno di più dati",
        nextAgent: 'researcher', // Crea un ciclo
        context
      };
    });
    
    // Input iniziale
    const query = "Query che causerà un ciclo";
    
    // Esecuzione dell'orchestratore con limite di turni
    await orchestrator.run({
      query,
      conversationId: 'test-cycle',
      maxTurns: 5 // Limite massimo di 5 turni
    });
    
    // Calcolo totale delle chiamate agli agenti
    const totalCalls = Object.values(mockAgents).reduce(
      (sum, agent) => sum + vi.mocked(agent.execute).mock.calls.length,
      0
    );
    
    // Verifica che il numero totale di chiamate non superi il limite + 1 (per l'ultimo tentativo)
    expect(totalCalls).toBeLessThanOrEqual(6); // maxTurns + 1
    
    // Verifica che il ciclo sia stato rilevato e registrato
    expect(memoryManager.set).toHaveBeenCalledWith(
      expect.stringContaining('test-cycle'),
      expect.objectContaining({
        cycleDetected: true
      })
    );
  });
  
  // Test dell'esecuzione parallela
  it("Dovrebbe supportare l'esecuzione parallela fino a maxConcurrentAgents", async () => {
    // Reset dei mock
    vi.clearAllMocks();
    
    // Modifica temporanea dell'orchestratore per supportare esecuzione parallela
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 2,
      parallelExecution: true // Abilita esecuzione parallela
    });
    
    // Creazione di agenti con ritardi diversi
    const slowAgent = createMockAgent('slow', async (context) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        thought: "Agente lento",
        message: "Risposta lenta",
        nextAgent: null,
        context
      };
    });
    
    const fastAgent = createMockAgent('fast', async (context) => {
      return {
        thought: "Agente veloce",
        message: "Risposta veloce",
        nextAgent: null,
        context
      };
    });
    
    // Aggiunta degli agenti al manager
    mockAgents.slow = slowAgent;
    mockAgents.fast = fastAgent;
    
    // Configurazione dei task paralleli
    const tasks = [
      { agentRole: 'slow', taskId: 'task1', input: { query: "Task lento" } },
      { agentRole: 'fast', taskId: 'task2', input: { query: "Task veloce" } }
    ];
    
    // Esecuzione parallela
    const startTime = Date.now();
    await orchestrator.executeParallel(tasks);
    const endTime = Date.now();
    
    // Verifica che entrambi gli agenti siano stati chiamati
    expect(slowAgent.execute).toHaveBeenCalledTimes(1);
    expect(fastAgent.execute).toHaveBeenCalledTimes(1);
    
    // Verifica che l'esecuzione totale sia stata più veloce della somma (indicando esecuzione parallela)
    // L'agente lento impiega 50ms, quindi se fosse sequenziale ci vorrebbe almeno 50ms
    // Con esecuzione parallela, il tempo totale dovrebbe essere vicino a 50ms (il più lento)
    expect(endTime - startTime).toBeLessThan(100); // Diamo un po' di margine
  });
  
  // Test di integrazione con la memoria
  it('Dovrebbe mantenere e utilizzare la memoria condivisa tra gli agenti', async () => {
    // Simulazione di memoria preesistente
    mockMemory['test-memory'] = {
      history: [],
      sharedContext: {
        knowledgeBase: "Conoscenze precedenti"
      }
    };
    
    // Input iniziale
    const query = "Domanda che richiede conoscenze precedenti";
    
    // Esecuzione dell'orchestratore
    await orchestrator.run({
      query,
      conversationId: 'test-memory',
      maxTurns: 10
    });
    
    // Verifica che la memoria iniziale sia stata passata al primo agente
    expect(mockAgents.planner.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        memory: expect.objectContaining({
          sharedContext: expect.objectContaining({
            knowledgeBase: "Conoscenze precedenti"
          })
        })
      })
    );
    
    // Verifica che la memoria sia stata aggiornata con i risultati di ogni agente
    expect(mockMemory['test-memory']).toHaveProperty('research');
    expect(mockMemory['test-memory']).toHaveProperty('analysis');
    expect(mockMemory['test-memory']).toHaveProperty('finalAnswer');
  });

  // Test per verificare il meccanismo di fallback tra provider LLM
  it('Dovrebbe utilizzare il fallback dei provider LLM quando necessario', async () => {
    // Mock di messaggio webview per testare la funzione executeAgentStrategy
    const mockMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'Test prompt' },
      type: 'agent-execute'
    } as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn()
    };

    // Configura il primo provider per fallire
    const providers = (orchestrator as any).providers;
    vi.mocked(providers[0].handle).mockRejectedValueOnce(new Error('Provider fallito'));
    vi.mocked(providers[1].handle).mockResolvedValueOnce({ result: 'Risposta dal provider di backup' });

    // Esecuzione della strategia con il provider che fallirà
    await orchestrator.executeAgentStrategy(mockMessage, mockSchema);

    // Verifica che il primo provider sia stato chiamato
    expect(providers[0].handle).toHaveBeenCalledTimes(1);
    
    // Verifica che si sia fatto fallback sul secondo provider
    expect(providers[1].handle).toHaveBeenCalledTimes(1);
    
    // Verifica che il provider di successo sia stato registrato per uso futuro
    expect((orchestrator as any).fallbackHandler.lastSuccessfulProvider).toBe(providers[1]);
  });

  // Test per verificare il comportamento quando tutti i provider falliscono
  it('Dovrebbe gestire il caso in cui tutti i provider falliscono', async () => {
    // Mock di messaggio webview
    const mockMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'Test prompt' },
      type: 'agent-execute'
    } as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn()
    };

    // Configura tutti i provider per fallire
    const providers = (orchestrator as any).providers;
    providers.forEach((provider: any) => {
      vi.mocked(provider.handle).mockRejectedValue(new Error('Provider fallito'));
    });

    // L'esecuzione della strategia dovrebbe lanciare un errore
    await expect(orchestrator.executeAgentStrategy(mockMessage, mockSchema))
      .rejects
      .toThrow('Provider fallito');

    // Verifica che tutti i provider siano stati tentati
    expect(providers[0].handle).toHaveBeenCalledTimes(1);
    
    // Il registro dell'interazione dovrebbe contenere l'errore
    expect(memoryManager.append).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        error: expect.anything()
      })
    );
  });

  // Test per verificare la priorità di utilizzo dell'ultimo provider di successo
  it('Dovrebbe preferire l\'ultimo provider che ha avuto successo', async () => {
    // Mock di messaggio webview
    const mockMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'Test prompt' },
      type: 'agent-execute'
    } as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn()
    };

    // Configura i provider
    const providers = (orchestrator as any).providers;
    
    // Prima esecuzione: successo con il secondo provider
    vi.mocked(providers[0].handle).mockRejectedValueOnce(new Error('Provider fallito'));
    vi.mocked(providers[1].handle).mockResolvedValueOnce({ result: 'Risposta dal provider 2' });
    
    await orchestrator.executeAgentStrategy(mockMessage, mockSchema);
    
    // Reset dei mock per la seconda esecuzione
    vi.clearAllMocks();
    
    // Seconda esecuzione: dovrebbe usare direttamente il secondo provider
    vi.mocked(providers[1].handle).mockResolvedValueOnce({ result: 'Risposta dal provider 2 di nuovo' });
    
    await orchestrator.executeAgentStrategy(mockMessage, mockSchema);
    
    // Verifica che il primo provider non sia stato chiamato nella seconda esecuzione
    expect(providers[0].handle).not.toHaveBeenCalled();
    
    // Verifica che il secondo provider sia stato chiamato direttamente
    expect(providers[1].handle).toHaveBeenCalledTimes(1);
  });

  // Test per la validazione dei messaggi
  it('Dovrebbe validare correttamente i messaggi in ingresso', async () => {
    // Mock di messaggio webview invalido
    const invalidMessage = {
      agentId: 'test-agent',
      payload: { invalidField: 'Test data' },
      type: 'unknown-type'
    } as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn()
    };

    // L'esecuzione con un messaggio invalido dovrebbe lanciare un errore
    await expect(orchestrator.executeAgentStrategy(invalidMessage, mockSchema))
      .rejects
      .toThrow('Invalid message type');
  });

  // Test per verifica di prestazioni con molti agenti
  it('Dovrebbe scalare correttamente con un numero elevato di agenti', async () => {
    // Crea un gran numero di agenti mock per test di performance
    const numAgents = 20;
    const taskPromises = [];
    
    for (let i = 0; i < numAgents; i++) {
      const role = `agent-${i}` as AgentRole;
      mockAgents[role] = createMockAgent(role, async (context) => {
        return {
          thought: `Pensiero dell'agente ${i}`,
          message: `Risposta dell'agente ${i}`,
          nextAgent: null,
          context
        };
      });
      
      taskPromises.push({
        agentRole: role,
        taskId: `task-${i}`,
        input: { query: `Query per l'agente ${i}` }
      });
    }
    
    // Configura l'orchestratore per massima concorrenza
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 10, // Permetti fino a 10 agenti concorrenti
      parallelExecution: true
    });
    
    // Misura il tempo di esecuzione
    const startTime = Date.now();
    await orchestrator.executeParallel(taskPromises);
    const endTime = Date.now();
    
    // Verifica che ogni agente sia stato chiamato una sola volta
    for (let i = 0; i < numAgents; i++) {
      const role = `agent-${i}` as AgentRole;
      expect(mockAgents[role].execute).toHaveBeenCalledTimes(1);
    }
    
    // Calcola il tempo di esecuzione medio per agente
    const totalTime = endTime - startTime;
    const avgTimePerAgent = totalTime / numAgents;
    
    // Verifica che il tempo medio sia ragionevole (meno di 5ms per agente in questo test)
    expect(avgTimePerAgent).toBeLessThan(5);
    
    // Verifica che la memoria contenga tutti i risultati
    for (let i = 0; i < numAgents; i++) {
      expect(memoryManager.set).toHaveBeenCalledWith(
        expect.stringContaining(`task-${i}`),
        expect.anything()
      );
    }
  });
}); 