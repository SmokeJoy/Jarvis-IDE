/**
 * @file WebSocketBridge.ts
 * @description Ponte di comunicazione WebSocket tra la webview e l'estensione VS Code
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import { 
  isErrorMessage, 
  isResponseMessage, 
  isStateMessage,
  isInstructionMessage
} from '../../../src/shared/types/webviewMessageUnion';
import type { ExtensionMessage } from '../../../src/shared/types/webview.types';
import { getVSCodeAPI } from './messageUtils';
import { t } from '../i18n';

/**
 * Enum per i tipi di messaggi del WebSocketBridge
 */
export enum WebSocketMessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  LLM_STATUS = 'llm_status',
  LLM_REQUEST = 'llm_request',
  LLM_RESPONSE = 'llm_response',
  LLM_CANCEL = 'llm_cancel'
}

/**
 * Interfaccia base per i messaggi del WebSocketBridge
 */
export interface WebSocketMessageBase extends WebviewMessage<WebSocketMessageType> {
  type: WebSocketMessageType;
  payload: unknown;
}

/**
 * Messaggio di connessione
 */
export interface ConnectMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.CONNECT;
}

/**
 * Messaggio di disconnessione
 */
export interface DisconnectMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.DISCONNECT;
}

/**
 * Messaggio di errore del WebSocket
 */
export interface WebSocketErrorMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.ERROR;
  error: string;
  code?: number;
}

/**
 * Messaggio di ping
 */
export interface PingMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.PING;
  id: string;
  timestamp?: number;
}

/**
 * Messaggio di pong
 */
export interface PongMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.PONG;
  id: string;
  timestamp?: number;
}

/**
 * Stato dell'LLM
 */
export type LlmStatus = 'loading' | 'ready' | 'error';

/**
 * Messaggio di stato dell'LLM
 */
export interface LlmStatusMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.LLM_STATUS;
  modelId: string;
  status: LlmStatus;
  error?: string;
  timestamp: number;
}

/**
 * Messaggio di richiesta LLM
 */
export interface LlmRequestMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.LLM_REQUEST;
  input: string;
  context: Record<string, any>;
  requestId?: string;
}

/**
 * Messaggio di risposta LLM
 */
export interface LlmResponseMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.LLM_RESPONSE;
  token: string;
  isComplete: boolean;
  requestId?: string;
  error?: string;
}

/**
 * Messaggio di cancellazione LLM
 */
export interface LlmCancelMessage extends WebSocketMessageBase {
  type: WebSocketMessageType.LLM_CANCEL;
  requestId?: string;
}

/**
 * Union discriminata di tutti i tipi di messaggi WebSocket
 */
export type WebSocketMessageUnion =
  | ConnectMessage
  | DisconnectMessage
  | WebSocketErrorMessage
  | PingMessage
  | PongMessage
  | LlmStatusMessage
  | LlmRequestMessage
  | LlmResponseMessage
  | LlmCancelMessage;

/**
 * Type guard per verificare se un messaggio è un messaggio WebSocket
 */
export function isWebSocketMessage(message: unknown): message is WebSocketMessageUnion {
  return (
    message !== null &&
    typeof message === 'object' &&
    'type' in (message as any) &&
    typeof (message as any).type === 'string' &&
    Object.values(WebSocketMessageType).includes((message as any).type as WebSocketMessageType)
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di connessione
 */
export function isConnectMessage(message: unknown): message is ConnectMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.CONNECT;
}

/**
 * Type guard per verificare se un messaggio è un messaggio di disconnessione
 */
export function isDisconnectMessage(message: unknown): message is DisconnectMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.DISCONNECT;
}

/**
 * Type guard per verificare se un messaggio è un messaggio di errore WebSocket
 */
export function isWebSocketErrorMessage(message: unknown): message is WebSocketErrorMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.ERROR && 'error' in message && typeof message.error === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di ping
 */
export function isPingMessage(message: unknown): message is PingMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.PING && 'id' in message && typeof message.id === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di pong
 */
export function isPongMessage(message: unknown): message is PongMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.PONG && 'id' in message && typeof message.id === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di stato LLM
 */
