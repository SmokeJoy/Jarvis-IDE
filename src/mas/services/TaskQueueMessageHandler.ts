import * as vscode from 'vscode';
import * as path from 'path';
import { MasManager } from '../MasManager';
import { AgentStatus } from '../../shared/types/mas.types';
import { WebviewMessage } from '../../types/webview.types';
import { Logger } from '../../utils/logger';
import { TaskQueueService } from './TaskQueueService';

// Definiamo interfacce per i messaggi specifici se non esistono nei file centralizzati
interface TaskQueueViewMessage extends WebviewMessage {
  type: 'mas.taskQueue/update';
  payload: {
    queueState: any;
    agents: AgentStatus[];
    timestamp: string;
  };
}

interface AbortTaskMessage extends WebviewMessage {
  type: 'mas.taskQueue/abortTask';
  payload: {
    taskId: string;
  };
}

interface RerunTaskMessage extends WebviewMessage {
  type: 'mas.taskQueue/rerunTask';
  payload: {
    task: any;
  };
}

interface RequestUpdateMessage extends WebviewMessage {
  type: 'mas.taskQueue/requestUpdate';
}

interface SetFilterMessage extends WebviewMessage {
  type: 'mas.taskQueue/setFilter';
  payload: any;
}

// Tipo unione per tutti i messaggi supportati
type AllWebViewMessages =
  | TaskQueueViewMessage
  | AbortTaskMessage
  | RerunTaskMessage
  | RequestUpdateMessage
  | SetFilterMessage;

/**
 * Gestore di messaggi per la WebView della coda dei task
 */
export class TaskQueueMessageHandler {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private masManager: MasManager;
  private logger: Logger;
  private updateTimer: NodeJS.Timeout | undefined;
  private taskQueueService: TaskQueueService;

  /**
   * Costruttore del gestore di messaggi
   * @param context Contesto dell'estensione
   * @param masManager Gestore del sistema MAS
   */
  constructor(context: vscode.ExtensionContext, masManager: MasManager) {
    this.context = context;
    this.masManager = masManager;
    this.logger = new Logger('TaskQueueMessageHandler');
    this.taskQueueService = new TaskQueueService(context, masManager);

    // Registra i listener per gli eventi del MasManager
    this.registerEventListeners();
  }

  /**
   * Registra i listener per gli eventi del MasManager
   */
  private registerEventListeners(): void {
    // Registra listener per aggiornamenti nella coda dei task
    this.masManager.on('task-started', () => this.updateQueueView());
    this.masManager.on('task-aborted', () => this.updateQueueView());
    this.masManager.on('instruction-queued', () => this.updateQueueView());
    this.masManager.on('instruction-completed', () => this.updateQueueView());
    this.masManager.on('agent-updated', () => this.updateQueueView());
    this.masManager.on('agent-registered', () => this.updateQueueView());
  }

  /**
   * Ottiene l'istanza del servizio della coda dei task
   */
  public getTaskQueueService(): TaskQueueService {
    return this.taskQueueService;
  }

  /**
   * Aggiorna la vista della coda dei task
   */
  private updateQueueView(): void {
    if (!this.panel) {
      return;
    }

    // Ottieni tutti i task nel sistema
    const allTasks = this.masManager.getAllTasks();

    // Ottieni lo stato corrente dal MasManager
    const masQueueState = this.masManager.getTaskQueueState();
    const agents = this.masManager.getAllAgentsStatus();

    // Converti lo stato per la WebView utilizzando gli array di task
    const queueState = {
      total: allTasks.length,
      pending: allTasks.filter((task) => task.status === 'pending').length,
      active: masQueueState.active || null,
      completed: allTasks.filter((task) => task.status === 'completed').length,
      failed: allTasks.filter((task) => task.status === 'failed').length,
      priorityDistribution: {
        high: allTasks.filter(
          (task) => task.status === 'pending' && task.instruction.priority === 'high'
        ),
        normal: allTasks.filter(
          (task) =>
            task.status === 'pending' &&
            (task.instruction.priority === 'normal' || !task.instruction.priority)
        ),
        low: allTasks.filter(
          (task) => task.status === 'pending' && task.instruction.priority === 'low'
        ),
      },
    };

    // Invia l'aggiornamento alla WebView
    const message: TaskQueueViewMessage = {
      type: 'mas.taskQueue/update',
      payload: {
        queueState: queueState,
        agents: agents,
        timestamp: new Date().toISOString(),
      },
    };

    this.panel.webview.postMessage(message);
  }

