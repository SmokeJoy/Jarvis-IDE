/**
 * @file CoordinatorAgent.ts
 * @description Agente coordinator che coordina le attività tra gli agenti e gestisce il flusso di lavoro
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

import * as vscode from 'vscode';
import {
  commandCenter,
  Agent,
  AgentRole,
  AgentStatus,
  Command,
} from '../../../core/command-center';

/**
 * Interfaccia per una task
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  assignedAgents: string[];
  subtasks: SubTask[];
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Interfaccia per una subtask
 */
export interface SubTask {
  id: string;
  parentId: string;
  title: string;
  status: TaskStatus;
  assignedAgentId?: string;
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Stato di un task
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Interfaccia per la richiesta di creazione di un task
 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  priority?: number;
  metadata?: Record<string, any>;
  requestId: string;
}

/**
 * Agente Coordinator: Responsabile del coordinamento delle attività e dei flussi di lavoro
 * - Gestione delle code di task
 * - Assegnazione di compiti agli agenti
 * - Monitoraggio dello stato del task
 * - Orchestrazione delle attività complesse
 */
export class CoordinatorAgent {
  private agentId: string;
  private readonly capabilities = [
    'task-management',
    'workflow-orchestration',
    'agent-coordination',
    'progress-tracking',
  ];

  // Stato interno dell'agente
  private tasks: Map<string, Task> = new Map();
  private subTasks: Map<string, SubTask> = new Map();

  constructor() {
    // Registra l'agente nel CommandCenter
    this.agentId = commandCenter.registerAgent({
      name: 'Coordinator',
      role: AgentRole.COORDINATOR,
      status: AgentStatus.IDLE,
      capabilities: this.capabilities,
    });

    // Ascolta i comandi diretti a questo agente
    commandCenter.on(`command:${this.agentId}`, this.handleCommand.bind(this));

    // Ascolta i comandi generali per le operazioni di coordinamento
    commandCenter.on('command:task', this.handleTaskCommand.bind(this));

    // Ascolta i risultati dell'analisi e dell'esecuzione
    commandCenter.on('command:analysis-result', this.handleAnalysisResult.bind(this));
    commandCenter.on('command:execution-result', this.handleExecutionResult.bind(this));

    // Inizia il ciclo di heartbeat
    this.startHeartbeat();

    console.log(`[CoordinatorAgent] Inizializzato con ID: ${this.agentId}`);
  }

  /**
   * Gestisce i comandi diretti a questo agente
   */
  private async handleCommand(command: Command): Promise<void> {
    console.log(`[CoordinatorAgent] Ricevuto comando: ${command.type}`);

    // Imposta lo stato a BUSY mentre elabora il comando
    this.updateStatus(AgentStatus.BUSY);

    try {
      switch (command.type) {
        case 'create-task':
          await this.createTask(command.payload as CreateTaskRequest, command.source);
          break;

        case 'cancel-task':
          await this.cancelTask(command.payload.taskId, command.source);
          break;

        case 'get-task':
          await this.getTask(command.payload.taskId, command.source);
          break;

        case 'list-tasks':
          await this.listTasks(command.source);
          break;

        case 'status':
          // Invia lo stato corrente come risposta
          commandCenter.sendCommand({
            type: 'status-report',
            payload: {
              agent: 'coordinator',
              status: 'ok',
              activeTasks: this.tasks.size,
              capabilities: this.capabilities,
            },
            source: this.agentId,
            target: command.source,
            priority: 1,
          });
          break;

        default:
          console.warn(`[CoordinatorAgent] Comando non supportato: ${command.type}`);
      }
    } catch (error) {
      console.error(`[CoordinatorAgent] Errore nell'elaborazione del comando:`, error);

      // Invia notifica di errore
      commandCenter.sendCommand({
        type: 'error',
        payload: {
          message: `Errore durante il coordinamento: ${error instanceof Error ? error.message : String(error)}`,
          command: command.type,
          agentId: this.agentId,
        },
        source: this.agentId,
        target: command.source,
        priority: 2,
      });
    } finally {
      // Reimposta lo stato a IDLE dopo aver completato l'elaborazione
      this.updateStatus(AgentStatus.IDLE);
    }
  }

  /**
   * Gestisce i comandi di task generali
   */
  private handleTaskCommand(command: Command): void {
    if (command.target && command.target !== this.agentId) {
      // Il comando è diretto ad un altro agente
      return;
    }

    // Gestisci il comando come se fosse diretto a questo agente
    this.handleCommand({
      ...command,
      target: this.agentId,
    });
  }

  /**
   * Gestisce i risultati delle analisi
   */
  private handleAnalysisResult(command: Command): void {
    const result = command.payload;

    if (!result || !result.requestId) {
      return;
    }

    // Cerca la subtask associata a questa richiesta
    for (const [, subtask] of this.subTasks) {
      if (subtask.id === result.requestId) {
        // Aggiorna la subtask con il risultato
        subtask.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
        subtask.result = result.data;
        subtask.error = result.error;
        subtask.updatedAt = Date.now();

        // Aggiorna la task principale
        this.updateTaskProgress(subtask.parentId);
        break;
      }
    }
  }