export function isLlmStatusMessage(message: unknown): message is LlmStatusMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  
  return (
    message.type === WebSocketMessageType.LLM_STATUS && 
    'modelId' in message && 
    typeof message.modelId === 'string' &&
    'status' in message &&
    ['loading', 'ready', 'error'].includes(message.status as string) &&
    'timestamp' in message &&
    typeof message.timestamp === 'number'
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di richiesta LLM
 */
export function isLlmRequestMessage(message: unknown): message is LlmRequestMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  
  return (
    message.type === WebSocketMessageType.LLM_REQUEST &&
    'input' in message &&
    typeof message.input === 'string' &&
    'context' in message &&
    typeof message.context === 'object'
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di risposta LLM
 */
export function isLlmResponseMessage(message: unknown): message is LlmResponseMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  
  return (
    message.type === WebSocketMessageType.LLM_RESPONSE &&
    'token' in message &&
    typeof message.token === 'string' &&
    'isComplete' in message &&
    typeof message.isComplete === 'boolean'
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di cancellazione LLM
 */
export function isLlmCancelMessage(message: unknown): message is LlmCancelMessage {
  if (!isWebSocketMessage(message)) {
    return false;
  }
  return message.type === WebSocketMessageType.LLM_CANCEL;
}

/**
 * Mappa per il dispatcher di messaggi con i rispettivi handler tipizzati
 */
type MessageHandlers<T extends WebSocketMessageUnion> = {
  [K in T['type']]: (message: Extract<T, { type: K }>) => void;
};

// Tipo per i callback dei messaggi
type MessageCallback<T extends WebviewMessageUnion = WebviewMessageUnion> = (message: T) => void;

// Logger condiviso per il bridge webview
const logger = {
  debug: (message: string, ...data: any[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[WebSocketBridge] ${message}`, ...data);
    }
  },
  info: (message: string, ...data: any[]): void => {
    console.info(`[WebSocketBridge] ${message}`, ...data);
  },
  warn: (message: string, ...data: any[]): void => {
    console.warn(`[WebSocketBridge] ${message}`, ...data);
  },
  error: (message: string, ...data: any[]): void => {
    console.error(`[WebSocketBridge] ${message}`, ...data);
  }
};

/**
 * Classe che gestisce la comunicazione WebSocket tra la webview e l'estensione VS Code
 * Implementa il pattern Singleton per garantire un'unica istanza del bridge
 * Utilizza il pattern Union Dispatcher Type-Safe per la gestione dei messaggi
 */
export class WebSocketBridge {
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private vscode = getVSCodeAPI();
  private isConnected = true;
  private static instance: WebSocketBridge;
  private pingIntervalId?: number;
  private connectionCheckIntervalId?: number;

  /**
   * Ottieni l'istanza del WebSocketBridge (Singleton)
   */
  public static getInstance(): WebSocketBridge {
    if (!WebSocketBridge.instance) {
      WebSocketBridge.instance = new WebSocketBridge();
    }
    return WebSocketBridge.instance;
  }

  /**
   * Costruttore privato per garantire il pattern Singleton
   */
  private constructor() {
    logger.debug('Initializing WebSocketBridge');
    
    // Imposta l'event listener per i messaggi in arrivo
    window.addEventListener('message', this.handleMessage);
    
    // Imposta il controllo della connessione
    this.setupConnectionCheck();
    
    // Invia un messaggio di connessione iniziale
    this.postMessage<ConnectMessage>({
      type: WebSocketMessageType.CONNECT,
      payload: {}
    });
  }

  /**
   * Imposta il controllo periodico della connessione
   */
  private setupConnectionCheck(): void {
    // Invia un ping ogni 30 secondi
    this.pingIntervalId = window.setInterval(() => {
      if (this.isConnected) {
        // Invia un messaggio di ping
        this.postMessage<PingMessage>({
          type: WebSocketMessageType.PING,
          id: Math.random().toString(36).substring(2, 15),
          timestamp: Date.now(),
          payload: {}
        });
      }
    }, 30000);
    
    // Controlla la connessione ogni 10 secondi
    this.connectionCheckIntervalId = window.setInterval(() => {
      if (!this.isConnected) {
        logger.warn('Connection check failed, attempting to reconnect...');
        
        // Tenta di riconnettersi
        this.postMessage<ConnectMessage>({
          type: WebSocketMessageType.CONNECT,
          payload: {}
        });
      }
    }, 10000);
  }

  /**
   * Gestisce i messaggi in arrivo dall'estensione VS Code
   */
  private handleMessage = (event: MessageEvent): void => {
    const message = event.data;
    
    // Log per debug
    logger.debug('Received message', message);
    
    // Gestisce il messaggio
    this.dispatchMessage(message);
  };

  /**
   * Distribuisce i messaggi in arrivo ai rispettivi handler
   * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
   */
  private dispatchMessage(message: unknown): void {
    try {
      // Validazione avanzata: WebSocketMessageUnion o WebviewMessageUnion
      if (isWebSocketMessage(message)) {
        // Dispatch type-safe per WebSocketMessageUnion
        switch (message.type) {
          case WebSocketMessageType.PING:
            if (isPingMessage(message)) this.handlePing(message);
            break;
          case WebSocketMessageType.PONG:
            if (isPongMessage(message)) this.handlePong(message);
            break;
          case WebSocketMessageType.ERROR:
            if (isWebSocketErrorMessage(message)) this.handleWebSocketError(message);
            break;
          case WebSocketMessageType.CONNECT:
            if (isConnectMessage(message)) this.handleConnect(message);
            break;
          case WebSocketMessageType.DISCONNECT:
            if (isDisconnectMessage(message)) this.handleDisconnect(message);
            break;
          case WebSocketMessageType.LLM_STATUS:
            if (isLlmStatusMessage(message)) this.handleLlmStatus(message);
            break;
          case WebSocketMessageType.LLM_REQUEST:
            if (isLlmRequestMessage(message)) this.handleLlmRequest(message);
            break;
          case WebSocketMessageType.LLM_RESPONSE:
            if (isLlmResponseMessage(message)) this.handleLlmResponse(message);
            break;
          case WebSocketMessageType.LLM_CANCEL:
            if (isLlmCancelMessage(message)) this.handleLlmCancel(message);
            break;
          default:
            logger.warn('Unknown WebSocket message type', message);
            this.handleError({
              type: WebSocketMessageType.ERROR,
              error: `Tipo di messaggio sconosciuto: ${String((message as any).type)}`,
              payload: {}
            });
        }
        this.notifySubscribers(message.type, message);
        return;
      }
      // Se non è un WebSocketMessage, prova come WebviewMessageUnion
      if (typeof message === 'object' && message !== null && 'type' in message) {
        // Validazione con isWebviewMessage (importalo se non presente)
        // Qui puoi aggiungere switch su altri tipi di messaggi se necessario
        this.notifySubscribers('message', message);
        return;
      }
      // Messaggio sconosciuto
      logger.warn('Messaggio non riconosciuto dal bridge', message);
    } catch (error) {
      logger.error('Error dispatching message', error);
      this.handleError({
        type: WebSocketMessageType.ERROR,
        error: `Errore nella gestione del messaggio: ${error}`,
        payload: {}
      });
    }
  }

  /**
   * Gestisce un messaggio di tipo ping
   */
  private handlePing(message: PingMessage): void {
    logger.debug('Handling ping message', message);
    
    // Risponde con un pong
    this.postMessage<PongMessage>({
      type: WebSocketMessageType.PONG,
      id: message.id,
      timestamp: Date.now(),
      payload: {}
    });
  }

  /**
   * Gestisce un messaggio di tipo pong
   */
  private handlePong(message: PongMessage): void {
    logger.debug('Handling pong message', message);
    this.isConnected = true;
  }

  /**
   * Gestisce un messaggio di errore WebSocket
   */
  private handleWebSocketError(message: WebSocketErrorMessage): void {
    logger.error('WebSocket error', message.error, message.code);
    this.notifySubscribers<WebSocketErrorMessage>('error', message);
  }

  /**
   * Gestisce un messaggio di connessione
   */
  private handleConnect(message: ConnectMessage): void {
    logger.info('Connection established');
    this.isConnected = true;
    this.notifySubscribers<ConnectMessage>('connect', message);
  }

  /**
   * Gestisce un messaggio di disconnessione
   */
  private handleDisconnect(message: DisconnectMessage): void {
    logger.info('Connection closed');
    this.isConnected = false;
    this.notifySubscribers<DisconnectMessage>('disconnect', message);
  }

  /**
   * Gestisce un messaggio di stato LLM
   */
  private handleLlmStatus(message: LlmStatusMessage): void {
    logger.debug('LLM status update', message.modelId, message.status);
    this.notifySubscribers<LlmStatusMessage>(WebSocketMessageType.LLM_STATUS, message);
  }

  /**
   * Gestisce un messaggio di richiesta LLM
   */
  private handleLlmRequest(message: LlmRequestMessage): void {
    logger.debug('LLM request', message.requestId);
    this.notifySubscribers<LlmRequestMessage>(WebSocketMessageType.LLM_REQUEST, message);
  }

  /**
   * Gestisce un messaggio di risposta LLM
   */
  private handleLlmResponse(message: LlmResponseMessage): void {
    if (message.isComplete) {
      logger.debug('LLM response complete', message.requestId);
    }
    this.notifySubscribers<LlmResponseMessage>(WebSocketMessageType.LLM_RESPONSE, message);
  }

  /**
   * Gestisce un messaggio di cancellazione LLM
   */
  private handleLlmCancel(message: LlmCancelMessage): void {
    logger.debug('LLM request cancelled', message.requestId);
    this.notifySubscribers<LlmCancelMessage>(WebSocketMessageType.LLM_CANCEL, message);
  }

  /**
   * Gestisce un errore generico
   */
  private handleError(message: WebSocketErrorMessage): void {
    logger.error('Error', message.error);
    this.notifySubscribers<WebSocketErrorMessage>('error', message);
  }

  /**
   * Notifica tutti i sottoscrittori di un determinato tipo di messaggio
   * @param messageType Tipo di messaggio
   * @param message Il messaggio da notificare
   */
  private notifySubscribers<T extends WebviewMessageUnion>(messageType: string, message: T): void {
    const callbacks = this.callbacks.get(messageType);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (err) {
          logger.error(`Error in callback for message type ${messageType}`, err);
        }
      });
    }
    
    // Notifica anche i sottoscrittori generici "message"
    if (messageType !== 'message') {
      const messageCallbacks = this.callbacks.get('message');
      if (messageCallbacks) {
        messageCallbacks.forEach(callback => {
          try {
            callback(message);
          } catch (err) {
            logger.error('Error in message callback', err);
          }
        });
      }
    }
  }

  /**
   * Invia un messaggio all'estensione VS Code
   * Metodo type-safe che accetta solo messaggi conformi a WebviewMessageUnion
   * @param message Messaggio fortemente tipizzato da inviare
   */
  public postMessage<T extends WebviewMessageUnion>(message: T): void {
    try {
      logger.debug('Sending message', message);
      
      // Verifica se l'API VS Code è disponibile
      if (!this.vscode) {
        throw new Error('VS Code API non disponibile');
      }
      
      // Invia il messaggio all'estensione
      this.vscode.postMessage(message);
      
      // Se è un messaggio di connessione o di ping, aggiorna lo stato di connessione
      if (isConnectMessage(message) || isPingMessage(message)) {
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('Error sending message', error);
      this.isConnected = false;
    }
  }

  /**
   * Invia un messaggio LLM all'estensione
   * Metodo type-safe che accetta solo messaggi LLM specifici
   * @param message Messaggio LLM fortemente tipizzato da inviare
   */
  public sendLlmMessage<T extends LlmRequestMessage | LlmCancelMessage>(message: T): void {
    this.postMessage<T>(message);
  }

  /**
   * Registra un callback per un tipo di messaggio specifico
   * Utilizza type safety avanzata con generics
   * @param messageType Tipo di messaggio da ascoltare
   * @param callback Funzione di callback fortemente tipizzata
   * @returns Funzione per rimuovere il listener
   */
  public on<T extends WebSocketMessageUnion>(
    messageType: T['type'], 
    callback: (message: Extract<T, { type: T['type'] }>) => void
  ): () => void {
    // Converti il callback tipizzato in un generico MessageCallback
    const genericCallback: MessageCallback = (msg: WebviewMessageUnion): void => {
      if (msg.type === messageType) {
        callback(msg as Extract<T, { type: T['type'] }>);
      }
    };
    
    // Ottieni o crea il set di callbacks per questo tipo di messaggio
    if (!this.callbacks.has(messageType)) {
      this.callbacks.set(messageType, new Set());
    }
    
    // Aggiungi il callback
    const callbacks = this.callbacks.get(messageType);
    if (callbacks) {
      callbacks.add(genericCallback);
    }
    
    // Restituisci una funzione per rimuovere il listener
    return () => {
      const callbackSet = this.callbacks.get(messageType);
      if (callbackSet) {
        callbackSet.delete(genericCallback);
      }
    };
  }

  /**
   * Rimuove tutti i callback per un tipo di messaggio
   * @param messageType Tipo di messaggio per cui rimuovere i listener
   */
  public off(messageType: string): void {
    this.callbacks.delete(messageType);
  }

  /**
   * Rimuove tutti i listener registrati
   */
  public removeAllListeners(): void {
    this.callbacks.clear();
  }

  /**
   * Verifica se la connessione con l'estensione VS Code è attiva
   * @returns Stato della connessione
   */
  public isExtensionConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Elimina l'istanza del WebSocketBridge
   */
  public dispose(): void {
    // Rimuovi gli event listener
    window.removeEventListener('message', this.handleMessage);
    
    // Interrompi gli intervalli
    if (this.pingIntervalId) {
      window.clearInterval(this.pingIntervalId);
    }
    
    if (this.connectionCheckIntervalId) {
      window.clearInterval(this.connectionCheckIntervalId);
    }
    
    // Rimuovi tutti i listener
    this.removeAllListeners();
    
    // Invia un messaggio di disconnessione
    this.postMessage<DisconnectMessage>({
      type: WebSocketMessageType.DISCONNECT,
      payload: {}
    });
    
    // Resetta lo stato
    this.isConnected = false;
  }
}