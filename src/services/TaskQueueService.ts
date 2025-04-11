import * as vscode from 'vscode';
import { Logger } from '../utils/logger.js';
import type { Task, TaskQueueState, TaskStatus } from '../../webview-ui/shared/types.js';

/**
 * Servizio per la gestione della coda dei task
 */
export class TaskQueueService {
  private static instance: TaskQueueService;
  private _tasks: Task[] = [];
  private _onQueueChanged = new vscode.EventEmitter<TaskQueueState>();
  private _currentTask: Task | null = null;
  private _logger: Logger;

  /**
   * Evento emesso quando lo stato della coda cambia
   */
  readonly onQueueChanged = this._onQueueChanged.event;

  private constructor() {
    this._logger = new Logger('TaskQueueService');
    this._logger.debug('TaskQueueService inizializzato');
  }

  /**
   * Ottiene l'istanza singleton del servizio
   */
  static getInstance(): TaskQueueService {
    if (!TaskQueueService.instance) {
      TaskQueueService.instance = new TaskQueueService();
    }
    return TaskQueueService.instance;
  }

  /**
   * Aggiunge un task alla coda
   * @param task Task da aggiungere
   */
  addTask(task: Task): void {
    this._tasks.push(task);
    this._logger.debug(`Task aggiunto alla coda: ${task.id}`);
    this.notifyQueueChanged();
  }

  /**
   * Ottiene un task dalla coda
   * @param taskId ID del task da ottenere
   */
  getTask(taskId: string): Task | undefined {
    return this._tasks.find(task => task.id === taskId);
  }

  /**
   * Ottiene tutti i task nella coda
   */
  getAllTasks(): Task[] {
    return [...this._tasks];
  }

  /**
   * Rimuove un task dalla coda
   * @param taskId ID del task da rimuovere
   */
  removeTask(taskId: string): boolean {
    const initialLength = this._tasks.length;
    this._tasks = this._tasks.filter(task => task.id !== taskId);
    
    if (this._tasks.length !== initialLength) {
      this._logger.debug(`Task rimosso dalla coda: ${taskId}`);
      this.notifyQueueChanged();
      return true;
    }
    
    return false;
  }

  /**
   * Aggiorna lo stato di un task
   * @param taskId ID del task da aggiornare
   * @param status Nuovo stato del task
   * @param details Dettagli aggiuntivi per l'aggiornamento
   */
  updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    details?: Partial<Task>
  ): boolean {
    const task = this.getTask(taskId);
    
    if (!task) {
      return false;
    }

    task.status = status;
    
    if (details) {
      Object.assign(task, details);
    }

    switch (status) {
      case 'active':
        task.startedAt = task.startedAt || new Date();
        this._currentTask = task;
        break;
      case 'completed':
      case 'failed':
      case 'aborted':
        task.completedAt = task.completedAt || new Date();
        if (this._currentTask?.id === taskId) {
          this._currentTask = null;
        }
        break;
    }

    this._logger.debug(`Task ${taskId} aggiornato a ${status}`);
    this.notifyQueueChanged();
    return true;
  }

  /**
   * Ottiene il prossimo task da eseguire
   */
  getNextPendingTask(): Task | null {
    // Prima cerca task con priorità alta
    let nextTask = this._tasks.find(
      task => task.status === 'pending' && task.instruction.priority === 'high'
    );

    // Se non ci sono task con priorità alta, cerca quelli con priorità normale
    if (!nextTask) {
      nextTask = this._tasks.find(
        task => task.status === 'pending' && 
          (task.instruction.priority === 'normal' || !task.instruction.priority)
      );
    }

    // Se non ci sono task con priorità normale, cerca quelli con priorità bassa
    if (!nextTask) {
      nextTask = this._tasks.find(
        task => task.status === 'pending' && task.instruction.priority === 'low'
      );
    }

    return nextTask || null;
  }

  /**
   * Ottiene lo stato corrente della coda
   */
  getQueueState(): TaskQueueState {
    const pendingTasks = this._tasks.filter(task => task.status === 'pending');
    const completedTasks = this._tasks.filter(task => task.status === 'completed');
    const failedTasks = this._tasks.filter(task => task.status === 'failed' || task.status === 'aborted');

    // Raggruppa i task per priorità
    const highPriorityTasks = pendingTasks.filter(
      task => task.instruction.priority === 'high'
    );
    const normalPriorityTasks = pendingTasks.filter(
      task => task.instruction.priority === 'normal' || !task.instruction.priority
    );
    const lowPriorityTasks = pendingTasks.filter(
      task => task.instruction.priority === 'low'
    );

    return {
      total: this._tasks.length,
      pending: pendingTasks.length,
      active: this._currentTask,
      completed: completedTasks.length,
      failed: failedTasks.length,
      priorityDistribution: {
        high: highPriorityTasks,
        normal: normalPriorityTasks,
        low: lowPriorityTasks
      }
    };
  }

  /**
   * Cancella tutti i task completati dalla coda
   */
  clearCompletedTasks(): void {
    const initialLength = this._tasks.length;
    this._tasks = this._tasks.filter(
      task => task.status !== 'completed' && task.status !== 'failed' && task.status !== 'aborted'
    );
    
    if (this._tasks.length !== initialLength) {
      this._logger.debug('Task completati rimossi dalla coda');
      this.notifyQueueChanged();
    }
  }

  /**
   * Notifica i listener che lo stato della coda è cambiato
   */
  private notifyQueueChanged(): void {
    this._onQueueChanged.fire(this.getQueueState());
  }
} 