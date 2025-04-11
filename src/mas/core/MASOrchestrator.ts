import { LLMProviderHandler, registerDefaultProviders } from '../providers/provider-registry-stub';
import { InMemoryAgentHistory } from '../memory/InMemoryAgentHistory';
import { WebviewMessageUnion, isWebviewMessage } from '../../shared/types/webviewMessageUnion';
import { ZodSchemaMap } from '../../utils/validation';
import { AgentManager } from './AgentManager';
import { MemoryManager } from './MemoryManager';
import { AgentRole } from './types';

// Interfaccia per le opzioni di inizializzazione dell'orchestratore
interface MASOptions {
  agentManager?: AgentManager;
  memoryManager?: MemoryManager;
  maxConcurrentAgents?: number;
  startingAgent?: AgentRole;
  parallelExecution?: boolean;
}

// Interfaccia per le opzioni di esecuzione dell'orchestratore
interface RunOptions {
  query: string;
  conversationId: string;
  maxTurns?: number;
  fallbackAgent?: AgentRole;
}

// Interfaccia per i task paralleli
interface ParallelTask {
  agentRole: AgentRole;
  taskId: string;
  input: any;
}

/**
 * Gestione del fallback dei provider LLM
 */
class ProviderFallbackHandler {
  lastSuccessfulProvider: LLMProviderHandler | null = null;

  constructor(private providers: LLMProviderHandler[]) {}

  /**
   * Tenta di utilizzare il provider preferito o fallback su altri disponibili
   */
  async executeWithFallback(callback: (provider: LLMProviderHandler) => Promise<any>): Promise<any> {
    // Se c'è un provider che ha funzionato in precedenza, tenta prima quello
    if (this.lastSuccessfulProvider) {
      try {
        const result = await callback(this.lastSuccessfulProvider);
        return result;
      } catch (error) {
        console.error('Provider preferito fallito, tentativo con provider alternativi');
        // Continua con il fallback
      }
    }

    // Tenta con ogni provider disponibile
    let lastError: Error | null = null;
    for (const provider of this.providers) {
      if (!provider.isEnabled) continue;

      try {
        const result = await callback(provider);
        // Memorizza questo provider come ultimo che ha avuto successo
        this.lastSuccessfulProvider = provider;
        return result;
      } catch (error) {
        console.error(`Provider ${provider.id} fallito:`, error);
        lastError = error as Error;
      }
    }

    // Se tutti i provider falliscono, solleva l'ultimo errore
    throw lastError || new Error('Tutti i provider hanno fallito');
  }
}

export class MASOrchestrator {
  private providers: LLMProviderHandler[] = [];
  private historyStore: InMemoryAgentHistory;
  private fallbackHandler: ProviderFallbackHandler;
  private agentManager: AgentManager;
  private memoryManager: MemoryManager;
  private maxConcurrentAgents: number;
  private startingAgent: AgentRole;
  private parallelExecution: boolean;

  constructor(options: MASOptions = {}) {
    this.historyStore = new InMemoryAgentHistory();
    this.agentManager = options.agentManager || new AgentManager();
    this.memoryManager = options.memoryManager || new MemoryManager();
    this.maxConcurrentAgents = options.maxConcurrentAgents || 1;
    this.startingAgent = options.startingAgent || 'planner';
    this.parallelExecution = options.parallelExecution || false;
    this.initializeProviders();
    this.fallbackHandler = new ProviderFallbackHandler(this.providers);
  }

  private initializeProviders() {
    this.providers = registerDefaultProviders();
  }

