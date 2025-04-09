import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import type { EventEmitter } from 'events';
import type { MasStateManager } from './MasStateManager.js.js';
import { TaskQueueManager } from './TaskQueueManager.js.js';
import type { 
  MasConfig, 
  AgentConfig, 
  AgentStatus, 
  AgentMode, 
  Task, 
  CodeStyle,
  PriorityLevel
} from '../shared/types/mas.types.js.js';

/**
 * Classe principale per la gestione del sistema Multi-Agent
 */
export class MasManager extends EventEmitter {
  private stateManager: MasStateManager;
  private taskQueue: TaskQueueManager;
  private agents: Map<string, AgentStatus> = new Map();
  private isRunning: boolean = false;
  
  /**
   * Costruttore del MasManager
   * @param context Il contesto dell'estensione VS Code
   */
  constructor(private context: vscode.ExtensionContext) {
    super();
    this.stateManager = new MasStateManager(context);
    this.taskQueue = new TaskQueueManager();
    
    // Inizializza gli agenti di default
    this.initializeDefaultAgents();
    
    // Carica la configurazione salvata
    this.loadSavedConfiguration();
  }
  
  /**
   * Inizializza gli agenti predefiniti
   */
  private initializeDefaultAgents(): void {
    // Coder Agent - l'agente principale per la scrittura di codice
    this.registerAgent({
      id: 'coder-agent',
      name: 'Coder Agent',
      mode: 'autonomous',
      isActive: true,
      dependencies: [],
      warnings: []
    });
    
    // Refactoring Agent - un agente specializzato nella rifattorizzazione del codice
    this.registerAgent({
      id: 'refactor-agent',
      name: 'Refactoring Agent',
      mode: 'supervised',
      isActive: false,
      dependencies: ['coder-agent'],
      warnings: []
    });
    
    // Documentation Agent - un agente specializzato nella documentazione
    this.registerAgent({
      id: 'doc-agent',
      name: 'Documentation Agent',
      mode: 'supervised',
      isActive: false,
      dependencies: ['coder-agent'],
      warnings: []
    });
  }
  
  /**
   * Carica la configurazione salvata e la applica al sistema
   */
  private loadSavedConfiguration(): void {
    const config = this.stateManager.loadConfig();
    
    if (config) {
      this.applyMasConfig(config);
    }
  }
  
  /**
   * Applica una configurazione MAS al sistema
   * @param config La configurazione MAS da applicare
   */
  public applyMasConfig(config: MasConfig): void {
    // Applica la configurazione a ciascun agente
    for (const agentConfig of config.agents) {
      const agent = this.agents.get(agentConfig.id);
      
      if (agent) {
        // Aggiorna la modalità e lo stato attivo dell'agente
        agent.mode = agentConfig.mode;
        agent.isActive = agentConfig.isEnabled;
        
        // Emetti un evento per informare altri componenti
        this.emit('agent-updated', agent);
      }
    }
    
    // Emetti un evento per l'aggiornamento della configurazione
    this.emit('config-updated', config);
  }
  
  /**
   * Registra un nuovo agente nel sistema
   * @param agent Le informazioni sull'agente
   */
  public registerAgent(agent: AgentStatus): void {
    this.agents.set(agent.id, agent);
    
    // Crea e salva la configurazione iniziale dell'agente
    const agentConfig: AgentConfig = {
      id: agent.id,
      name: agent.name,
      mode: agent.mode,
      isEnabled: agent.isActive,
      style: 'standard'
    };
    
    this.stateManager.updateAgentConfig(agentConfig);
    
    // Emetti un evento per informare altri componenti
    this.emit('agent-registered', agent);
  }
  
