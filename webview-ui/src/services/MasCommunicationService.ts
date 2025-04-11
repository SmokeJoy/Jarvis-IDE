import { vscode } from '../vscode-api';
import { AgentStatus, Task, TaskQueueState, AgentMode, CodeStyle } from '../types/mas-types';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { 
  AgentMessageUnion, 
  MasMessageType,
  GetAgentsStatusMessage,
  GetTaskQueueStatusMessage,
  SendCoderInstructionMessage,
  AbortCoderInstructionMessage,
  ToggleAgentActiveMessage,
  SetAgentModeMessage,
  SetAgentStyleMessage,
  SetSystemModeMessage,
  SetDefaultStyleMessage,
  GetMasConfigurationMessage,
  AbortTaskMessage,
  RerunTaskMessage,
  SetTaskQueueFilterMessage
} from '../types/mas-message';
import {
  isAgentMessage,
  isAgentsStatusUpdateMessage,
  isTaskQueueUpdateMessage,
  isInstructionReceivedMessage,
  isInstructionCompletedMessage,
  isInstructionFailedMessage,
  isConfigurationSavedMessage,
  isConfigurationErrorMessage
} from '../types/mas-message-guards';

/**
 * Tipi di messaggi per la comunicazione con il backend MAS
 */
export type MasMessageCallback = (data: any) => void;

/**
 * Servizio per la comunicazione tra la WebView e il sistema MAS nel backend
 * Implementa il pattern Union Dispatcher Type-Safe per la gestione dei messaggi
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
      
      // Implementazione del pattern Union Dispatcher Type-Safe
      if (isAgentMessage(message)) {
        // Notifica i sottoscrittori in base al tipo di messaggio
        if (isAgentsStatusUpdateMessage(message)) {
          this.notifySubscribers('agentsStatusUpdate', message.payload);
        }
        else if (isTaskQueueUpdateMessage(message)) {
          this.notifySubscribers('taskQueueUpdate', message.payload);
        }
        else if (isInstructionReceivedMessage(message)) {
          this.notifySubscribers('instructionReceived', message.payload);
        }
        else if (isInstructionCompletedMessage(message)) {
          this.notifySubscribers('instructionCompleted', message.payload);
        }
        else if (isInstructionFailedMessage(message)) {
          this.notifySubscribers('instructionFailed', message.payload);
        }
        else if (isConfigurationSavedMessage(message)) {
          this.notifySubscribers('configurationSaved', message.payload);
        }
        else if (isConfigurationErrorMessage(message)) {
          this.notifySubscribers('configurationError', message.payload);
        }
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
    const message: SendCoderInstructionMessage = {
      type: MasMessageType.SEND_CODER_INSTRUCTION,
      payload: {
        instruction,
        style: style as CodeStyle,
        priority
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede lo stato attuale di tutti gli agenti
   */
  public requestAgentsStatus(): void {
    const message: GetAgentsStatusMessage = {
      type: MasMessageType.GET_AGENTS_STATUS
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede lo stato attuale della coda dei task
   */
  public requestTaskQueueStatus(): void {
    const message: GetTaskQueueStatusMessage = {
      type: MasMessageType.GET_TASK_QUEUE_STATUS
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede di interrompere l'istruzione corrente del CoderAgent
   */
  public abortCurrentCoderInstruction(): void {
    const message: AbortCoderInstructionMessage = {
      type: MasMessageType.ABORT_CODER_INSTRUCTION
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede l'attivazione o disattivazione di un agente specifico
   * @param agentId ID dell'agente
   * @param active Stato desiderato (attivo/inattivo)
   */
  public toggleAgentActive(agentId: string, active: boolean): void {
    const message: ToggleAgentActiveMessage = {
      type: MasMessageType.TOGGLE_AGENT_ACTIVE,
      payload: {
        agentId,
        active
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Imposta la modalità operativa di un agente
   * @param agentId ID dell'agente
   * @param mode Modalità operativa desiderata
   */
  public setAgentMode(agentId: string, mode: AgentMode): void {
    const message: SetAgentModeMessage = {
      type: MasMessageType.SET_AGENT_MODE,
      payload: {
        agentId,
        mode
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Imposta lo stile di codice di un agente
   * @param agentId ID dell'agente
   * @param style Stile di codice desiderato
   */
  public setAgentStyle(agentId: string, style: CodeStyle): void {
    const message: SetAgentStyleMessage = {
      type: MasMessageType.SET_AGENT_STYLE,
      payload: {
        agentId,
        style
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Imposta la modalità operativa globale del sistema MAS
   * @param mode Modalità operativa desiderata
   */
  public setSystemMode(mode: 'collaborative' | 'single'): void {
    const message: SetSystemModeMessage = {
      type: MasMessageType.SET_SYSTEM_MODE,
      payload: {
        mode
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Imposta lo stile di codice predefinito per tutto il sistema
   * @param style Stile di codice predefinito
   */
  public setDefaultStyle(style: CodeStyle): void {
    const message: SetDefaultStyleMessage = {
      type: MasMessageType.SET_DEFAULT_STYLE,
      payload: {
        style
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede la configurazione completa del sistema MAS
   */
  public requestMasConfiguration(): void {
    const message: GetMasConfigurationMessage = {
      type: MasMessageType.GET_MAS_CONFIGURATION
    };
    
    this.sendTypeSafeMessage(message);
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
   * Invia un messaggio type-safe al backend
   * @param message Messaggio fortemente tipizzato da inviare
   */
  private sendTypeSafeMessage<T extends AgentMessageUnion>(message: T): void {
    vscode.postMessage(message);
  }
  
  /**
   * Richiede l'annullamento di un task specifico
   * @param taskId ID del task da annullare
   */
  public abortTask(taskId: string): void {
    const message: AbortTaskMessage = {
      type: MasMessageType.ABORT_TASK,
      payload: {
        taskId
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Richiede la ri-esecuzione di un task
   * @param task Task da ri-eseguire
   */
  public rerunTask(task: Task): void {
    const message: RerunTaskMessage = {
      type: MasMessageType.RERUN_TASK,
      payload: {
        task
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
  
  /**
   * Imposta i filtri per la visualizzazione della coda dei task
   * @param status Filtro per lo stato dei task
   * @param priority Filtro per la priorità dei task
   * @param agentId Filtro per l'agente assegnato
   */
  public setTaskQueueFilter(
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed',
    priority?: 'all' | 'high' | 'normal' | 'low',
    agentId?: string
  ): void {
    const message: SetTaskQueueFilterMessage = {
      type: MasMessageType.SET_TASK_QUEUE_FILTER,
      payload: {
        status,
        priority,
        agentId
      }
    };
    
    this.sendTypeSafeMessage(message);
  }
} 