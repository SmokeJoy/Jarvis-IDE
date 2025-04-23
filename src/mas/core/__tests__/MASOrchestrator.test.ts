import { vi } from 'vitest';
import { z } from 'zod';
/**
 * @file MASOrchestrator.test.ts
 * @description Test E2E per l'orchestratore Multi-Agent System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MASOrchestrator } from '../MASOrchestrator';
import { AgentManager } from '../AgentManager';
import { MemoryManager } from '../MemoryManager';
import { Agent, AgentRole, AgentContext, AgentOutput } from '../types';
import { LLMProviderHandler } from '../../providers/provider-registry-stub';
import { ZodSchemaMap } from '../../../utils/validation';
import { WebviewMessageUnion } from '../../../shared/types/webviewMessageUnion';
import { getMemoryUsage, measureExecutionTime } from '../../../test/helpers/perf';

// Mock delle classi dipendenti
vi.mock('../AgentManager');
vi.mock('../MemoryManager');
vi.mock('../../providers/provider-registry-stub', () => {
  return {
    LLMProviderHandler: vi.fn().mockImplementation(() => ({
      handle: vi.fn(),
      isEnabled: true,
    })),
    registerDefaultProviders: vi.fn().mockReturnValue([
      {
        id: 'provider-1',
        name: 'Provider 1',
        handle: vi
          .fn()
          .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider 1' })),
        isEnabled: true,
      },
      {
        id: 'provider-2',
        name: 'Provider 2',
        handle: vi
          .fn()
          .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider 2' })),
        isEnabled: true,
      },
    ]),
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
function createMockAgent(
  role: AgentRole,
  behavior: (context: AgentContext) => Promise<AgentOutput>
): Agent {
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
      planner: createMockAgent('planner', async (context) => {
        return {
          thought: 'Devo pianificare i passaggi per rispondere alla query',
          message: 'Ecco il piano: 1. Ricerca, 2. Analisi, 3. Risposta',
          nextAgent: 'researcher',
          context: {
            ...context,
            plan: ['ricerca', 'analisi', 'risposta'],
          },
        };
      }),

      researcher: createMockAgent('researcher', async (context) => {
        return {
          thought: "Sto facendo ricerche sull'argomento",
          message: 'Ho trovato diverse informazioni importanti',
          nextAgent: 'analyzer',
          context: {
            ...context,
            research: 'Dati di ricerca simulati',
          },
        };
      }),

      analyzer: createMockAgent('analyzer', async (context) => {
        return {
          thought: 'Analizzo i dati di ricerca',
          message: "Dall'analisi emerge che...",
          nextAgent: 'writer',
          context: {
            ...context,
            analysis: "Risultati dell'analisi",
          },
        };
      }),

      writer: createMockAgent('writer', async (context) => {
        return {
          thought: 'Sto componendo la risposta finale',
          message: 'Ecco la risposta completa alla query',
          nextAgent: null, // Termina la catena
          context: {
            ...context,
            finalAnswer: 'Risposta finale alla query',
          },
        };
      }),

      critic: createMockAgent('critic', async (context) => {
        return {
          thought: 'Valuto la qualità della risposta',
          message: 'La risposta è accurata e completa',
          nextAgent: null,
          context: {
            ...context,
            evaluation: 'Valutazione positiva',
          },
        };
      }),
    };

    // Inizializzazione dell'orchestratore
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 2,
      startingAgent: 'planner',
    });

    // Configurazione dei provider LLM per i test
    const providers = [
      {
        id: 'provider-1',
        name: 'Provider 1',
        handle: vi
          .fn()
          .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider 1' })),
        isEnabled: true,
      },
      {
        id: 'provider-2',
        name: 'Provider 2',
        handle: vi
          .fn()
          .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider 2' })),
        isEnabled: true,
      },
    ];

    // Assegna i provider all'orchestratore tramite il fallbackHandler
    (orchestrator as any).providers = providers;
    (orchestrator as any).fallbackHandler = {
      lastSuccessfulProvider: null,
      executeWithFallback: async (callback: (provider: any) => Promise<any>) => {
        // Prova con tutti i provider disponibili
        for (const provider of providers) {
          if (!provider.isEnabled) continue;

          try {
            const result = await callback(provider);
            // Aggiorna l'ultimo provider che ha avuto successo
            (orchestrator as any).fallbackHandler.lastSuccessfulProvider = provider;
            return result;
          } catch (error) {
            console.error(`Errore con provider ${provider.id}:`, error);
            // Continua con il provider successivo
          }
        }
        throw new Error('Tutti i provider hanno fallito');
      },
    };
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
    const query = 'Come funziona un sistema multi-agente?';

    // Esecuzione dell'orchestratore
    const result = await orchestrator.run({
      query,
      conversationId: 'test-conversation',
      maxTurns: 10,
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
    expect(result.finalAnswer).toBe('Risposta finale alla query');

    // Verifica che la memoria sia stata aggiornata
    expect(memoryManager.set).toHaveBeenCalled();
  });

  // Test di gestione degli errori
  it('Dovrebbe gestire errori negli agenti e passare al fallback', async () => {
    // Modifica temporanea del comportamento dell'agente researcher per simulare un errore
    mockAgents.researcher.execute = vi.fn().mockRejectedValueOnce(new Error('Errore simulato'));

    // Input iniziale
    const query = 'Query che causerà un errore';

    // Esecuzione dell'orchestratore con fallback configurato
    const result = await orchestrator.run({
      query,
      conversationId: 'test-error',
      maxTurns: 10,
      fallbackAgent: 'critic', // Agente da chiamare in caso di errore
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
        error: expect.anything(),
      })
    );
  });

  // Test del limite di turni
  it('Dovrebbe rispettare il limite massimo di turni', async () => {
    // Modifica temporanea del comportamento dell'agente writer per creare un ciclo
    mockAgents.writer.execute = vi.fn().mockImplementation(async (context) => {
      return {
        thought: 'Sto componendo la risposta ma ho bisogno di più ricerche',
        message: 'Ho bisogno di più dati',
        nextAgent: 'researcher', // Crea un ciclo
        context,
      };
    });

    // Input iniziale
    const query = 'Query che causerà un ciclo';

    // Esecuzione dell'orchestratore con limite di turni
    await orchestrator.run({
      query,
      conversationId: 'test-cycle',
      maxTurns: 5, // Limite massimo di 5 turni
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
        cycleDetected: true,
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
      parallelExecution: true, // Abilita esecuzione parallela
    });

    // Creazione di agenti con ritardi diversi
    const slowAgent = createMockAgent('slow', async (context) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        thought: 'Agente lento',
        message: 'Risposta lenta',
        nextAgent: null,
        context,
      };
    });

    const fastAgent = createMockAgent('fast', async (context) => {
      return {
        thought: 'Agente veloce',
        message: 'Risposta veloce',
        nextAgent: null,
        context,
      };
    });

    // Aggiunta degli agenti al manager
    mockAgents.slow = slowAgent;
    mockAgents.fast = fastAgent;

    // Configurazione dei task paralleli
    const tasks = [
      { agentRole: 'slow', taskId: 'task1', input: { query: 'Task lento' } },
      { agentRole: 'fast', taskId: 'task2', input: { query: 'Task veloce' } },
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
      memory: {
        knowledgeBase: 'Conoscenze precedenti',
      },
      performance: {},
      query: '',
    };

    // Input iniziale
    const query = 'Domanda che richiede conoscenze precedenti';

    // Esecuzione dell'orchestratore
    await orchestrator.run({
      query,
      conversationId: 'test-memory',
      maxTurns: 10,
    });

    // Verifica che la memoria iniziale sia stata passata al primo agente
    expect(mockAgents.planner.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        query,
        memory: expect.any(Object),
      })
    );

    // Verifica che la memoria sia stata aggiornata dopo l'esecuzione
    expect(memoryManager.set).toHaveBeenCalled();
    expect(mockMemory).toHaveProperty('test-memory');
  });

  // Test per verificare il meccanismo di fallback tra provider LLM
  it('Dovrebbe utilizzare il fallback dei provider LLM quando necessario', async () => {
    // Mock di messaggio webview per testare la funzione executeAgentStrategy
    const mockMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'Test prompt' },
      type: 'agent-execute',
    } as unknown as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn(),
    };

    // Configura il primo provider per fallire
    const providers = (orchestrator as any).providers;
    const mockError = new Error('Provider fallito');
    providers[0].handle = vi.fn().mockImplementation(() => Promise.reject(mockError));
    providers[1].handle = vi
      .fn()
      .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider di backup' }));

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
      type: 'agent-execute',
    } as unknown as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn(),
    };

    // Configura tutti i provider per fallire
    const providers = (orchestrator as any).providers;
    const mockError = new Error('Provider fallito');
    providers.forEach((provider: any) => {
      provider.handle = vi.fn().mockImplementation(() => Promise.reject(mockError));
    });

    // L'esecuzione della strategia dovrebbe lanciare un errore
    await expect(orchestrator.executeAgentStrategy(mockMessage, mockSchema)).rejects.toThrow(
      'Tutti i provider hanno fallito'
    );

    // Verifica che tutti i provider siano stati tentati
    expect(providers[0].handle).toHaveBeenCalledTimes(1);
    expect(providers[1].handle).toHaveBeenCalledTimes(1);
  });

  // Test per verificare la priorità di utilizzo dell'ultimo provider di successo
  it("Dovrebbe preferire l'ultimo provider che ha avuto successo", async () => {
    // Mock di messaggio webview
    const mockMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'Test prompt' },
      type: 'agent-execute',
    } as unknown as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn(),
    };

    // Configura i provider per la prima esecuzione
    const providers = [
      {
        id: 'provider-1',
        name: 'Provider 1',
        handle: vi.fn().mockImplementation(() => Promise.reject(new Error('Provider fallito'))),
        isEnabled: true,
      },
      {
        id: 'provider-2',
        name: 'Provider 2',
        handle: vi
          .fn()
          .mockImplementation(() => Promise.resolve({ result: 'Risposta dal provider 2' })),
        isEnabled: true,
      },
    ];

    // Sostituisci i provider nell'orchestratore
    (orchestrator as any).providers = providers;

    // Crea un nuovo fallbackHandler con questi provider
    (orchestrator as any).fallbackHandler = {
      lastSuccessfulProvider: null,
      executeWithFallback: async (callback: (provider: any) => Promise<any>) => {
        // Se c'è un provider preferito, prova prima quello
        if ((orchestrator as any).fallbackHandler.lastSuccessfulProvider) {
          try {
            const result = await callback(
              (orchestrator as any).fallbackHandler.lastSuccessfulProvider
            );
            return result;
          } catch (error) {
            // Continua con il fallback
          }
        }

        // Prova con tutti i provider disponibili
        for (const provider of providers) {
          if (!provider.isEnabled) continue;

          try {
            const result = await callback(provider);
            // Aggiorna l'ultimo provider che ha avuto successo
            (orchestrator as any).fallbackHandler.lastSuccessfulProvider = provider;
            return result;
          } catch (error) {
            // Continua con il provider successivo
          }
        }
        throw new Error('Tutti i provider hanno fallito');
      },
    };

    // Prima esecuzione: il primo provider fallisce, il secondo ha successo
    await orchestrator.executeAgentStrategy(mockMessage, mockSchema);

    // Verifica che il primo provider sia stato chiamato
    expect(providers[0].handle).toHaveBeenCalledTimes(1);

    // Verifica che l'ultimo provider di successo sia stato registrato
    expect((orchestrator as any).fallbackHandler.lastSuccessfulProvider).toBe(providers[1]);

    // Reset dei mock per la seconda esecuzione
    providers[0].handle.mockClear();
    providers[1].handle.mockClear();

    // Seconda esecuzione: dovrebbe usare direttamente il secondo provider (l'ultimo che ha avuto successo)
    await orchestrator.executeAgentStrategy(mockMessage, mockSchema);

    // Verifica che il primo provider non sia stato chiamato
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
      type: 'unknown-type',
    } as unknown as WebviewMessageUnion;

    const mockSchema: ZodSchemaMap = {
      'agent-execute': vi.fn(),
    };

    // L'esecuzione con un messaggio invalido dovrebbe lanciare un errore
    await expect(orchestrator.executeAgentStrategy(invalidMessage, mockSchema)).rejects.toThrow(
      'Invalid message type'
    );
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
          context,
        };
      });

      taskPromises.push({
        agentRole: role,
        taskId: `task-${i}`,
        input: { query: `Query per l'agente ${i}` },
      });
    }

    // Configura l'orchestratore per massima concorrenza
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 10, // Permetti fino a 10 agenti concorrenti
      parallelExecution: true,
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

  // ----------- NUOVI TEST DI PROFILING DELLE PRESTAZIONI -----------

  // Test per misurare il tempo di esecuzione di ogni agente
  it('Dovrebbe registrare il tempo di esecuzione di ogni agente', async () => {
    // Sovrascriviamo i metodi execute degli agenti per registrare i tempi
    const agentPerformance: Record<string, number> = {};

    // Mock degli agent.execute per misurare il tempo
    Object.entries(mockAgents).forEach(([role, agent]) => {
      const originalExecute = agent.execute;
      agent.execute = vi.fn().mockImplementation(async (context) => {
        const start = performance.now();
        const result = await originalExecute(context);
        const duration = performance.now() - start;

        // Salva il tempo di esecuzione
        agentPerformance[role] = duration;

        // Aggiungi informazioni di performance al contesto
        return {
          ...result,
          context: {
            ...result.context,
            performance: {
              ...(result.context.performance || {}),
              [role]: duration,
            },
          },
        };
      });
    });

    // Input iniziale
    const query = 'Test delle performance degli agenti';

    // Esecuzione dell'orchestratore
    const result = await orchestrator.run({
      query,
      conversationId: 'test-performance',
      maxTurns: 10,
    });

    // Verifica che tutti gli agenti abbiano un tempo di esecuzione registrato
    expect(Object.keys(agentPerformance)).toContain('planner');
    expect(Object.keys(agentPerformance)).toContain('researcher');
    expect(Object.keys(agentPerformance)).toContain('analyzer');
    expect(Object.keys(agentPerformance)).toContain('writer');

    // Verifica che i tempi siano numerici
    Object.values(agentPerformance).forEach((time) => {
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThanOrEqual(0);
    });

    // Verifica che le informazioni di performance siano presenti nel contesto finale
    expect(result).toHaveProperty('performance');
    expect(result.performance).toHaveProperty('planner');
    expect(result.performance).toHaveProperty('researcher');
    expect(result.performance).toHaveProperty('analyzer');
    expect(result.performance).toHaveProperty('writer');

    // Log dei tempi di esecuzione per debugging
    console.log('Tempi di esecuzione per agente (ms):', agentPerformance);
  });

  // Test per verificare il memory footprint durante l'esecuzione
  it('Dovrebbe mantenere un footprint di memoria controllato durante più turni', async () => {
    // Array per registrare l'utilizzo della memoria
    const memoryProfile: number[] = [];

    // Input iniziale
    const baseQuery = 'Test del footprint di memoria turno';

    // Registra la memoria iniziale
    memoryProfile.push(getMemoryUsage());

    // Esegui 3 turni consecutivi
    for (let i = 0; i < 3; i++) {
      await orchestrator.run({
        query: `${baseQuery} ${i + 1}`,
        conversationId: `test-memory-footprint-${i}`,
        maxTurns: 3,
      });

      // Registra la memoria dopo ogni turno
      memoryProfile.push(getMemoryUsage());
    }

    // Verifica che ci siano 4 misurazioni (iniziale + 3 turni)
    expect(memoryProfile.length).toBe(4);

    // Log dell'utilizzo della memoria
    console.log('Utilizzo memoria per turno (bytes):', memoryProfile);

    // Calcola la crescita di memoria tra il primo e l'ultimo turno
    const memoryGrowth = memoryProfile[3] - memoryProfile[0];

    // La crescita di memoria dovrebbe essere ragionevole (meno di 500KB per turno)
    expect(memoryGrowth).toBeLessThan(500_000 * 3);

    // La crescita di memoria non dovrebbe essere eccessiva ad ogni turno
    for (let i = 1; i < memoryProfile.length; i++) {
      const growthPerTurn = memoryProfile[i] - memoryProfile[i - 1];
      expect(growthPerTurn).toBeLessThan(500_000);
    }
  });

  // Test per simulare sessioni parallele e verificare l'isolamento della memoria
  it('Dovrebbe mantenere i dati di sessione isolati in esecuzioni parallele', async () => {
    // Configura l'orchestratore per supportare esecuzione parallela
    orchestrator = new MASOrchestrator({
      agentManager,
      memoryManager,
      maxConcurrentAgents: 3,
      parallelExecution: true,
    });

    // Esegui tre sessioni parallelamente
    const sessionIds = ['session-A', 'session-B', 'session-C'];
    const query = 'Test di isolamento delle sessioni';

    // Esegui le sessioni in parallelo
    await Promise.all(
      sessionIds.map((id, index) =>
        orchestrator.run({
          query: `${query} per ${id}`,
          conversationId: id,
          maxTurns: 10,
        })
      )
    );

    // Verifica che ogni sessione abbia i suoi dati in memoria
    for (const id of sessionIds) {
      expect(mockMemory).toHaveProperty(id);
    }

    // Verifica che i dati delle sessioni siano diversi tra loro
    expect(mockMemory['session-A']).not.toEqual(mockMemory['session-B']);
    expect(mockMemory['session-A']).not.toEqual(mockMemory['session-C']);
    expect(mockMemory['session-B']).not.toEqual(mockMemory['session-C']);

    // Verifica che ogni sessione abbia il proprio contesto di esecuzione
    const uniqueValues = new Set();
    for (const id of sessionIds) {
      // Usa una proprietà specifica per il confronto (query è diversa per ogni sessione)
      const queryValue = mockMemory[id].query;
      expect(queryValue).toContain(id); // Il query contiene l'ID della sessione
      uniqueValues.add(queryValue);
    }

    // Verifica che ci siano effettivamente 3 valori unici
    expect(uniqueValues.size).toBe(3);
  });

  // ----------- NUOVI TEST PER AUMENTARE LA COPERTURA -----------

  // Test per verificare la gestione dei cicli tra agenti
  it('Dovrebbe rilevare e gestire i cicli tra agenti', async () => {
    // Modifica temporanea dell'agente analyzer per creare un ciclo verso planner
    mockAgents.analyzer.execute = vi.fn().mockImplementation(async (context) => {
      return {
        thought: 'Ho analizzato i dati ma serve un nuovo piano',
        message: 'Richiesta nuovo piano dopo analisi',
        nextAgent: 'planner', // Crea un ciclo con il planner
        context: {
          ...context,
          analysis: 'Analisi completata, serve nuovo piano',
        },
      };
    });

    // Input iniziale
    const query = 'Query che causerà un ciclo planner → analyzer → planner';
    const conversationId = 'test-ciclo-pap';

    // Esecuzione dell'orchestratore
    const result = await orchestrator.run({
      query,
      conversationId,
      maxTurns: 6,
    });

    // Verifica che si sia verificato un ciclo
    // L'agente planner dovrebbe essere chiamato più di una volta
    expect(mockAgents.planner.execute).toHaveBeenCalledTimes(2);

    // Verifica che il ciclo sia stato rilevato
    const memory = mockMemory[conversationId];
    expect(memory).toHaveProperty('cycleDetected', true);

    // Verifica che l'esecuzione sia terminata correttamente nonostante il ciclo
    expect(result).toHaveProperty('analysis');
  });

  // Test per verificare l'interruzione al superamento di maxTurns
  it("Dovrebbe interrompere l'esecuzione al raggiungimento di maxTurns", async () => {
    // Modifica temporanea per creare una catena infinita
    mockAgents.researcher.execute = vi.fn().mockImplementation(async (context) => {
      return {
        thought: 'Continuo a fare ricerche',
        message: 'Sto ancora raccogliendo dati',
        nextAgent: 'researcher', // Auto-riferimento per creare una catena infinita
        context: {
          ...context,
          researchIteration: (context.researchIteration || 0) + 1,
        },
      };
    });

    // Input iniziale
    const query = 'Query che causerà iterazioni infinite';
    const maxTurns = 3; // Limita a 3 turni

    // Esecuzione dell'orchestratore
    const result = await orchestrator.run({
      query,
      conversationId: 'test-max-turns',
      maxTurns,
    });

    // Verifica che l'agente researcher sia stato chiamato esattamente maxTurns volte
    expect(mockAgents.researcher.execute).toHaveBeenCalledTimes(maxTurns);

    // Verifica che il risultato contenga il numero corretto di iterazioni
    expect(result).toHaveProperty('researchIteration', maxTurns);
  });

  // Test per verificare l'uso di fallbackAgent quando un agente fallisce
  it('Dovrebbe utilizzare il fallbackAgent specificato quando un agente fallisce', async () => {
    // Crea un agente specializzato per gestire errori
    const errorHandlerAgent = createMockAgent('errorHandler', async (context) => {
      return {
        thought: "Sto gestendo l'errore di un altro agente",
        message: "Ho risolto il problema causato dall'errore",
        nextAgent: null, // Termina dopo aver gestito l'errore
        context: {
          ...context,
          errorHandled: true,
          errorSource: context.error?.agent,
        },
      };
    });

    // Aggiungi l'agente al registry
    mockAgents.errorHandler = errorHandlerAgent;

    // Configura l'agente analyzer per fallire
    mockAgents.analyzer.execute = vi
      .fn()
      .mockRejectedValue(new Error("Errore critico nell'analisi dei dati"));

    // Input iniziale
    const query = "Query che causerà un errore durante l'analisi";

    // Esecuzione dell'orchestratore con fallbackAgent configurato
    const result = await orchestrator.run({
      query,
      conversationId: 'test-fallback-agent',
      maxTurns: 10,
      fallbackAgent: 'errorHandler', // Specifica l'agente di fallback
    });

    // Verifica che la catena di esecuzione sia corretta fino all'errore
    expect(mockAgents.planner.execute).toHaveBeenCalledTimes(1);
    expect(mockAgents.researcher.execute).toHaveBeenCalledTimes(1);
    expect(mockAgents.analyzer.execute).toHaveBeenCalledTimes(1);

    // Verifica che l'agente di fallback sia stato chiamato
    expect(mockAgents.errorHandler.execute).toHaveBeenCalledTimes(1);

    // Verifica che il risultato finale contenga sia l'informazione dell'errore gestito
    // che le informazioni accumulate prima dell'errore
    expect(result).toHaveProperty('errorHandled', true);
    expect(result).toHaveProperty('errorSource', 'analyzer');
    expect(result).toHaveProperty('research'); // Dati raccolti prima dell'errore
  });

  // Test per verificare la scrittura corretta in memoria del contesto aggiornato
  it('Dovrebbe aggiornare correttamente la memoria con il contesto di ogni agente', async () => {
    // Input iniziale con un ID conversazione univoco
    const query = 'Query per testare gli aggiornamenti della memoria';
    const conversationId = 'test-memory-updates';

    // Esecuzione dell'orchestratore
    await orchestrator.run({
      query,
      conversationId,
      maxTurns: 10,
    });

    // Verifica che ogni chiamata a memoryManager.set contenga i dati dei vari agenti
    // Estrai le chiamate a set per la nostra conversazione
    const setCalls = vi
      .mocked(memoryManager.set)
      .mock.calls.filter((call) => call[0] === conversationId);

    // Ci aspettiamo almeno 5 aggiornamenti:
    // 1. Inizializzazione
    // 2-5. Uno per ogni agente (planner, researcher, analyzer, writer)
    expect(setCalls.length).toBeGreaterThanOrEqual(5);

    // Verifica che gli aggiornamenti contengano i dati attesi
    // Ultima chiamata (writer)
    const lastUpdate = setCalls[setCalls.length - 1][1];
    expect(lastUpdate).toHaveProperty('plan'); // Dal planner
    expect(lastUpdate).toHaveProperty('research'); // Dal researcher
    expect(lastUpdate).toHaveProperty('analysis'); // Dall'analyzer
    expect(lastUpdate).toHaveProperty('finalAnswer'); // Dal writer

    // Verifica anche nella memoria effettiva
    const finalMemory = mockMemory[conversationId];
    expect(finalMemory).toEqual(lastUpdate);

    // Verifica che gli aggiornamenti siano incrementali
    // Primo aggiornamento dopo l'inizializzazione (planner)
    const plannerUpdate = setCalls[1][1];
    expect(plannerUpdate).toHaveProperty('plan');
    expect(plannerUpdate).not.toHaveProperty('research');

    // Secondo aggiornamento (researcher)
    const researcherUpdate = setCalls[2][1];
    expect(researcherUpdate).toHaveProperty('plan'); // Mantenuto dal planner
    expect(researcherUpdate).toHaveProperty('research'); // Aggiunto dal researcher
    expect(researcherUpdate).not.toHaveProperty('analysis');
  });
});
