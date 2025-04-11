import * as vscode from 'vscode';
import { BaseWebviewMessageHandler } from './WebviewMessageHandler.js';
import type { WebviewMessage } from '../../shared/types/webview.types.js';
import type { WebviewMessageUnion } from '../../shared/types/webviewMessageUnion.js';
import { WebviewMessageType } from '../../shared/types/webview.types.js';
import { TaskQueueService } from '../../services/TaskQueueService.js';
import type { Task } from '../../shared/types/mas.types.js';
import { Logger } from '../../utils/logger.js';
import { MasManager } from '../../mas/MasManager.js';

// Definizione corretta del tipo TaskQueueState basato sul tipo effettivo usato in TaskQueueService
export interface TaskQueueState {
  tasks: Task[];
  pending: number;
  running: number;
  completed: number;
  failed: number;
  aborted: number;
  lastUpdated: string;
}

/**
 * Tipi di messaggi per la coda dei task
 */
export enum TaskQueueMessageType {
  GET_QUEUE_STATE = 'getQueueState',
  QUEUE_STATE_UPDATED = 'queueStateUpdated',
  ADD_TASK = 'addTask',
  REMOVE_TASK = 'removeTask',
  UPDATE_TASK = 'updateTask',
  CLEAR_COMPLETED = 'clearCompleted',
  ABORT_TASK = 'abortTask',
  RERUN_TASK = 'rerunTask',
  SET_FILTER = 'setTaskQueueFilter',
  ERROR = 'taskQueueError'
}

/**
 * Interfacce per i messaggi della coda dei task
 */
export interface TaskQueueGetStateMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.GET_QUEUE_STATE;
}

export interface TaskQueueAddTaskMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.ADD_TASK;
  payload: {
    instruction: string;
    agentId: string;
    style?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface TaskQueueRemoveTaskMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.REMOVE_TASK;
  payload: {
    taskId: string;
  };
}

export interface TaskQueueUpdateTaskMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.UPDATE_TASK;
  payload: {
    taskId: string;
    status: string;
    details?: Record<string, unknown>;
  };
}

export interface TaskQueueClearCompletedMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.CLEAR_COMPLETED;
}

export interface TaskQueueAbortTaskMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.ABORT_TASK;
  payload: {
    taskId: string;
  };
}

export interface TaskQueueRerunTaskMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.RERUN_TASK;
  payload: {
    task: Task;
  };
}

export interface TaskQueueSetFilterMessage extends WebviewMessage {
  type: typeof TaskQueueMessageType.SET_FILTER;
  payload: {
    filter: string;
  };
}

/**
 * Tipo unione per tutti i possibili messaggi della coda dei task
 */
export type TaskQueueMessageUnion =
  | TaskQueueGetStateMessage
  | TaskQueueAddTaskMessage
  | TaskQueueRemoveTaskMessage
  | TaskQueueUpdateTaskMessage
  | TaskQueueClearCompletedMessage
  | TaskQueueAbortTaskMessage
  | TaskQueueRerunTaskMessage
  | TaskQueueSetFilterMessage;

/**
 * Type guard per verificare se un messaggio è un messaggio della coda dei task
 */
function isTaskQueueMessage(message: WebviewMessage): message is TaskQueueMessageUnion {
  return Object.values(TaskQueueMessageType).includes(message.type as TaskQueueMessageType);
}

/**
 * Handler per i messaggi della coda dei task
 */
export class TaskQueueMessageHandler extends BaseWebviewMessageHandler {
  private _queueService: TaskQueueService;
  private _masManager: MasManager;
  private _logger: Logger;
  private _disposables: vscode.Disposable[] = [];
  
  /**
   * Costruttore dell'handler
   */
  constructor(masManager: MasManager) {
    super();
    this._queueService = TaskQueueService.getInstance();
    this._masManager = masManager;
    this._logger = new Logger('TaskQueueMessageHandler');
  }
  
  /**
   * Inizializza l'handler
   * @param webview WebView da collegare
   */
  public initialize(webview: vscode.Webview): void {
    super.initialize(webview);
    
    // Sottoscrizione agli eventi di aggiornamento della coda
    this._disposables.push(
      this._queueService.onQueueChanged((state: TaskQueueState) => {
        this._sendQueueState(state);
      })
    );
    
    this._logger.debug('TaskQueueMessageHandler inizializzato');
  }
  
  /**
   * Dispatcher type-safe per i messaggi WebView 
   * @param message Messaggio da dispatchare
   */
  protected dispatchMessage(message: WebviewMessageUnion): void {
    // Verifichiamo se è un messaggio della TaskQueue
    if (isTaskQueueMessage(message)) {
      switch (message.type) {
        case TaskQueueMessageType.GET_QUEUE_STATE:
          this._handleGetQueueState();
          break;
          
        case TaskQueueMessageType.ADD_TASK:
          this._handleAddTask(message);
          break;
          
        case TaskQueueMessageType.REMOVE_TASK:
          this._handleRemoveTask(message);
          break;
          
        case TaskQueueMessageType.UPDATE_TASK:
          this._handleUpdateTask(message);
          break;
          
        case TaskQueueMessageType.CLEAR_COMPLETED:
          this._handleClearCompleted();
          break;
          
        case TaskQueueMessageType.ABORT_TASK:
          this._handleAbortTask(message);
          break;
          
        case TaskQueueMessageType.RERUN_TASK:
          this._handleRerunTask(message);
          break;
          
        case TaskQueueMessageType.SET_FILTER:
          this._handleSetFilter(message);
          break;
      }
    }
  }
  
