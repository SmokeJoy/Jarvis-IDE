import { vscode } from '../vscode-api';
import { AgentStatus, Task, TaskQueueState, AgentMode, CodeStyle } from '../types/mas-types';

/**
 * Tipi di messaggi per la comunicazione con il backend MAS
 */
export type MasMessageCallback = (data: any) => void;

/**
 * Servizio per la comunicazione tra la WebView e il sistema MAS nel backend
 */
export class MasCommunicationService {
  private static instance: MasCommunicationService;
  private subscribers: Map<string, MasMessageCallback[]> = new Map();
  
  /**
   * Ottiene un'istanza singleton del servizio di comunicazione MAS
   */
  public static getInstance(): MasCommunicationService {
    if (!MasCommunicationService.instance) {
      MasCommunicationService.instance = new MasCommunicationService();
    }
    return MasCommunicationService.instance;
  }
  
  constructor() {
    this.initializeMessageListener();
  }
  
  /**
   * Inizializza il listener per i messaggi dal backend
   */
  private initializeMessageListener(): void {
    window.addEventListener('message', event => {
      const message = event.data;
      
      // Gestisci diversi tipi di messaggi dal backend
      switch (message.type) {
        case 'agentsStatusUpdate':
          this.notifySubscribers('agentsStatusUpdate', message.payload);
          break;
        
        case 'taskQueueUpdate':
          this.notifySubscribers('taskQueueUpdate', message.payload);
          break;
          
        case 'instructionReceived':
          this.notifySubscribers('instructionReceived', message.payload);
          break;
          
        case 'instructionCompleted':
          this.notifySubscribers('instructionCompleted', message.payload);
          break;
          
        case 'instructionFailed':
          this.notifySubscribers('instructionFailed', message.payload);
          break;
          
        case 'configurationSaved':
          this.notifySubscribers('configurationSaved', message.payload);
          break;
          
        case 'configurationError':
          this.notifySubscribers('configurationError', message.payload);
          break;
      }
    });
  }
  
  /**
   * Invia un'istruzione al CoderAgent tramite il SupervisorAgent
   * @param instruction Istruzione da inviare
   * @param style Stile di codice desiderato (opzionale)
   * @param priority Priorità dell'istruzione (opzionale)
   */
  public sendCoderInstruction(
    instruction: string, 
    style?: string, 
    priority?: 'high' | 'normal' | 'low'
  ): void {
    vscode.postMessage({
      type: 'sendCoderInstruction',
      payload: {
        instruction,
        style,
        priority
      }
    });
  }
  
  /**
   * Richiede lo stato attuale di tutti gli agenti
   */
  public requestAgentsStatus(): void {
    vscode.postMessage({
      type: 'getAgentsStatus'
    });
  }
  
  /**
   * Richiede lo stato attuale della coda dei task
   */
  public requestTaskQueueStatus(): void {
    vscode.postMessage({
      type: 'getTaskQueueStatus'
    });
  }
  
  /**
   * Richiede di interrompere l'istruzione corrente del CoderAgent
   */
  public abortCurrentCoderInstruction(): void {
    vscode.postMessage({
      type: 'abortCoderInstruction'
    });
  }
  
  /**
   * Richiede l'attivazione o disattivazione di un agente specifico
   * @param agentId ID dell'agente
   * @param active Stato desiderato (attivo/inattivo)
   */
  public toggleAgentActive(agentId: string, active: boolean): void {
    vscode.postMessage({
      type: 'toggleAgentActive',
      payload: {
        agentId,
        active
      }
    });
  }
  
  /**
   * Imposta la modalità operativa di un agente
   * @param agentId ID dell'agente
   * @param mode Modalità operativa desiderata
   */
  public setAgentMode(agentId: string, mode: AgentMode): void {
    vscode.postMessage({
      type: 'setAgentMode',
      payload: {
        agentId,
        mode
      }
    });
  }
  
  /**
   * Imposta lo stile di codice di un agente
   * @param agentId ID dell'agente
   * @param style Stile di codice desiderato
   */
  public setAgentStyle(agentId: string, style: CodeStyle): void {
    vscode.postMessage({
      type: 'setAgentStyle',
      payload: {
        agentId,
        style
      }
    });
  }
  
  /**
   * Imposta la modalità operativa globale del sistema MAS
   * @param mode Modalità operativa desiderata
   */
  public setSystemMode(mode: 'collaborative' | 'single'): void {
    vscode.postMessage({
      type: 'setSystemMode',
      payload: {
        mode
      }
    });
  }
  
  /**
   * Imposta lo stile di codice predefinito per tutto il sistema
   * @param style Stile di codice predefinito
   */
  public setDefaultStyle(style: CodeStyle): void {
    vscode.postMessage({
      type: 'setDefaultStyle',
      payload: {
        style
      }
    });
  }
  
  /**
   * Richiede la configurazione completa del sistema MAS
   */
  public requestMasConfiguration(): void {
    vscode.postMessage({
      type: 'getMasConfiguration'
    });
  }
  
  /**
   * Aggiunge un sottoscrittore per un tipo specifico di messaggio
   * @param messageType Tipo di messaggio
   * @param callback Funzione da chiamare quando arriva un messaggio di questo tipo
   */
  public subscribe(messageType: string, callback: MasMessageCallback): void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, []);
    }
    
    this.subscribers.get(messageType)?.push(callback);
  }
  
  /**
   * Rimuove un sottoscrittore per un tipo specifico di messaggio
   * @param messageType Tipo di messaggio
   * @param callback Funzione da rimuovere
   */
  public unsubscribe(messageType: string, callback: MasMessageCallback): void {
    if (!this.subscribers.has(messageType)) {
      return;
    }
    
    const callbacks = this.subscribers.get(messageType) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  /**
   * Notifica tutti i sottoscrittori di un particolare tipo di messaggio
   * @param messageType Tipo di messaggio
   * @param data Dati del messaggio
   */
  private notifySubscribers(messageType: string, data: any): void {
    const callbacks = this.subscribers.get(messageType) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  /**
   * Invia un messaggio generico al backend
   * @param message Messaggio da inviare
   */
  public postMessage(message: any): void {
    vscode.postMessage(message);
  }
  
  /**
   * Richiede l'annullamento di un task specifico
   * @param taskId ID del task da annullare
   */
  public abortTask(taskId: string): void {
    vscode.postMessage({
      type: 'abortTask',
      payload: {
        taskId
      }
    });
  }
  
  /**
   * Richiede la ri-esecuzione di un task
   * @param task Task da ri-eseguire
   */
  public rerunTask(task: Task): void {
    vscode.postMessage({
      type: 'rerunTask',
      payload: {
        task
      }
    });
  }
  
  /**
   * Imposta un filtro per la coda dei task
   * @param status Filtro per lo stato
   * @param priority Filtro per la priorità
   * @param agentId Filtro per l'agente
   */
  public setTaskQueueFilter(
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed',
    priority?: 'all' | 'high' | 'normal' | 'low',
    agentId?: string
  ): void {
    vscode.postMessage({
      type: 'setTaskQueueFilter',
      payload: {
        status,
        priority,
        agentId
      }
    });
  }
} 