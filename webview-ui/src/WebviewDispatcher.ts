/**
 * @file WebviewDispatcher.ts
 * @description Implementazione del dispatcher per gestire i messaggi tra WebView e l'estensione VS Code
 */

import { WebviewBridge } from './utils/WebviewBridge';
import { BaseMessage, isErrorMessage, createErrorMessage } from './shared/types/base-message';
import { validateMessage } from './utils/validate';
import { Logger } from './utils/Logger';

export type MessageHandler<T extends BaseMessage = BaseMessage> = (message: T) => void;
export type MessageValidator<T extends BaseMessage = BaseMessage> = (message: unknown) => message is T;

/**
 * Classe che gestisce il dispatching dei messaggi tra WebView e l'estensione VS Code.
 * Si occupa di registrare gli handler, validare i messaggi e instradare i messaggi agli handler appropriati.
 */
export class WebviewDispatcher {
  private static instance: WebviewDispatcher;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private bridge: WebviewBridge;
  private logger: Logger;
  private customValidators: Map<string, MessageValidator> = new Map();

  /**
   * Costruttore privato per l'implementazione del Singleton
   * @param bridge - L'istanza di WebviewBridge da utilizzare
   * @param logger - L'istanza di Logger da utilizzare
   */
  private constructor(bridge: WebviewBridge, logger: Logger) {
    this.bridge = bridge;
    this.logger = logger;
    this.init();
  }

  /**
   * Ottiene l'istanza singola di WebviewDispatcher
   * @param bridge - L'istanza di WebviewBridge da utilizzare
   * @param logger - L'istanza di Logger da utilizzare
   * @returns L'istanza di WebviewDispatcher
   */
  public static getInstance(bridge: WebviewBridge, logger: Logger): WebviewDispatcher {
    if (!WebviewDispatcher.instance) {
      WebviewDispatcher.instance = new WebviewDispatcher(bridge, logger);
    }
    return WebviewDispatcher.instance;
  }

  /**
   * Inizializza il dispatcher registrando il gestore dei messaggi sul bridge
   */
  private init(): void {
    this.bridge.onMessage((message: unknown) => {
      this.handleMessage(message);
    });
    this.logger.info('WebviewDispatcher inizializzato');
  }

  /**
   * Registra un validator personalizzato per un tipo di messaggio specifico
   * @param type - Il tipo di messaggio per cui registrare il validator
   * @param validator - La funzione validator da utilizzare
   */
  public registerValidator<T extends BaseMessage>(
    type: string, 
    validator: MessageValidator<T>
  ): void {
    this.customValidators.set(type, validator);
    this.logger.debug(`Validator registrato per il tipo di messaggio: ${type}`);
  }

  /**
   * Registra un handler per un tipo di messaggio specifico
   * @param type - Il tipo di messaggio per cui registrare l'handler
   * @param handler - La funzione handler da chiamare quando arriva un messaggio del tipo specificato
   * @returns Una funzione per cancellare la registrazione dell'handler
   */
  public on<T extends BaseMessage>(
    type: string, 
    handler: MessageHandler<T>
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    const handlers = this.handlers.get(type)!;
    handlers.add(handler as MessageHandler);
    
    this.logger.debug(`Handler registrato per il tipo di messaggio: ${type}`);
    
    // Restituisce una funzione per rimuovere l'handler
    return () => {
      if (this.handlers.has(type)) {
        const handlersSet = this.handlers.get(type)!;
        handlersSet.delete(handler as MessageHandler);
        
        if (handlersSet.size === 0) {
          this.handlers.delete(type);
        }
        
        this.logger.debug(`Handler rimosso per il tipo di messaggio: ${type}`);
      }
    };
  }

  /**
   * Invia un messaggio all'estensione VS Code
   * @param message - Il messaggio da inviare
   */
  public sendMessage<T extends BaseMessage>(message: T): void {
    try {
      // Validazione del messaggio prima dell'invio
      if (!validateMessage(message)) {
        throw new Error(`Messaggio non valido: ${JSON.stringify(message)}`);
      }
      
      this.bridge.postMessage(message);
      this.logger.debug(`Messaggio inviato: ${message.type}`);
    } catch (error) {
      this.logger.error(`Errore nell'invio del messaggio: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Gestisce un messaggio ricevuto
   * @param message - Il messaggio ricevuto
   */
  private handleMessage(message: unknown): void {
    try {
      // Controllo se il messaggio è null o undefined
      if (message === null || message === undefined) {
        this.logger.warn('Ricevuto messaggio null o undefined');
        return;
      }

      // Validazione base del messaggio
      if (!validateMessage(message)) {
        this.logger.warn(`Ricevuto messaggio non valido: ${JSON.stringify(message)}`);
        return;
      }

      const baseMessage = message as BaseMessage;
      const { type } = baseMessage;

      // Utilizzo del validator personalizzato se disponibile
      const customValidator = this.customValidators.get(type);
      if (customValidator && !customValidator(message)) {
        this.logger.warn(`Messaggio non ha superato la validazione personalizzata: ${JSON.stringify(message)}`);
        return;
      }

      // Gestione dei messaggi di errore
      if (isErrorMessage(baseMessage)) {
        this.logger.error(`Ricevuto messaggio di errore: ${baseMessage.error}`);
      }

      // Dispatch ai gestori registrati
      const handlers = this.handlers.get(type);
      if (handlers && handlers.size > 0) {
        handlers.forEach((handler) => {
          try {
            handler(baseMessage);
          } catch (error) {
            this.logger.error(`Errore nell'handler per il messaggio ${type}: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      } else {
        this.logger.debug(`Nessun handler registrato per il messaggio di tipo: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Errore nella gestione del messaggio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Crea e invia un messaggio di errore
   * @param type - Il tipo di messaggio
   * @param error - L'errore da inviare
   */
  public sendErrorMessage(type: string, error: string | Error): void {
    const errorMessage = createErrorMessage(type, error);
    this.sendMessage(errorMessage);
  }

  /**
   * Rimuove tutti gli handler registrati
   */
  public clearHandlers(): void {
    this.handlers.clear();
    this.logger.info('Tutti gli handler sono stati rimossi');
  }

  /**
   * Reset dell'istanza singola (utile per i test)
   */
  public static resetInstance(): void {
    WebviewDispatcher.instance = undefined as any;
  }
} 