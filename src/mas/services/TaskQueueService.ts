import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MasManager } from '../MasManager.js';
import { Task, TaskStatus } from '../../shared/types/mas.types.js';
import type { TaskQueueViewMessage } from '../../shared/types/webview.types.js';
import { MasPersistenceService } from './MasPersistenceService.js';
import { Logger } from '../../utils/logger.js';

/**
 * Servizio che gestisce la comunicazione tra il backend MAS e la WebView
 * per la visualizzazione e il controllo della coda dei task
 */
export class TaskQueueService {
  // Pannello WebView
  private panel: vscode.WebviewPanel | undefined;
  
  // Intervallo di aggiornamento automatico (in ms)
  private static readonly UPDATE_INTERVAL = 2000;
  
  // Timer per l'aggiornamento automatico
  private updateTimer: NodeJS.Timeout | undefined;

  // Logger
  private logger: Logger;

  // Servizio di persistenza
  private persistenceService: MasPersistenceService;
  
  /**
   * Costruttore del TaskQueueService
   * @param context Contesto dell'estensione VS Code
   * @param masManager Istanza del MasManager
   */
  constructor(
    private context: vscode.ExtensionContext,
    private masManager: MasManager
  ) {
    this.logger = new Logger('TaskQueueService');
    this.persistenceService = MasPersistenceService.getInstance();
    
    // Registra gli handler per gli eventi del MAS Manager
    this.registerEventHandlers();

    // Carica lo stato salvato, se presente
    this.loadPersistedState();

    // Avvia il salvataggio automatico
    this.startAutoSave();
  }
  
  /**
   * Registra gli handler per gli eventi emessi dal MAS Manager
   */
  private registerEventHandlers(): void {
    // Quando un'istruzione viene messa in coda
    this.masManager.on('instruction-queued', () => {
      this.updateQueueView();
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });
    
    // Quando un task inizia
    this.masManager.on('task-started', () => {
      this.updateQueueView();
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });
    
    // Quando un'istruzione viene completata
    this.masManager.on('instruction-completed', () => {
      this.updateQueueView();
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });
    
    // Quando un task viene abortito
    this.masManager.on('task-aborted', () => {
      this.updateQueueView();
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });
    
    // Quando un agente viene aggiornato (potrebbe interessare la vista)
    this.masManager.on('agent-updated', () => {
      this.updateQueueView();
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });

    // Quando un agente viene registrato
    this.masManager.on('agent-registered', () => {
      this.saveState(); // Salva lo stato dopo ogni cambiamento
    });
  }
  
  /**
   * Avvia il salvataggio automatico dello stato
   */
  private startAutoSave(): void {
    // Ottieni i task e gli agenti aggiornati quando richiesto
    const getTasks = () => this.masManager.getAllTasks();
    const getAgents = () => this.masManager.getAllAgentsStatus();
    
    // Avvia il salvataggio automatico ogni minuto
    this.persistenceService.startAutoSave(getTasks, getAgents, 60000);
    this.logger.info('Salvataggio automatico dello stato MAS attivato');
  }

  /**
   * Salva lo stato attuale su disco
   */
  public saveState(): void {
    const tasks = this.masManager.getAllTasks();
    const agents = this.masManager.getAllAgentsStatus();
    
    const saved = this.persistenceService.saveState(tasks, agents);
    if (saved) {
      this.logger.debug('Stato MAS salvato con successo');
    }
  }

  /**
   * Carica lo stato salvato dal disco
   */
  private loadPersistedState(): void {
    const state = this.persistenceService.loadState();
    
    if (state) {
      try {
        this.logger.info(`Caricamento di ${state.tasks.length} task e ${state.agents.length} agenti dal disco`);
        
        // Ripristina i task non completati
        for (const task of state.tasks) {
          // Se il task era in esecuzione quando è stato salvato, segnalo come interrotto
          if (task.status === 'active') {
            task.status = 'aborted';
            task.error = 'Task interrotto a causa di chiusura dell\'applicazione';
            if (!task.completedAt) {
              task.completedAt = new Date();
            }
          }
          
          // Aggiungi il task al MasManager se non è completato/fallito/abortito
          if (task.status === 'pending') {
            // TODO: Implementare la logica per ripristinare i task pendenti
            this.logger.debug(`Ripristino task pendente: ${task.id}`);
          }
        }
        
        // TODO: Ripristina lo stato degli agenti
        
        this.logger.info('Stato MAS ripristinato con successo');
      } catch (error) {
        this.logger.error(`Errore nel ripristino dello stato MAS: ${error}`);
      }
    } else {
      this.logger.info('Nessuno stato MAS salvato trovato');
    }
  }
  
