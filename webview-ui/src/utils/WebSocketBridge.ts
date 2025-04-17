/**
 * @file WebSocketBridge.ts
 * @description Ponte di comunicazione WebSocket tra la webview e l'estensione VS Code
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import {
} from '@shared/messages';
import type {
  WebSocketErrorMessage,
  DisconnectMessage,
  PingMessage,
  PongMessage,
  LlmStatusMessage,
  LlmCancelMessage,
  WebviewMessageUnion,
} from '@shared/messages';
import { getVSCodeAPI } from './messageUtils';
import { t } from '../i18n';

/**
 * Type guard per verificare se un messaggio è un messaggio WebSocket
 */
import { isWebviewMessage } from '@shared/messages';
export function isWebSocketMessage(message: unknown): message is WebviewMessageUnion {
  return (
    message !== null &&
    typeof message === 'object' &&
    'type' in (message as any) &&
    typeof (message as any).type === 'string' &&
    [
      'WS_PING', 'WS_PONG', 'WS_LLM_STATUS', 'WS_ERROR', 'WS_DISCONNECT', 'WS_CANCEL',
      'LLM_REQUEST', 'LLM_RESPONSE', 'LLM_CANCEL', 'LLM_STATUS',
      'DISCONNECT', 'CONNECT',
      'ping', 'pong', 'llm_status', 'error', 'disconnect',
    ].includes(String((message as any).type))
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di disconnessione
 */
export function isDisconnectMessage(message: unknown): message is DisconnectMessage {
  if (!isWebviewMessage(message)) {
    return false;
  }
  return message.type === 'DISCONNECT' || message.type === 'disconnect';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di errore WebSocket
 */
export function isWebSocketErrorMessage(message: unknown): message is WebSocketErrorMessage {
  if (!isWebviewMessage(message)) {
    return false;
  }
  return (message.type === 'WS_ERROR' || message.type === 'error') && 'error' in message && typeof message.error === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di ping
 */
export function isPingMessage(message: unknown): message is PingMessage {
  if (!isWebviewMessage(message)) {
    return false;
  }
  return (message.type === 'WS_PING' || message.type === 'ping') && 'id' in message && typeof message.id === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di pong
 */
export function isPongMessage(message: unknown): message is PongMessage {
  if (!isWebviewMessage(message)) {
    return false;
  }
  return (message.type === 'WS_PONG' || message.type === 'pong') && 'id' in message && typeof message.id === 'string';
}

/**
 * Type guard per verificare se un messaggio è un messaggio di stato LLM
 */
export function isLlmStatusMessage(message: unknown): message is LlmStatusMessage {
  if (!isWebviewMessage(message)) {
    return false;
  }
  return (
    (message.type === 'WS_LLM_STATUS' || message.type === 'llm_status') &&
    'modelId' in message &&
    typeof message.modelId === 'string' &&
    'status' in message &&
    ['loading', 'ready', 'error'].includes(message.status as string) &&
    'timestamp' in message &&
    typeof message.timestamp === 'number'
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di cancellazione LLM
 */
export function isLlmCancelMessage(message: unknown): message is LlmCancelMessage {
  if (!isWebviewMessage(message)) return false;
  return message.type === 'LLM_CANCEL' || message.type === 'llm_cancel';
}

/**
 * Mappa per il dispatcher di messaggi con i rispettivi handler tipizzati
 */
type MessageHandlers<T extends WebviewMessageUnion> = {
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
    window.addEventListener('message', this.handleMessage);
    this.setupConnectionCheck();
  }

  /**
   * Imposta il controllo periodico della connessione
   */
  private setupConnectionCheck(): void {
    this.pingIntervalId = window.setInterval(() => {
      if (this.isConnected) {
        this.postMessage({
          type: 'WS_PING',
          payload: { timestamp: Date.now() }
        } as PingMessage);
      }
    }, 30000);

    this.connectionCheckIntervalId = window.setInterval(() => {
      if (!this.isConnected) {
        logger.warn('Connection check failed, attempting to reconnect...');
        // Optionally, send a ping or other reconnect logic here
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
      if (isWebSocketMessage(message)) {
        switch (message.type) {
          case 'WS_PING':
          case 'ping':
            if (isPingMessage(message)) this.handlePing(message);
            break;
          case 'WS_PONG':
          case 'pong':
            if (isPongMessage(message)) this.handlePong(message);
            break;
          case 'WS_ERROR':
          case 'error':
            if (isWebSocketErrorMessage(message)) this.handleWebSocketError(message);
            break;
          case 'DISCONNECT':
          case 'disconnect':
            if (isDisconnectMessage(message)) this.handleDisconnect(message);
            break;
          case 'WS_LLM_STATUS':
          case 'llm_status':
            if (isLlmStatusMessage(message)) this.handleLlmStatus(message);
            break;
          case 'LLM_CANCEL':
          case 'llm_cancel':
            if (isLlmCancelMessage(message)) this.handleLlmCancel(message);
            break;
          default:
            logger.warn('Unknown WebSocket message type', message);
            this.handleError({
              type: 'WS_ERROR',
              error: `Tipo di messaggio sconosciuto: ${String((message as any).type)}`
            });
        }
        this.notifySubscribers(message.type, message);
        return;
      }
      if (typeof message === 'object' && message !== null && 'type' in message) {
        this.notifySubscribers('message', message);
        return;
      }
      logger.warn('Messaggio non riconosciuto dal bridge', message);
    } catch (error) {
      logger.error('Error dispatching message', error);
      this.handleError({
        type: 'WS_ERROR',
        error: `Errore nella gestione del messaggio: ${error}`
      });
    }
  }

  /**
   * Gestisce un messaggio di tipo ping
   */
  private handlePing(message: PingMessage): void {
    logger.debug('Handling ping message', message);
    // Risponde con un pong
    this.postMessage({
      type: 'pong',
      id: message.id,
      timestamp: Date.now(),
      payload: {}
    } as PongMessage);
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
    logger.error('WebSocket error', message.error);
    this.notifySubscribers<WebSocketErrorMessage>('WS_ERROR', message);
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
    this.notifySubscribers<LlmStatusMessage>('llm_status', message);
  }

  /**
   * Gestisce un messaggio di cancellazione LLM
   */
  private handleLlmCancel(message: LlmCancelMessage): void {
    this.notifySubscribers<LlmCancelMessage>('WS_CANCEL', message);
  }

  /**
   * Gestisce un errore generico
   */
  private handleError(message: WebSocketErrorMessage): void {
    logger.error('Error', message.error);
    this.notifySubscribers<WebSocketErrorMessage>('WS_ERROR', message);
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
      if (!this.vscode) {
        throw new Error('VS Code API non disponibile');
      }
      this.vscode.postMessage(message);
      if (isPingMessage(message)) {
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('Error sending message', error);
      this.isConnected = false;
    }
  }

  /**
   * Registra un callback per un tipo di messaggio specifico
   * Utilizza type safety avanzata con generics
   * @param messageType Tipo di messaggio da ascoltare
   * @param callback Funzione di callback fortemente tipizzata
   * @returns Funzione per rimuovere il listener
   */
  public on<T extends WebviewMessageUnion>(
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
    window.removeEventListener('message', this.handleMessage);
    if (this.pingIntervalId) {
      window.clearInterval(this.pingIntervalId);
    }
    if (this.connectionCheckIntervalId) {
      window.clearInterval(this.connectionCheckIntervalId);
    }
    this.removeAllListeners();
    this.postMessage({
      type: 'DISCONNECT',
      payload: {}
    } as DisconnectMessage);
    this.isConnected = false;
  }
}

// Rimuovi la riga vuota di import e verifica fine file