  /**
   * Gestisce un messaggio di errore
   * @param errorMessage Messaggio di errore
   */
  protected handleError(errorMessage: Extract<WebviewMessageUnion, { type: typeof WebviewMessageType.ERROR }>): void {
    if (errorMessage.payload && typeof errorMessage.payload === 'object' && 'message' in errorMessage.payload) {
      const message = errorMessage.payload.message as string;
      this._logger.error(`Errore: ${message}`);
      this._sendError(message);
    } else {
      this._logger.error('Errore sconosciuto');
      this._sendError('Errore sconosciuto');
    }
  }
  
  /**
   * Libera le risorse utilizzate dall'handler
   */
  public dispose(): void {
    super.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
    this._logger.debug('TaskQueueMessageHandler rilasciato');
  }
  
  /**
   * Gestisce una richiesta di stato della coda
   */
  private _handleGetQueueState(): void {
    const state = this._queueService.getQueueState();
    this._sendQueueState(state);
  }
  
  /**
   * Gestisce una richiesta di pulizia dei task completati
   */
  private _handleClearCompleted(): void {
    const count = this._queueService.clearCompletedTasks();
    this._logger.info(`${count} task completati rimossi`);
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di impostazione del filtro
   * @param message Messaggio con il filtro da impostare
   */
  private _handleSetFilter(message: TaskQueueSetFilterMessage): void {
    this._logger.debug(`Filtro impostato: ${message.payload.filter}`);
    // Gestione filtro (se necessario lato server)
  }
  
  /**
   * Invia lo stato della coda alla WebView
   * @param state Stato della coda
   */
  private _sendQueueState(state: TaskQueueState): void {
    if (!this._webview) {
      return;
    }
    
    this._webview.postMessage({
      type: TaskQueueMessageType.QUEUE_STATE_UPDATED,
      payload: state
    });
  }
  
  /**
   * Invia un messaggio di errore alla WebView
   * @param message Messaggio di errore
   */
  private _sendError(message: string): void {
    if (!this._webview) {
      return;
    }
    
    this._webview.postMessage({
      type: TaskQueueMessageType.ERROR,
      payload: {
        message
      }
    });
  }
  
  /**
   * Gestisce una richiesta di aggiunta di un task
   * @param message Messaggio con i dati del task da aggiungere
   */
  private _handleAddTask(message: TaskQueueAddTaskMessage): void {
    const { instruction, agentId, style, priority } = message.payload;
    
    if (!instruction || !agentId) {
      throw new Error('Dati del task incompleti');
    }
    
    const newTask = this._masManager.queueInstruction(
      agentId,
      instruction,
      style,
      priority || 'normal'
    );
    
    this._logger.info(`Task aggiunto: ${newTask.id}`);
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di rimozione di un task
   * @param message Messaggio con i dati del task da rimuovere
   */
  private _handleRemoveTask(message: TaskQueueRemoveTaskMessage): void {
    const { taskId } = message.payload;
    
    if (!taskId) {
      throw new Error('ID del task mancante');
    }
    
    const result = this._queueService.removeTask(taskId);
    
    if (result) {
      this._logger.info(`Task rimosso: ${taskId}`);
    } else {
      this._logger.warn(`Task non trovato: ${taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di aggiornamento di un task
   * @param message Messaggio con i dati dell'aggiornamento
   */
  private _handleUpdateTask(message: TaskQueueUpdateTaskMessage): void {
    const { taskId, status, details } = message.payload;
    
    if (!taskId || !status) {
      throw new Error('Dati di aggiornamento incompleti');
    }
    
    const result = this._queueService.updateTaskStatus(
      taskId,
      status,
      details
    );
    
    if (result) {
      this._logger.info(`Task aggiornato: ${taskId} -> ${status}`);
    } else {
      this._logger.warn(`Task non trovato o non aggiornabile: ${taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di annullamento di un task
   * @param message Messaggio con i dati del task da annullare
   */
  private _handleAbortTask(message: TaskQueueAbortTaskMessage): void {
    const { taskId } = message.payload;
    
    if (!taskId) {
      throw new Error('ID del task mancante');
    }
    
    const result = this._masManager.abortTask(taskId);
    
    if (result) {
      this._logger.info(`Task annullato: ${taskId}`);
    } else {
      this._logger.warn(`Impossibile annullare il task: ${taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di ri-esecuzione di un task
   * @param message Messaggio con i dati del task da ri-eseguire
   */
  private _handleRerunTask(message: TaskQueueRerunTaskMessage): void {
    const { task } = message.payload;
    
    if (!task || !task.instruction) {
      throw new Error('Dati del task mancanti');
    }
    
    try {
      // Crea un nuovo task con la stessa istruzione
      const newTask = this._masManager.queueInstruction(
        task.instruction.agentId,
        task.instruction.content,
        task.instruction.style,
        task.instruction.priority
      );
      
      this._logger.info(`Task ri-eseguito: ${task.id} -> ${newTask.id}`);
      this._sendQueueState(this._queueService.getQueueState());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error(`Errore nella ri-esecuzione del task: ${errorMessage}`);
      this._sendError(`Impossibile ri-eseguire il task: ${errorMessage}`);
    }
  }
} 