  /**
   * Imposta la modalità di un agente
   * @param agentId ID dell'agente
   * @param mode Nuova modalità
   */
  public setAgentMode(agentId: string, mode: AgentMode): void {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      agent.mode = mode;
      
      // Aggiorna la configurazione dell'agente
      const agentConfig: AgentConfig = {
        id: agent.id,
        name: agent.name,
        mode: agent.mode,
        isEnabled: agent.isActive,
        style: 'standard' // Usa il valore esistente se disponibile
      };
      
      this.stateManager.updateAgentConfig(agentConfig);
      
      // Emetti un evento per informare altri componenti
      this.emit('agent-updated', agent);
    }
  }
  
  /**
   * Imposta lo stile di codice di un agente
   * @param agentId ID dell'agente
   * @param style Nuovo stile di codice
   */
  public setAgentStyle(agentId: string, style: CodeStyle): void {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      // Aggiorna la configurazione dell'agente
      const agentConfig: AgentConfig = {
        id: agent.id,
        name: agent.name,
        mode: agent.mode,
        isEnabled: agent.isActive,
        style: style
      };
      
      this.stateManager.updateAgentConfig(agentConfig);
      
      // Emetti un evento per informare altri componenti
      this.emit('agent-updated', agent);
    }
  }
  
  /**
   * Attiva o disattiva un agente
   * @param agentId ID dell'agente
   * @param isActive Nuovo stato
   */
  public setAgentActive(agentId: string, isActive: boolean): void {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      agent.isActive = isActive;
      
      // Aggiorna la configurazione dell'agente
      const agentConfig: AgentConfig = {
        id: agent.id,
        name: agent.name,
        mode: agent.mode,
        isEnabled: agent.isActive,
        style: 'standard' // Usa il valore esistente se disponibile
      };
      
      this.stateManager.updateAgentConfig(agentConfig);
      
      // Emetti un evento per informare altri componenti
      this.emit('agent-updated', agent);
    }
  }
  
  /**
   * Aggiunge un task per un agente specifico
   * @param agentId ID dell'agente destinatario
   * @param instruction Istruzione da eseguire
   * @param style Stile di codice (opzionale)
   * @param priority Priorità del task (opzionale)
   * @returns Il task aggiunto
   */
  public queueInstruction(
    agentId: string, 
    instruction: string, 
    style?: CodeStyle, 
    priority: PriorityLevel = 'normal'
  ): Task {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agente ${agentId} non trovato`);
    }
    
    if (!agent.isActive) {
      throw new Error(`L'agente ${agent.name} non è attivo`);
    }
    
    // Crea il task
    const task = this.taskQueue.addTask({
      instruction: {
        id: uuidv4(),
        content: instruction,
        createdAt: new Date(),
        agentId: agentId,
        style: style,
        priority: priority
      },
      assignedTo: agentId
    });
    
    // Emetti evento per informare della creazione del task
    this.emit('instruction-queued', {
      agentId,
      instruction: task.instruction
    });
    
    // Se il sistema è in esecuzione, avvia l'elaborazione dei task
    if (this.isRunning) {
      this.processNextTask();
    }
    
    return task;
  }
  
  /**
   * Avvia l'elaborazione dei task
   */
  public start(): void {
    this.isRunning = true;
    this.processNextTask();
  }
  
  /**
   * Arresta l'elaborazione dei task
   */
  public stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Elabora il prossimo task nella coda
   */
  private processNextTask(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Se c'è già un task attivo, non fare nulla
    if (this.taskQueue.getActiveTask()) {
      return;
    }
    
    const nextTask = this.taskQueue.startNextTask();
    
    if (nextTask) {
      const agent = this.agents.get(nextTask.assignedTo || '');
      
      if (agent) {
        // Aggiorna lo stato dell'agente
        agent.currentTask = nextTask.instruction.content;
        agent.lastActivity = new Date();
        
        // Emetti un evento per informare dell'inizio dell'elaborazione
        this.emit('task-started', {
          agentId: agent.id,
          task: nextTask
        });
        
        // Simula l'elaborazione del task (nella versione reale, questo verrebbe fatto da componenti esterni)
        this.simulateTaskProcessing(nextTask);
      } else {
        // Se l'agente non esiste più, marca il task come fallito
        this.taskQueue.failActiveTask('Agente non trovato');
        this.processNextTask();
      }
    }
  }
  
  /**
   * Simula l'elaborazione di un task (solo per scopi dimostrativi)
   * @param task Il task da elaborare
   */
  private simulateTaskProcessing(task: Task): void {
    // In un'implementazione reale, il task verrebbe inviato a componenti esterni
    // e questo metodo verrebbe sostituito
    
    setTimeout(() => {
      // Simula il completamento del task
      const agent = this.agents.get(task.assignedTo || '');
      
      if (agent) {
        // Aggiorna lo stato dell'agente
        agent.currentTask = undefined;
        agent.lastActivity = new Date();
        
        // Completa il task
        const completedTask = this.taskQueue.completeActiveTask({
          id: uuidv4(),
          explanation: `Task completato da ${agent.name}`,
          suggestions: ['Suggerimento 1', 'Suggerimento 2']
        });
        
        if (completedTask) {
          // Emetti un evento per informare del completamento
          this.emit('instruction-completed', {
            agentId: agent.id,
            instruction: completedTask.instruction,
            result: completedTask.result
          });
        }
        
        // Processa il prossimo task
        this.processNextTask();
      }
    }, 2000); // Simula l'elaborazione per 2 secondi
  }
  
  /**
   * Annulla un task specifico
   * @param taskId ID del task da annullare
   * @returns true se l'annullamento è riuscito, false altrimenti
   */
  public abortTask(taskId: string): boolean {
    // Se il task è attivo, dobbiamo gestirlo in modo speciale
    const activeTask = this.taskQueue.getActiveTask();
    
    if (activeTask && activeTask.id === taskId) {
      const agent = this.agents.get(activeTask.assignedTo || '');
      
      if (agent) {
        // Annulla il task tramite il TaskQueueManager
        const aborted = this.taskQueue.abortTask(taskId);
        
        if (aborted) {
          // Aggiorna lo stato dell'agente
          agent.currentTask = undefined;
          
          // Emetti un evento per informare dell'annullamento
          this.emit('task-aborted', {
            agentId: agent.id,
            taskId: taskId
          });
          
          // Processa il prossimo task se il sistema è in esecuzione
          if (this.isRunning) {
            this.processNextTask();
          }
          
          return true;
        }
      }
      
      return false;
    }
    
    // Se il task non è attivo, usa direttamente il metodo del TaskQueueManager
    const aborted = this.taskQueue.abortTask(taskId);
    
    if (aborted) {
      // Emetti un evento per informare dell'annullamento
      this.emit('task-aborted', {
        taskId: taskId
      });
    }
    
    return aborted;
  }
  
  /**
   * Restituisce lo stato di tutti gli agenti
   * @returns Array di stati degli agenti
   */
  public getAllAgentsStatus(): AgentStatus[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Restituisce lo stato di un agente specifico
   * @param agentId ID dell'agente
   * @returns Stato dell'agente o undefined
   */
  public getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Restituisce lo stato attuale della coda dei task
   * @returns Stato della coda dei task
   */
  public getTaskQueueState() {
    return this.taskQueue.getQueueState();
  }
  
  /**
   * Invia un messaggio a un agente
   * @param message Messaggio da inviare
   */
  public sendMessage(message: any): void {
    // Questo metodo verrà utilizzato per la comunicazione tra agenti
    // o per inviare notifiche dal frontend
    
    if (message.to && message.payload) {
      const agent = this.agents.get(message.to);
      
      if (agent) {
        // Gestisci notifiche specifiche
        if (message.payload === 'abort' && agent.currentTask) {
          // Annulla il task corrente
          const activeTask = this.taskQueue.getActiveTask();
          
          if (activeTask && activeTask.assignedTo === agent.id) {
            this.taskQueue.abortTask(activeTask.id);
            agent.currentTask = undefined;
            
            // Emetti un evento per informare dell'annullamento
            this.emit('task-aborted', {
              agentId: agent.id,
              taskId: activeTask.id
            });
            
            // Processa il prossimo task
            this.processNextTask();
          }
        } else if (message.payload === 'activate') {
          this.setAgentActive(agent.id, true);
        } else if (message.payload === 'deactivate') {
          this.setAgentActive(agent.id, false);
        }
      }
    }
  }
  
  /**
   * Imposta la modalità globale del sistema MAS
   * @param mode Nuova modalità globale
   */
  public setSystemMode(mode: 'collaborative' | 'single'): void {
    this.stateManager.updateDefaultMode(mode);
    
    // Emetti un evento per informare del cambiamento
    this.emit('system-mode-changed', mode);
  }
  
  /**
   * Imposta lo stile di codice predefinito
   * @param style Nuovo stile predefinito
   */
  public setDefaultStyle(style: CodeStyle): void {
    this.stateManager.updateDefaultStyle(style);
    
    // Emetti un evento per informare del cambiamento
    this.emit('default-style-changed', style);
  }
  
  /**
   * Salva la configurazione completa del sistema MAS
   * @param config Configurazione da salvare
   */
  public saveConfiguration(config: MasConfig): void {
    this.stateManager.saveConfig(config);
    
    // Applica la configurazione
    this.applyMasConfig(config);
    
    // Emetti un evento per informare del salvataggio
    this.emit('configuration-saved', { success: true, message: 'Configurazione salvata con successo' });
  }
  
  /**
   * Ottiene tutti i task presenti nel sistema, sia attivi che completati
   * @returns Array di tutti i task
   */
  public getAllTasks(): Task[] {
    const activeTask = this.taskQueue.getActiveTask();
    const tasks: Task[] = [];
    
    // Aggiungi il task attivo se presente
    if (activeTask) {
      tasks.push(activeTask);
    }
    
    // Aggiungi i task in coda
    const queueState = this.taskQueue.getQueueState();
    
    // Ottieni i task in coda divisi per priorità
    const pendingTasks = [
      ...this.taskQueue.getHighPriorityTasks(),
      ...this.taskQueue.getNormalPriorityTasks(),
      ...this.taskQueue.getLowPriorityTasks()
    ];
    
    // Aggiungi i task in coda all'array
    tasks.push(...pendingTasks);
    
    // Aggiungi i task completati
    tasks.push(...this.taskQueue.getCompletedTasks());
    
    // Aggiungi i task falliti
    tasks.push(...this.taskQueue.getFailedTasks());
    
    return tasks;
  }
} 