  /**
   * Esegue una strategia di agente utilizzando il provider LLM appropriato
   */
  async executeAgentStrategy(
    message: WebviewMessageUnion,
    schemaMap: ZodSchemaMap
  ): Promise<any> {
    try {
      // Validazione del messaggio
      if (!message.type || !schemaMap[message.type]) {
        throw new Error('Invalid message type');
      }

      // Utilizzo del handler di fallback per scegliere il provider
      return await this.fallbackHandler.executeWithFallback(async (provider) => {
        console.log(`Tentativo di esecuzione con provider ${provider.id}`);
        const result = await provider.handle(message, schemaMap);
        return result;
      });
    } catch (error) {
      console.error('Errore durante l\'esecuzione della strategia:', (error as Error).message);
      
      // Registra l'interazione fallita nella memoria
      await this.memoryManager.append(`agent-interactions-${message.agentId}`, {
        agentId: message.agentId,
        input: message.payload,
        error: error,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Esegue una sequenza di agenti a partire da un agente iniziale
   * @param options Opzioni di esecuzione
   * @returns Risultato dell'esecuzione
   */
  public async run(options: RunOptions): Promise<any> {
    const { query, conversationId, maxTurns = 10, fallbackAgent } = options;
    
    // Inizializza il contesto
    let context = {
      query,
      history: [],
      memory: {},
      performance: {}
    };
    
    // Salva query e contesto iniziale in memoria
    await this.memoryManager.set(conversationId, {
      query,
      ...context
    });
    
    // Recupera l'agente iniziale
    let currentAgent = await this.agentManager.getAgent(this.startingAgent);
    if (!currentAgent) {
      throw new Error(`Agente iniziale "${this.startingAgent}" non trovato`);
    }
    
    // Esegui la catena di agenti
    let turns = 0;
    const visited = new Set<string>();
    
    while (currentAgent && turns < maxTurns) {
      try {
        // Aggiorna il contesto con la memoria condivisa
        const storedMemory = await this.memoryManager.get(conversationId);
        if (storedMemory) {
          context.memory = {
            ...context.memory,
            ...storedMemory
          };
        }
        
        // Esegue l'agente
        const result = await currentAgent.execute(context);
        
        // Aggiorna il contesto con il risultato
        context = result.context;
        
        // Aggiorna la memoria
        await this.memoryManager.set(conversationId, context);
        
        // Controlla se dobbiamo proseguire con un altro agente
        if (result.nextAgent) {
          // Controlla se stiamo entrando in un ciclo
          if (visited.has(result.nextAgent)) {
            // Rileva ciclo
            await this.memoryManager.set(conversationId, {
              ...context,
              cycleDetected: true
            });
            break;
          }
          
          // Marca l'agente corrente come visitato
          visited.add(currentAgent.role);
          
          // Passa all'agente successivo
          currentAgent = await this.agentManager.getAgent(result.nextAgent);
          if (!currentAgent) {
            throw new Error(`Agente "${result.nextAgent}" non trovato`);
          }
        } else {
          // Fine della catena
          break;
        }
        
        turns++;
      } catch (error) {
        // Gestisci l'errore
        console.error(`Errore nell'esecuzione dell'agente "${currentAgent.role}": ${error}`);
        
        // Registra l'errore in memoria
        await this.memoryManager.set(conversationId, {
          ...context,
          error: {
            agent: currentAgent.role,
            message: (error as Error).message,
            stack: (error as Error).stack
          }
        });
        
        // Se c'è un agente di fallback, passa a quello
        if (fallbackAgent) {
          currentAgent = await this.agentManager.getAgent(fallbackAgent);
          if (!currentAgent) {
            throw new Error(`Agente di fallback "${fallbackAgent}" non trovato`);
          }
        } else {
          // Altrimenti termina l'esecuzione
          throw error;
        }
      }
    }
    
    // Ritorna il contesto finale
    return context;
  }

  /**
   * Esegue più task in parallelo, rispettando il limite massimo di agenti concorrenti
   * @param tasks Lista di task da eseguire
   * @returns Risultati dei task
   */
  public async executeParallel(tasks: ParallelTask[]): Promise<Record<string, any>> {
    // Verifica che l'esecuzione parallela sia abilitata
    if (!this.parallelExecution) {
      throw new Error('Esecuzione parallela non abilitata');
    }
    
    // Limita il numero di task concorrenti
    const results: Record<string, any> = {};
    const batches: ParallelTask[][] = [];
    
    // Suddividi i task in batch in base a maxConcurrentAgents
    for (let i = 0; i < tasks.length; i += this.maxConcurrentAgents) {
      batches.push(tasks.slice(i, i + this.maxConcurrentAgents));
    }
    
    // Esegui i batch in sequenza
    for (const batch of batches) {
      // Esegui i task nel batch in parallelo
      const batchPromises = batch.map(async task => {
        try {
          // Ottieni l'agente
          const agent = await this.agentManager.getAgent(task.agentRole);
          if (!agent) {
            throw new Error(`Agente "${task.agentRole}" non trovato`);
          }
          
          // Esegui l'agente
          const result = await agent.execute({
            query: task.input.query,
            history: [],
            memory: {}
          });
          
          // Salva il risultato in memoria
          await this.memoryManager.set(task.taskId, result.context);
          
          // Restituisci il risultato
          return {
            taskId: task.taskId,
            result: result.context
          };
        } catch (error) {
          // Gestisci l'errore
          console.error(`Errore nell'esecuzione del task "${task.taskId}": ${error}`);
          
          // Salva l'errore in memoria
          await this.memoryManager.set(task.taskId, {
            error: {
              message: (error as Error).message,
              stack: (error as Error).stack
            }
          });
          
          // Restituisci l'errore
          return {
            taskId: task.taskId,
            error
          };
        }
      });
      
      // Attendi il completamento di tutti i task nel batch
      const batchResults = await Promise.all(batchPromises);
      
      // Aggiorna i risultati
      for (const { taskId, result, error } of batchResults) {
        results[taskId] = error || result;
      }
    }
    
    return results;
  }
}