  /**
   * Gestisce i risultati delle esecuzioni
   */
  private handleExecutionResult(command: Command): void {
    const result = command.payload;

    if (!result || !result.requestId) {
      return;
    }

    // Cerca la subtask associata a questa richiesta
    for (const [, subtask] of this.subTasks) {
      if (subtask.id === result.requestId) {
        // Aggiorna la subtask con il risultato
        subtask.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
        subtask.result = result.data;
        subtask.error = result.error;
        subtask.updatedAt = Date.now();

        // Aggiorna la task principale
        this.updateTaskProgress(subtask.parentId);
        break;
      }
    }
  }

  /**
   * Crea un nuovo task
   */
  private async createTask(request: CreateTaskRequest, sourceAgentId: string): Promise<void> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const task: Task = {
      id: taskId,
      title: request.title,
      description: request.description,
      status: TaskStatus.PENDING,
      priority: request.priority || 1,
      assignedAgents: [],
      subtasks: [],
      metadata: request.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    // Salva il task
    this.tasks.set(taskId, task);

    // Pianifica il task
    await this.planTask(task);

    // Notifica la creazione del task
    commandCenter.sendCommand({
      type: 'task-created',
      payload: {
        taskId,
        task: this.sanitizeTask(task),
        requestId: request.requestId,
      },
      source: this.agentId,
      target: sourceAgentId,
      priority: 1,
    });

    // Avvia l'esecuzione del task
    this.executeTask(task);
  }