  /**
   * Apre il pannello di visualizzazione della coda dei task
   */
  public openTaskQueueView(): void {
    // Se il pannello esiste già, mostralo
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    
    // Crea un nuovo pannello WebView
    this.panel = vscode.window.createWebviewPanel(
      'taskQueueView',
      'Coda dei Task MAS',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionUri.fsPath, 'out')),
          vscode.Uri.file(path.join(this.context.extensionUri.fsPath, 'webview-ui/build'))
        ]
      }
    );
    
    // Imposta il contenuto HTML del pannello
    this.panel.webview.html = this.getWebviewContent(this.panel.webview);
    
    // Gestisci i messaggi ricevuti dalla WebView
    this.panel.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this.context.subscriptions
    );
    
    // Gestisci la chiusura del pannello
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = undefined;
      }
    }, null, this.context.subscriptions);
    
    // Avvia l'aggiornamento automatico
    this.startAutoUpdate();
    
    // Invia lo stato iniziale
    this.updateQueueView();
  }
  
  /**
   * Avvia l'aggiornamento automatico della WebView
   */
  private startAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      this.updateQueueView();
    }, TaskQueueService.UPDATE_INTERVAL);
  }
  
  /**
   * Gestisce i messaggi ricevuti dalla WebView
   * @param message Messaggio ricevuto
   */
  private handleWebviewMessage(message: any): void {
    switch (message.type) {
      case 'mas.taskQueue/abortTask':
        this.handleAbortTask(message.payload.taskId);
        break;
        
      case 'mas.taskQueue/rerunTask':
        this.handleRerunTask(message.payload.task);
        break;
        
      case 'mas.taskQueue/requestUpdate':
        this.updateQueueView();
        break;
        
      case 'mas.taskQueue/setFilter':
        // Filtraggio implementato sul lato client, nessuna azione necessaria
        break;
        
      default:
        console.log(`Messaggio non gestito: ${message.type}`);
    }
  }
  
  /**
   * Gestisce la richiesta di annullamento di un task
   * @param taskId ID del task da annullare
   */
  private handleAbortTask(taskId: string): void {
    if (this.masManager.getTaskQueueState().active?.id === taskId) {
      // Invia un messaggio all'agente per annullare il task
      const activeTask = this.masManager.getTaskQueueState().active;
      if (activeTask && activeTask.assignedTo) {
        this.masManager.sendMessage({
          to: activeTask.assignedTo,
          payload: 'abort'
        });
        
        // Feedback all'utente
        vscode.window.showInformationMessage(`Task ${taskId} annullato con successo`);
      }
    } else {
      // Il task è in coda, usa il metodo di annullamento diretto
      // Ottiene i task pendenti dall'array ritornato da getAllTasks
      const tasks = this.masManager.getAllTasks();
      const pendingTasks = tasks.filter(task => task.status === 'pending');
      const taskIds = pendingTasks.map(task => task.id);
      
      if (taskIds.includes(taskId)) {
        // Annulla il task tramite il TaskQueueManager
        const aborted = this.masManager.abortTask(taskId);
        
        if (aborted) {
          vscode.window.showInformationMessage(`Task ${taskId} rimosso dalla coda con successo`);
        } else {
          vscode.window.showWarningMessage(`Impossibile trovare il task ${taskId} nella coda`);
        }
      } else {
        vscode.window.showWarningMessage(`Task ${taskId} non trovato nella coda attiva`);
      }
    }
    
    // Dopo aver abortito il task, salva lo stato
    this.saveState();
    
    // Aggiorna la vista
    this.updateQueueView();
  }
  
  /**
   * Gestisce la richiesta di ri-esecuzione di un task completato o fallito
   * @param task Task da ri-eseguire
   */
  private handleRerunTask(task: Task): void {
    try {
      // Crea un nuovo task basato sul precedente
      const newTask = this.masManager.queueInstruction(
        task.assignedTo || 'coder-agent',
        task.instruction.content,
        task.instruction.style,
        task.instruction.priority
      );
      
      // Feedback all'utente
      vscode.window.showInformationMessage(`Task ri-eseguito con ID: ${newTask.id}`);
      
      // Avvia l'elaborazione se non è già in corso
      this.masManager.start();
      
      // Dopo aver ri-eseguito il task, salva lo stato
      this.saveState();
      
      // Aggiorna la vista
      this.updateQueueView();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Errore nella ri-esecuzione del task: ${error.message}`);
    }
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
      pending: allTasks.filter(task => task.status === 'pending').length,
      active: masQueueState.active || null,
      completed: allTasks.filter(task => task.status === 'completed').length,
      failed: allTasks.filter(task => task.status === 'failed').length,
      priorityDistribution: {
        high: allTasks.filter(task => task.status === 'pending' && task.instruction.priority === 'high'),
        normal: allTasks.filter(task => task.status === 'pending' && (task.instruction.priority === 'normal' || !task.instruction.priority)),
        low: allTasks.filter(task => task.status === 'pending' && task.instruction.priority === 'low')
      }
    };
    
    // Prepara i dati da inviare alla WebView
    const message: TaskQueueViewMessage = {
      type: 'mas.taskQueue/update',
      payload: {
        queueState,
        agents,
        timestamp: new Date().toISOString()
      }
    };
    
    // Invia il messaggio alla WebView
    this.panel.webview.postMessage(message);
  }
  
  /**
   * Restituisce il contenuto HTML della WebView
   * @param webview Istanza della WebView
   * @returns Contenuto HTML
   */
  private getWebviewContent(webview: vscode.Webview): string {
    // In un ambiente di produzione, questo caricherebbe il bundle React
    // Per ora, restituiamo una pagina HTML di base
    return `<!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coda dei Task MAS</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
            }
            .container {
                max-width: 100%;
                margin: 0 auto;
            }
            h1 {
                color: var(--vscode-editor-foreground);
                font-size: 24px;
                margin-bottom: 20px;
            }
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 200px;
                font-size: 18px;
            }
            #task-queue-app {
                width: 100%;
            }
            .placeholder {
                text-align: center;
                padding: 50px;
                background: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 4px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Sistema Multi-Agent: Coda dei Task</h1>
            <div id="task-queue-app">
                <div class="placeholder">
                    <p>Caricamento dell'interfaccia della coda dei task...</p>
                    <p>Se questa schermata persiste, potrebbe esserci un problema nel caricamento dell'UI React.</p>
                </div>
            </div>
        </div>
        <script>
            (function() {
                // Inizializza la comunicazione con l'estensione
                const vscode = acquireVsCodeApi();
                
                // Richiedi un aggiornamento all'avvio
                vscode.postMessage({
                    type: 'mas.taskQueue/requestUpdate'
                });
                
                // Listener per i messaggi dall'estensione
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    // Aggiornamento dello stato della coda
                    if (message.type === 'mas.taskQueue/update') {
                        // Qui verrà gestito l'aggiornamento quando implementeremo React
                        console.log('Aggiornamento ricevuto:', message.payload);
                        
                        // Per ora, mostriamo alcune informazioni di base
                        const appElement = document.getElementById('task-queue-app');
                        const queueState = message.payload.queueState;
                        
                        appElement.innerHTML = \`
                            <div style="background: var(--vscode-editor-inactiveSelectionBackground); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <h2>Stato della Coda</h2>
                                <p>Task in attesa: <strong>\${queueState.pending}</strong></p>
                                <p>Task attivo: <strong>\${queueState.active ? 'Sì' : 'No'}</strong></p>
                                <p>Task completati: <strong>\${queueState.completed}</strong></p>
                                <p>Task falliti: <strong>\${queueState.failed}</strong></p>
                            </div>
                            <div style="text-align: center; margin-top: 30px;">
                                <p>L'interfaccia completa con React verrà implementata presto.</p>
                                <button onclick="requestUpdate()">Aggiorna stato</button>
                            </div>
                        \`;
                    }
                });
                
                // Funzione per richiedere un aggiornamento
                window.requestUpdate = function() {
                    vscode.postMessage({
                        type: 'mas.taskQueue/requestUpdate'
                    });
                };
            }());
        </script>
    </body>
    </html>`;
  }
  
  /**
   * Metodo pubblico per abortire un task specifico
   * @param taskId ID del task da abortire
   * @returns true se il task è stato abortito, false altrimenti
   */
  public abortTask(taskId: string): boolean {
    const result = this.masManager.abortTask(taskId);
    
    if (result) {
      // Dopo aver abortito il task, salva lo stato
      this.saveState();
    }
    
    return result;
  }
} 