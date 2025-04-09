import * as vscode from 'vscode';
import type { WebviewMessageHandler } from './WebviewMessageHandler.js.js';
import { TaskQueueService } from '../../services/TaskQueueService.js.js';
import type { TaskQueueState, AgentStatus, Task } from '../../../webview-ui/shared/types.js.js';
import { Logger } from '../../utils/logger.js.js';
import { MasManager } from '../../mas/MasManager.js.js';

/**
 * Tipi di messaggi per la coda dei task
 */
enum TaskQueueMessageType {
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
 * Handler per i messaggi della coda dei task
 */
export class TaskQueueMessageHandler implements WebviewMessageHandler {
  private _webview: vscode.Webview | null = null;
  private _queueService: TaskQueueService;
  private _masManager: MasManager;
  private _logger: Logger;
  private _disposables: vscode.Disposable[] = [];
  
  /**
   * Costruttore dell'handler
   */
  constructor(masManager: MasManager) {
    this._queueService = TaskQueueService.getInstance();
    this._masManager = masManager;
    this._logger = new Logger('TaskQueueMessageHandler');
  }
  
  /**
   * Inizializza l'handler con la WebView
   * @param webview WebView a cui collegarsi
   */
  initialize(webview: vscode.Webview): void {
    this._webview = webview;
    this._registerEventHandlers();
    
    // Invia subito lo stato iniziale
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce un messaggio dalla WebView
   * @param message Messaggio ricevuto
   */
  handleMessage(message: any): void {
    if (!message || !message.type) {
      return;
    }
    
    try {
      switch (message.type) {
        case TaskQueueMessageType.GET_QUEUE_STATE:
          this._handleGetQueueState();
          break;
          
        case TaskQueueMessageType.ADD_TASK:
          this._handleAddTask(message.payload);
          break;
          
        case TaskQueueMessageType.REMOVE_TASK:
          this._handleRemoveTask(message.payload);
          break;
          
        case TaskQueueMessageType.UPDATE_TASK:
          this._handleUpdateTask(message.payload);
          break;
          
        case TaskQueueMessageType.CLEAR_COMPLETED:
          this._handleClearCompleted();
          break;
          
        case TaskQueueMessageType.ABORT_TASK:
          this._handleAbortTask(message.payload);
          break;
          
        case TaskQueueMessageType.RERUN_TASK:
          this._handleRerunTask(message.payload);
          break;
          
        case TaskQueueMessageType.SET_FILTER:
          this._handleSetFilter(message.payload);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error(`Errore nella gestione del messaggio: ${errorMessage}`);
      this._sendError(errorMessage);
    }
  }
  
  /**
   * Libera le risorse
   */
  dispose(): void {
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
  
  /**
   * Registra gli handler degli eventi
   */
  private _registerEventHandlers(): void {
    // Quando lo stato della coda cambia, invia un aggiornamento alla WebView
    this._disposables.push(
      this._queueService.onQueueChanged(state => {
        this._sendQueueState(state);
      })
    );
  }
  
  /**
   * Invia lo stato della coda alla WebView
   * @param state Stato della coda da inviare
   */
  private _sendQueueState(state: TaskQueueState): void {
    if (!this._webview) {
      return;
    }
    
    this._webview.postMessage({
      type: 'mas.taskQueue/update',
      payload: {
        queueState: state,
        agents: this._masManager.getAllAgentsStatus(),
        timestamp: new Date().toISOString()
      }
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
   * Gestisce una richiesta di stato della coda
   */
  private _handleGetQueueState(): void {
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di aggiunta di un task
   * @param data Dati del task da aggiungere
   */
  private _handleAddTask(data: any): void {
    if (!data || !data.instruction || !data.agentId) {
      throw new Error('Dati del task incompleti');
    }
    
    const newTask = this._masManager.queueInstruction(
      data.agentId,
      data.instruction,
      data.style,
      data.priority || 'normal'
    );
    
    this._logger.info(`Task aggiunto: ${newTask.id}`);
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di rimozione di un task
   * @param data Dati del task da rimuovere
   */
  private _handleRemoveTask(data: any): void {
    if (!data || !data.taskId) {
      throw new Error('ID del task mancante');
    }
    
    const result = this._queueService.removeTask(data.taskId);
    
    if (result) {
      this._logger.info(`Task rimosso: ${data.taskId}`);
    } else {
      this._logger.warn(`Task non trovato: ${data.taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di aggiornamento di un task
   * @param data Dati dell'aggiornamento
   */
  private _handleUpdateTask(data: any): void {
    if (!data || !data.taskId || !data.status) {
      throw new Error('Dati di aggiornamento incompleti');
    }
    
    const result = this._queueService.updateTaskStatus(
      data.taskId,
      data.status,
      data.details
    );
    
    if (result) {
      this._logger.info(`Task aggiornato: ${data.taskId} -> ${data.status}`);
    } else {
      this._logger.warn(`Task non trovato o non aggiornabile: ${data.taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di pulizia dei task completati
   */
  private _handleClearCompleted(): void {
    this._queueService.clearCompletedTasks();
    this._logger.info('Task completati rimossi dalla coda');
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di annullamento di un task
   * @param data Dati del task da annullare
   */
  private _handleAbortTask(data: any): void {
    if (!data || !data.taskId) {
      throw new Error('ID del task mancante');
    }
    
    const result = this._masManager.abortTask(data.taskId);
    
    if (result) {
      this._logger.info(`Task annullato: ${data.taskId}`);
    } else {
      this._logger.warn(`Impossibile annullare il task: ${data.taskId}`);
    }
    
    this._sendQueueState(this._queueService.getQueueState());
  }
  
  /**
   * Gestisce una richiesta di ri-esecuzione di un task
   * @param data Dati del task da ri-eseguire
   */
  private _handleRerunTask(data: any): void {
    if (!data || !data.task) {
      throw new Error('Dati del task mancanti');
    }
    
    try {
      const task = data.task;
      
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
  
  /**
   * Gestisce una richiesta di impostazione di filtri
   * @param data Dati dei filtri
   */
  private _handleSetFilter(data: any): void {
    this._logger.info(`Filtro impostato: ${JSON.stringify(data)}`);
    // Nota: al momento i filtri sono applicati solo sul lato client
    // Se vogliamo implementare il filtraggio lato server, dobbiamo aggiungere questa logica
    
    // Invia comunque un aggiornamento per confermare la ricezione del filtro
    this._sendQueueState(this._queueService.getQueueState());
  }
} 