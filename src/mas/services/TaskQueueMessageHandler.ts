/**
 * @file TaskQueueMessageHandler.ts
 * @description Gestore dei messaggi per la TaskQueue - Jarvis IDE
 * @version 2.0.0 - Conforme alle linee guida MAS
 */

import * as vscode from 'vscode';
import { MasManager } from '../MasManager';
import { AgentStatus } from '../../shared/types/mas.types';
import { Logger } from '../../utils/logger';
import { TaskQueueService } from './TaskQueueService';
import { registerHandler } from '../../core/dispatcher/WebviewDispatcher';
import { WebviewMessageUnion } from '@shared/messages';

/**
 * Definizioni dei tipi di messaggi specifici per la TaskQueue usando Extract
 */
type RequestUpdateMessage = Extract<WebviewMessageUnion, { type: 'mas.taskQueue/requestUpdate' }>;
type AbortTaskMessage = Extract<WebviewMessageUnion, { type: 'mas.taskQueue/abortTask' }>;
type RerunTaskMessage = Extract<WebviewMessageUnion, { type: 'mas.taskQueue/rerunTask' }>;
type SetFilterMessage = Extract<WebviewMessageUnion, { type: 'mas.taskQueue/setFilter' }>;

/**
 * Gestore di messaggi per la WebView della coda dei task
 */
export class TaskQueueMessageHandler {
  private logger: Logger;
  private taskQueueService: TaskQueueService;

  /**
   * Costruttore del gestore di messaggi
   * @param context Contesto dell'estensione
   * @param masManager Gestore del sistema MAS
   */
  constructor(
    private context: vscode.ExtensionContext,
    private masManager: MasManager
  ) {
    this.logger = new Logger('TaskQueueMessageHandler');
    this.taskQueueService = new TaskQueueService(context, masManager);

    // Registra i listener per gli eventi del MasManager
    this.registerEventListeners();

    // Registrazione handler centralizzati
    this.registerMessageHandlers();
  }

  /**
   * Registra i listener per gli eventi del MasManager
   */
  private registerEventListeners(): void {
    // Registra listener per aggiornamenti nella coda dei task
    this.masManager.on('task-started', () => this.taskQueueService.updateQueueView());
    this.masManager.on('task-aborted', () => this.taskQueueService.updateQueueView());
    this.masManager.on('instruction-queued', () => this.taskQueueService.updateQueueView());
    this.masManager.on('instruction-completed', () => this.taskQueueService.updateQueueView());
    this.masManager.on('agent-updated', () => this.taskQueueService.updateQueueView());
    this.masManager.on('agent-registered', () => this.taskQueueService.updateQueueView());
  }

  /**
   * Registra gli handler per i messaggi della TaskQueue
   */
  private registerMessageHandlers(): void {
    // Handler per la richiesta di aggiornamento della coda dei task
    registerHandler('mas.taskQueue/requestUpdate', (msg: WebviewMessageUnion) => {
      if (msg.type === 'mas.taskQueue/requestUpdate') {
        this.logger.debug('Ricevuta richiesta di aggiornamento coda task');
        this.taskQueueService.updateQueueView();
      }
    });

    // Handler per l'annullamento di un task
    registerHandler('mas.taskQueue/abortTask', (msg: WebviewMessageUnion) => {
      if (msg.type === 'mas.taskQueue/abortTask' && (msg.payload as unknown) && typeof (msg.payload as unknown) === 'object') {
        const taskId = (msg.payload as unknown).taskId;
        if (typeof taskId === 'string') {
          this.logger.debug(`Ricevuta richiesta di annullamento task: ${taskId}`);
          this.taskQueueService.abortTask(taskId);
        } else {
          this.logger.warn('Ricevuta richiesta di annullamento task senza ID valido');
        }
      }
    });

    // Handler per la ri-esecuzione di un task
    registerHandler('mas.taskQueue/rerunTask', (msg: WebviewMessageUnion) => {
      if (msg.type === 'mas.taskQueue/rerunTask' && (msg.payload as unknown) && typeof (msg.payload as unknown) === 'object') {
        const task = (msg.payload as unknown).task;
        if (task && typeof task === 'object') {
          this.logger.debug(`Ricevuta richiesta di ri-esecuzione task: ${task.id}`);
          this.taskQueueService.handleRerunTask(task);
        } else {
          this.logger.warn('Ricevuta richiesta di ri-esecuzione task senza task valido');
        }
      }
    });

    // Handler per l'impostazione dei filtri della coda dei task
    registerHandler('mas.taskQueue/setFilter', (msg: WebviewMessageUnion) => {
      if (msg.type === 'mas.taskQueue/setFilter' && (msg.payload as unknown)) {
        this.logger.debug(`Ricevute impostazioni filtro: ${JSON.stringify((msg.payload as unknown))}`);
        // Utilizza il metodo handleSetFilter se disponibile o implementa la logica necessaria
        if (typeof this.taskQueueService.handleSetFilter === 'function') {
          this.taskQueueService.handleSetFilter((msg.payload as unknown));
        } else {
          this.logger.debug('Filtro ricevuto ma handleSetFilter non implementato');
        }
      }
    });
  }

  /**
   * Ottiene l'istanza del servizio della coda dei task
   */
  public getTaskQueueService(): TaskQueueService {
    return this.taskQueueService;
  }
}