  /**
   * Gestisce i messaggi ricevuti dalla WebView
   * @param message Messaggio ricevuto
   */
  private handleWebviewMessage(message: any): void {
    if (!message || !message.type) {
      return;
    }

    this.logger.debug(`Ricevuto messaggio WebView: ${message.type}`);

    try {
      const webviewMessage = message as AllWebViewMessages;

      switch (webviewMessage.type) {
        case 'mas.taskQueue/requestUpdate':
          this.handleRequestUpdate();
          break;

        case 'mas.taskQueue/abortTask':
          this.handleAbortTask(webviewMessage as AbortTaskMessage);
          break;

        case 'mas.taskQueue/rerunTask':
          this.handleRerunTask(webviewMessage as RerunTaskMessage);
          break;

        case 'mas.taskQueue/setFilter':
          this.handleSetFilter(webviewMessage as SetFilterMessage);
          break;

        default:
          this.logger.warn(`Tipo di messaggio non supportato: ${webviewMessage.type}`);
          break;
      }
    } catch (error) {
      this.logger.error('Errore durante la gestione del messaggio', error);
    }
  }

  /**
   * Gestisce la richiesta di aggiornamento della vista
   */
  private handleRequestUpdate(): void {
    this.updateQueueView();
  }

  /**
   * Gestisce la richiesta di annullamento di un task
   * @param message Messaggio di annullamento
   */
  private handleAbortTask(message: AbortTaskMessage): void {
    const taskId = message.payload.taskId;

    if (!taskId) {
      this.logger.warn('ID task mancante nella richiesta di annullamento');
      return;
    }

    this.logger.debug(`Richiesta di annullamento del task: ${taskId}`);
    const aborted = this.masManager.abortTask(taskId);

    if (!aborted) {
      this.logger.warn(`Impossibile annullare il task: ${taskId}`);
    }
  }

  /**
   * Gestisce la richiesta di ri-esecuzione di un task
   * @param message Messaggio di ri-esecuzione
   */
  private handleRerunTask(message: RerunTaskMessage): void {
    const task = message.payload.task;

    if (!task || !task.instruction) {
      this.logger.warn('Task o istruzione mancante nella richiesta di ri-esecuzione');
      return;
    }

    this.logger.debug(`Richiesta di ri-esecuzione del task: ${task.id}`);

    try {
      // Usa le stesse impostazioni del task originale per crearne uno nuovo
      const newTask = this.masManager.queueInstruction(
        task.instruction.agentId,
        task.instruction.content,
        task.instruction.style,
        task.instruction.priority
      );

      this.logger.debug(`Nuovo task creato: ${newTask.id}`);
    } catch (error) {
      this.logger.error('Errore durante la ri-esecuzione del task', error);
    }
  }

  /**
   * Gestisce la richiesta di impostazione dei filtri
   * @param message Messaggio di impostazione filtri
   */
  private handleSetFilter(message: SetFilterMessage): void {
    // Questa funzione può essere implementata in futuro per applicare
    // filtri anche lato server se necessario
    this.logger.debug(`Ricevute impostazioni filtro: ${JSON.stringify(message.payload)}`);
  }

  /**
   * Avvia l'aggiornamento automatico della vista
   */
  private startAutoUpdate(): void {
    // Aggiorna la vista ogni 5 secondi
    this.updateTimer = setInterval(() => {
      this.updateQueueView();
    }, 5000);
  }
}
