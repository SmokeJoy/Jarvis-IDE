import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { WebviewMessageType } from '@shared/types/webview.types';
import { ApiMessageUnion } from '@shared/messages/api-messages';

const logger = new Logger('WebviewBridge');

type MessageHandler = (message: unknown) => void;

/**
 * Bridge per la comunicazione tra estensione e webview
 */
export class WebviewBridge {
  private static instance: WebviewBridge;
  private webview: vscode.Webview | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();

  private constructor() {
    logger.debug('Inizializzazione WebviewBridge');
  }

  /**
   * Ottiene l'istanza singleton di WebviewBridge
   */
  public static getInstance(): WebviewBridge {
    if (!WebviewBridge.instance) {
      WebviewBridge.instance = new WebviewBridge();
    }
    return WebviewBridge.instance;
  }

  /**
   * Imposta l'istanza della webview
   */
  public setWebview(webview: vscode.Webview): void {
    this.webview = webview;
  }

  /**
   * Registra un handler per un tipo di messaggio
   */
  public on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  /**
   * Rimuove un handler per un tipo di messaggio
   */
  public off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  /**
   * Gestisce un messaggio ricevuto dalla webview
   */
  public handleMessage(message: unknown): void {
    try {
      if (!message || typeof message !== 'object' || !('type' in (message as object))) {
        throw new Error('Messaggio non valido');
      }

      const { type } = message as { type: string };
      const handlers = this.messageHandlers.get(type);
      
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            logger.error(`Errore nell'handler per il tipo ${type}:`, error instanceof Error ? error : new Error('Errore sconosciuto'));
          }
        });
      }
    } catch (error) {
      logger.error('Errore nella gestione del messaggio:', error instanceof Error ? error : new Error('Errore sconosciuto'));
    }
  }

  /**
   * Invia un messaggio alla webview
   */
  public postMessage(type: WebviewMessageType, payload?: unknown): void {
    if (!this.webview) {
      logger.error('Webview non inizializzata');
      return;
    }

    try {
      const message = {
        type,
        payload
      };

      this.webview.postMessage(message);
    } catch (error) {
      logger.error('Errore nell\'invio del messaggio:', error instanceof Error ? error : new Error('Errore sconosciuto'));
    }
  }

  /**
   * Invia un messaggio API alla webview
   */
  public postApiMessage(message: ApiMessageUnion): void {
    this.postMessage(WebviewMessageType.API_MESSAGE, message);
  }

  /**
   * Elimina l'istanza del bridge
   */
  public dispose(): void {
    this.webview = null;
    this.messageHandlers.clear();
  }
} 