/**
 * @file WebSocketBridge.ts
 * @description Bridge di comunicazione WebSocket tra la webview e l'estensione VS Code
 * @version 2.0.0
 */

import type {
  WebSocketMessage,
  ConnectMessage,
  StatusMessage,
  WebSocketMessageUnion,
  LLMStatusMessage,
  LLMCancelMessage,
  LLMStreamMessage,
  ResetMessage,
  ReloadMessage,
  PingMessage,
  PongMessage
} from '@shared/types/websocket.types';

// Import enum as value
import { WebSocketMessageType } from '@shared/types/websocket.types';

import {
  isWebSocketMessage,
  isPingMessage,
  isPongMessage,
  isStatusMessage,
  isConnectMessage,
  isAnyWebSocketMessage
} from '@shared/messages/guards/websocketMessageGuards';

import type { JarvisMessage } from '@shared/types/messages';

// Import del logger centralizzato
import logger from '@shared/utils/outputLogger';

// Importiamo l'API VS Code per la comunicazione con l'estensione
import { vscode } from './vscode';

import type { WebviewApi } from 'vscode-webview';

/**
 * Handler type for WebSocket messages
 */
type MessageHandler<T extends WebSocketMessageUnion = WebSocketMessageUnion> = (message: T) => void;

/**
 * Classe WebSocketBridge per la comunicazione tra la webview e l'estensione VS Code
 * Implementa il pattern Singleton per garantire un'unica istanza
 */
export class WebSocketBridge {
  private static instance: WebSocketBridge | null = null;
  private readonly clientId: string = 'webview';
  private readonly version: string = '2.0.0';
  private readonly handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private readonly messageQueue: WebSocketMessageUnion[] = [];
  private readonly maxQueueSize: number = 100;
  private isConnected: boolean = false;
  private isReady: boolean = false;
  private readonly vscode: WebviewApi<unknown>;
  private readonly listeners: Map<string, Set<MessageHandler>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly logger = logger.createComponentLogger('WebSocketBridge');

  private constructor() {
    this.vscode = vscode;
    this.logger.debug('Inizializzazione WebSocketBridge');
    
    // Intercetta i messaggi dall'estensione
    window.addEventListener('message', this.handleMessage);
    
    // Inizializza il ping interval per mantenere attiva la connessione
    this.startPingInterval();
    
    // Setup iniziale
    this.checkConnection();
  }

  /**
   * Ottiene l'istanza singleton del bridge
   */
  public static getInstance(): WebSocketBridge {
    if (!WebSocketBridge.instance) {
      WebSocketBridge.instance = new WebSocketBridge();
    }
    return WebSocketBridge.instance;
  }

  /**
   * Gestisce i messaggi in arrivo dall'estensione
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = event.data;
      
      if (!isAnyWebSocketMessage(message)) {
        this.logger.warn('Messaggio non valido ricevuto:', { message });
        return;
      }
      
      // Se è un messaggio ping, gestiscilo
      if (isPingMessage(message)) {
        this.handlePing(message);
        return;
      }
      
      // Notifica tutti i listener registrati per questo tipo di messaggio
      this.notifyListeners('message', message);
      
      // Notifica i listener specifici per il tipo di messaggio
      this.notifyListeners(message.type, message);
      
    } catch (error) {
      this.logger.error('Errore nella gestione del messaggio:', { error });
    }
  };

  /**
   * Gestisce i messaggi ping
   */
  private handlePing(message: PingMessage): void {
    const pongMessage: PongMessage = {
      type: WebSocketMessageType.PONG,
      timestamp: Date.now()
    };
    this.sendMessage(pongMessage);
  }

  /**
   * Notifica i listener per un determinato tipo di messaggio
   */
  private notifyListeners(type: string, message: WebSocketMessageUnion): void {
    const listenersSet = this.listeners.get(type);
    if (listenersSet) {
      listenersSet.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          this.logger.error(`Errore nel listener per tipo "${type}":`, { error });
        }
      });
    }
  }

  /**
   * Avvia l'intervallo di ping per mantenere la connessione attiva
   */
  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      const pingMessage: PingMessage = {
        type: WebSocketMessageType.PING,
        timestamp: Date.now()
      };
      this.sendMessage(pingMessage);
    }, 30000);
  }

  /**
   * Verifica la connessione con l'estensione
   */
  private checkConnection(): void {
    const connectMsg: ConnectMessage = {
      type: WebSocketMessageType.CONNECT,
      clientId: this.clientId,
      version: this.version,
      timestamp: Date.now()
    };
    
    const statusMsg: StatusMessage = {
      type: WebSocketMessageType.STATUS,
      status: 'connected',
      timestamp: Date.now()
    };
    
    this.sendMessage(connectMsg);
    this.sendMessage(statusMsg);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.logger.warn('Nessuna risposta dall\'estensione dopo il ping iniziale');
      }
    }, 5000);
  }

  /**
   * Invia un messaggio all'estensione VS Code
   */
  public sendMessage(message: WebSocketMessageUnion): void {
    try {
      this.vscode.postMessage(message);
      this.logger.debug(`Messaggio inviato all'estensione (${message.type})`, { message });
    } catch (error) {
      this.logger.error('Errore nell\'invio del messaggio:', { error, message });
    }
  }

  /**
   * Registra un listener per un tipo di messaggio
   */
  public on<T extends WebSocketMessageUnion>(type: string, callback: MessageHandler<T>): () => void {
    let listenersSet = this.listeners.get(type);
    if (!listenersSet) {
      listenersSet = new Set();
      this.listeners.set(type, listenersSet);
    }
    
    listenersSet.add(callback as MessageHandler);
    return () => this.off(type, callback as MessageHandler);
  }

  /**
   * Rimuove un listener per un tipo di messaggio
   */
  public off(type: string, callback: MessageHandler): void {
    const listenersSet = this.listeners.get(type);
    if (listenersSet) {
      listenersSet.delete(callback);
      
      if (listenersSet.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Rimuove tutti i listener
   */
  public removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Pulisce le risorse quando l'istanza viene distrutta
   */
  public dispose(): void {
    window.removeEventListener('message', this.handleMessage);
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.removeAllListeners();
    WebSocketBridge.instance = null;
  }
}

export default WebSocketBridge;

