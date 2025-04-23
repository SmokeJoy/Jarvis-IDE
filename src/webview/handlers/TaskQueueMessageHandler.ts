import { ExtensionContext } from 'vscode';
import { BaseWebviewMessageHandler } from './BaseWebviewMessageHandler';
import { WebviewMessage, WebviewMessageType } from '../../shared/types/webview.types';
import { TaskQueueState, TaskStatus } from '../../shared/types/task-queue.types';
import { TaskQueueService } from '../../services/TaskQueueService';
import { MasManager } from '../../mas/MasManager';
import { Logger } from '../../utils/logger';

export enum TaskQueueMessageType {
  STATE = 'taskQueueState',
  ERROR = 'taskQueueError',
  CLEAR = 'taskQueueClear',
  PAUSE = 'taskQueuePause',
  RESUME = 'taskQueueResume',
  ABORT = 'taskQueueAbort',
  RETRY = 'taskQueueRetry',
  REMOVE = 'taskQueueRemove',
  UPDATE = 'taskQueueUpdate',
}

export interface TaskQueueStateMessage extends WebviewMessage<TaskQueueMessageType.STATE> {
  type: TaskQueueMessageType.STATE;
  payload: TaskQueueState;
}

export interface TaskQueueErrorMessage extends WebviewMessage<TaskQueueMessageType.ERROR> {
  type: TaskQueueMessageType.ERROR;
  payload: {
    message: string;
    code?: string;
  };
}

export interface TaskQueueClearMessage extends WebviewMessage<TaskQueueMessageType.CLEAR> {
  type: TaskQueueMessageType.CLEAR;
}

export interface TaskQueuePauseMessage extends WebviewMessage<TaskQueueMessageType.PAUSE> {
  type: TaskQueueMessageType.PAUSE;
}

export interface TaskQueueResumeMessage extends WebviewMessage<TaskQueueMessageType.RESUME> {
  type: TaskQueueMessageType.RESUME;
}

export interface TaskQueueAbortMessage extends WebviewMessage<TaskQueueMessageType.ABORT> {
  type: TaskQueueMessageType.ABORT;
}

export interface TaskQueueRetryMessage extends WebviewMessage<TaskQueueMessageType.RETRY> {
  type: TaskQueueMessageType.RETRY;
  payload: {
    taskId: string;
  };
}

export interface TaskQueueRemoveMessage extends WebviewMessage<TaskQueueMessageType.REMOVE> {
  type: TaskQueueMessageType.REMOVE;
  payload: {
    taskId: string;
  };
}

export interface TaskQueueUpdateMessage extends WebviewMessage<TaskQueueMessageType.UPDATE> {
  type: TaskQueueMessageType.UPDATE;
  payload: {
    taskId: string;
    status: TaskStatus;
    error?: string;
  };
}

export type TaskQueueMessage =
  | TaskQueueStateMessage
  | TaskQueueErrorMessage
  | TaskQueueClearMessage
  | TaskQueuePauseMessage
  | TaskQueueResumeMessage
  | TaskQueueAbortMessage
  | TaskQueueRetryMessage
  | TaskQueueRemoveMessage
  | TaskQueueUpdateMessage;

/**
 * Type guard per verificare se un messaggio è un messaggio della coda dei task
 */
function isTaskQueueMessage(message: WebviewMessage): boolean {
  return message.type.startsWith('taskQueue:');
}

/**
 * Handler per i messaggi della coda dei task
 */
export class TaskQueueMessageHandler extends BaseWebviewMessageHandler {
  private _queueService: TaskQueueService;
  private _masManager: MasManager;
  private _logger: Logger;

  constructor(context: ExtensionContext, masManager: MasManager) {
    super(context);
    this._masManager = masManager;
    this._queueService = masManager.queueService;
    this._logger = new Logger('TaskQueueMessageHandler');
  }

  handleMessage(message: WebviewMessage): void {
    if (!isTaskQueueMessage(message)) {
      return;
    }

    switch (message.type) {
      case 'taskQueue:state':
        this._handleStateRequest();
        break;
      case 'taskQueue:clear':
        this._handleClearRequest();
        break;
      case 'taskQueue:abort':
        this._handleAbortRequest();
        break;
      case 'taskQueue:retry':
        if (
          (msg.payload as unknown) &&
          typeof (msg.payload as unknown) === 'object' &&
          'taskId' in (msg.payload as unknown) &&
          typeof ((msg.payload as unknown) as { taskId?: unknown }).taskId === 'string'
        ) {
          this._handleRetryRequest(((msg.payload as unknown) as { taskId: string }).taskId);
        }
        break;
      case 'taskQueue:remove':
        if (
          (msg.payload as unknown) &&
          typeof (msg.payload as unknown) === 'object' &&
          'taskId' in (msg.payload as unknown) &&
          typeof ((msg.payload as unknown) as { taskId?: unknown }).taskId === 'string'
        ) {
          this._handleRemoveRequest(((msg.payload as unknown) as { taskId: string }).taskId);
        }
        break;
      case 'taskQueue:update': {
        const updatePayload = (msg.payload as unknown) as { taskId?: string; status?: unknown };
        if (updatePayload && typeof updatePayload.taskId === 'string' && updatePayload.status) {
          this._handleUpdateRequest(updatePayload.taskId, updatePayload.status as TaskStatus);
        }
        break;
      }
      default:
        this._logger.warn(`Unhandled task queue message type: ${message.type}`);
    }
  }

  private _handleStateRequest(): void {
    this._sendQueueState(this._queueService.state);
  }

  private _handleClearRequest(): void {
    this._queueService.clear();
    this._sendQueueState(this._queueService.state);
  }

  private _handleAbortRequest(): void {
    this._queueService.abort();
    this._sendQueueState(this._queueService.state);
  }

  private _handleRetryRequest(taskId: string): void {
    const result = this._masManager.retryTask(taskId);
    if (!result) {
      this._sendError('Failed to retry task');
      return;
    }
    this._sendQueueState(this._queueService.state);
  }

  private _handleRemoveRequest(taskId: string): void {
    this._queueService.removeTask(taskId);
    this._sendQueueState(this._queueService.state);
  }

  private _handleUpdateRequest(taskId: string, status: TaskStatus): void {
    this._updateTaskStatus(taskId, status);
    this._sendMessage({
      type: WebviewMessageType.TASK_QUEUE_UPDATE,
      payload: { tasks: this._getTasksPayload() },
    });
  }

  private _sendQueueState(state: TaskQueueState): void {
    this._sendMessage({
      type: 'taskQueue:state',
      payload: state,
    });
  }

  private _updateTaskStatus(taskId: string, status: TaskStatus): void {
    this._queueService.updateTaskStatus(taskId, status);
    this._sendQueueState(this._queueService.state);
  }

  private _getTasksPayload(): any[] {
    // Implement the logic to get tasks payload
    return [];
  }
}