  /**
   * Pianifica un task scomponendolo in subtask
   */
  private async planTask(task: Task): Promise<void> {
    console.log(`[CoordinatorAgent] Pianificazione del task: ${task.id}`);

    // Questo è un esempio semplificato di pianificazione
    // In un'implementazione reale, qui ci sarebbe un sistema più complesso

    const now = Date.now();

    // Crea delle subtask in base alla descrizione del task
    // Per esempio, potremmo creare una subtask di analisi, una di esecuzione, ecc.

    // Subtask di analisi
    const analysisSubtaskId = `subtask-analysis-${Date.now()}`;
    const analysisSubtask: SubTask = {
      id: analysisSubtaskId,
      parentId: task.id,
      title: `Analisi per "${task.title}"`,
      status: TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    // Subtask di esecuzione
    const executionSubtaskId = `subtask-execution-${Date.now()}`;
    const executionSubtask: SubTask = {
      id: executionSubtaskId,
      parentId: task.id,
      title: `Esecuzione per "${task.title}"`,
      status: TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    // Salva le subtask
    this.subTasks.set(analysisSubtaskId, analysisSubtask);
    this.subTasks.set(executionSubtaskId, executionSubtask);

    // Aggiorna il task con le subtask
    task.subtasks.push(analysisSubtask);
    task.subtasks.push(executionSubtask);
    task.updatedAt = now;
  }

  /**
   * Esegue un task assegnando le subtask agli agenti appropriati
   */
  private async executeTask(task: Task): Promise<void> {
    console.log(`[CoordinatorAgent] Esecuzione del task: ${task.id}`);

    // Aggiorna lo stato del task
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = Date.now();

    // Per ogni subtask, assegna un agente appropriato
    for (const subtask of task.subtasks) {
      if (subtask.status === TaskStatus.PENDING) {
        if (subtask.title.includes('Analisi')) {
          // Assegna all'agente Analyst
          subtask.assignedAgentId = 'analyst'; // In realtà dovremmo usare l'ID reale dell'agente Analyst
          subtask.status = TaskStatus.IN_PROGRESS;
          subtask.updatedAt = Date.now();

          // Invia un comando all'agente Analyst
          commandCenter.sendCommand({
            type: 'analyze',
            payload: {
              type: 'project', // o 'file', 'code', ecc.
              requestId: subtask.id,
            },
            source: this.agentId,
            target: 'analyst', // In realtà dovremmo usare l'ID reale dell'agente Analyst
            priority: task.priority,
          });
        } else if (subtask.title.includes('Esecuzione')) {
          // Questa subtask verrà eseguita solo dopo che l'analisi è completata
          // Per ora la lasciamo in stato PENDING
        }
      }
    }

    // Notifica l'avvio del task
    commandCenter.sendCommand({
      type: 'task-started',
      payload: {
        taskId: task.id,
        task: this.sanitizeTask(task),
      },
      source: this.agentId,
      target: '', // Broadcast
      priority: 1,
    });
  }

  /**
   * Aggiorna lo stato di avanzamento di un task
   */
  private updateTaskProgress(taskId: string): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    // Controlla lo stato di tutte le subtask
    let allCompleted = true;
    let anyFailed = false;

    for (const subtask of task.subtasks) {
      if (subtask.status === TaskStatus.FAILED) {
        anyFailed = true;
      }

      if (subtask.status !== TaskStatus.COMPLETED && subtask.status !== TaskStatus.FAILED) {
        allCompleted = false;
      }

      // Se una subtask di analisi è completata, avvia la subtask di esecuzione
      if (subtask.title.includes('Analisi') && subtask.status === TaskStatus.COMPLETED) {
        // Trova la subtask di esecuzione
        const executionSubtask = task.subtasks.find((st) => st.title.includes('Esecuzione'));

        if (executionSubtask && executionSubtask.status === TaskStatus.PENDING) {
          // Assegna all'agente Executor
          executionSubtask.assignedAgentId = 'executor'; // In realtà dovremmo usare l'ID reale dell'agente Executor
          executionSubtask.status = TaskStatus.IN_PROGRESS;
          executionSubtask.updatedAt = Date.now();

          // Invia un comando all'agente Executor
          commandCenter.sendCommand({
            type: 'execute',
            payload: {
              type: 'terminal', // o 'file', 'workspace', ecc.
              action: 'execute',
              payload: {
                command: 'echo "Esecuzione del task ' + task.id + '"',
              },
              requestId: executionSubtask.id,
            },
            source: this.agentId,
            target: 'executor', // In realtà dovremmo usare l'ID reale dell'agente Executor
            priority: task.priority,
          });
        }
      }
    }

    // Aggiorna lo stato del task
    const previousStatus = task.status;

    if (allCompleted) {
      task.status = anyFailed ? TaskStatus.FAILED : TaskStatus.COMPLETED;
      task.updatedAt = Date.now();

      // Notifica il completamento del task
      const eventType = anyFailed ? 'task-failed' : 'task-completed';

      commandCenter.sendCommand({
        type: eventType,
        payload: {
          taskId: task.id,
          task: this.sanitizeTask(task),
        },
        source: this.agentId,
        target: '', // Broadcast
        priority: 1,
      });
    }

    // Se lo stato è cambiato, notifica
    if (previousStatus !== task.status) {
      commandCenter.sendCommand({
        type: 'task-updated',
        payload: {
          taskId: task.id,
          task: this.sanitizeTask(task),
        },
        source: this.agentId,
        target: '', // Broadcast
        priority: 1,
      });
    }
  }

  /**
   * Annulla un task
   */
  private async cancelTask(taskId: string, sourceAgentId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task non trovato: ${taskId}`);
    }

    // Aggiorna lo stato del task
    task.status = TaskStatus.CANCELLED;
    task.updatedAt = Date.now();

    // Aggiorna lo stato delle subtask
    for (const subtask of task.subtasks) {
      if (subtask.status === TaskStatus.PENDING || subtask.status === TaskStatus.IN_PROGRESS) {
        subtask.status = TaskStatus.CANCELLED;
        subtask.updatedAt = Date.now();
      }
    }

    // Notifica l'annullamento del task
    commandCenter.sendCommand({
      type: 'task-cancelled',
      payload: {
        taskId,
        task: this.sanitizeTask(task),
      },
      source: this.agentId,
      target: sourceAgentId || '',
      priority: 1,
    });
  }

  /**
   * Ottiene informazioni su un task
   */
  private async getTask(taskId: string, sourceAgentId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task non trovato: ${taskId}`);
    }

    // Invia le informazioni sul task
    commandCenter.sendCommand({
      type: 'task-info',
      payload: {
        taskId,
        task: this.sanitizeTask(task),
      },
      source: this.agentId,
      target: sourceAgentId,
      priority: 1,
    });
  }

  /**
   * Ottiene la lista dei task
   */
  private async listTasks(sourceAgentId: string): Promise<void> {
    const taskList = Array.from(this.tasks.values()).map(this.sanitizeTask);

    // Invia la lista dei task
    commandCenter.sendCommand({
      type: 'task-list',
      payload: {
        tasks: taskList,
      },
      source: this.agentId,
      target: sourceAgentId,
      priority: 1,
    });
  }

  /**
   * Sanitizza un oggetto task per l'invio
   */
  private sanitizeTask(task: Task): any {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedAgents: task.assignedAgents,
      subtasks: task.subtasks.map((st) => ({
        id: st.id,
        title: st.title,
        status: st.status,
        assignedAgentId: st.assignedAgentId,
      })),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Aggiorna lo stato dell'agente nel Command Center
   */
  private updateStatus(status: AgentStatus): void {
    commandCenter.updateAgentStatus(this.agentId, status);
  }

  /**
   * Avvia il ciclo di heartbeat per l'agente
   */
  private startHeartbeat(): void {
    // Invia un heartbeat ogni 15 secondi
    setInterval(() => {
      commandCenter.updateAgentHeartbeat(this.agentId);
    }, 15000);
  }
}

// Esporta l'istanza singleton dell'agente
export const coordinatorAgent = new CoordinatorAgent();
