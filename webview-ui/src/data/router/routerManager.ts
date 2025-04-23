/**
 * @file routerManager.ts
 * @description Gestore centralizzato del routing dei messaggi webview con pattern MAS
 * @author dev ai 1
 */

import { webviewBridge } from '../../utils/WebviewBridge';
import logger from '@shared/utils/outputLogger';
import {
  type WebviewMessage,
  type ExtensionMessage,
  isWebviewMessage,
  guards
} from '@shared/messages';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('RouterManager');

// Tipo per gli handler dei messaggi
type MessageHandler<T extends WebviewMessage> = (message: T) => void | Promise<void>;

// Singleton per la gestione del routing
class RouterManager {
  private static instance: RouterManager;
  private handlers: Map<WebviewMessage['type'], MessageHandler<any>>;
  private isDisposed = false;

  private constructor() {
    this.handlers = new Map();
    this.initialize();
  }

  public static getInstance(): RouterManager {
    if (!RouterManager.instance) {
      RouterManager.instance = new RouterManager();
    }
    return RouterManager.instance;
  }

  private initialize(): void {
    // Registra il listener principale per i messaggi
    window.addEventListener('message', this.handleMessage);
    componentLogger.debug('Router manager inizializzato');
  }

  /**
   * Registra un handler per un tipo specifico di messaggio
   */
  public registerHandler<T extends WebviewMessage>(
    type: T['type'],
    handler: MessageHandler<T>
  ): void {
    if (this.isDisposed) {
      componentLogger.warn('Tentativo di registrare handler dopo dispose');
      return;
    }

    this.handlers.set(type, handler);
    componentLogger.debug('Handler registrato per tipo:', { type });
  }

  /**
   * Rimuove un handler per un tipo specifico di messaggio
   */
  public removeHandler(type: WebviewMessage['type']): void {
    this.handlers.delete(type);
    componentLogger.debug('Handler rimosso per tipo:', { type });
  }

  /**
   * Gestisce un messaggio in arrivo
   */
  private handleMessage = async (event: MessageEvent): Promise<void> => {
    if (this.isDisposed) return;

    const msg = event.data;

    // Valida il messaggio usando la type guard
    if (!isWebviewMessage(msg)) {
      componentLogger.warn('Messaggio non valido ricevuto:', { msg });
      return;
    }

    try {
      const handler = this.handlers.get(msg.type);
      if (handler) {
        await handler(msg);
      } else {
        componentLogger.debug('Nessun handler per il tipo:', { type: msg.type });
      }
    } catch (error) {
      componentLogger.error('Errore nella gestione del messaggio:', { error, msg });
      
      // Invia messaggio di errore all'estensione
      webviewBridge.sendMessage<ExtensionMessage>({
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Errore sconosciuto'
        }
      });
    }
  };

  /**
   * Invia un messaggio all'estensione
   */
  public sendMessage<T extends ExtensionMessage>(message: T): void {
    if (this.isDisposed) {
      componentLogger.warn('Tentativo di inviare messaggio dopo dispose');
      return;
    }

    try {
      webviewBridge.sendMessage(message);
    } catch (error) {
      componentLogger.error('Errore nell\'invio del messaggio:', { error, message });
    }
  }

  /**
   * Pulisce le risorse
   */
  public dispose(): void {
    if (this.isDisposed) return;

    window.removeEventListener('message', this.handleMessage);
    this.handlers.clear();
    this.isDisposed = true;
    componentLogger.info('Router manager disposed');
  }
}

// Esporta l'istanza singleton
export const routerManager = RouterManager.getInstance(); 