/**
 * @file WebviewDispatcher.ts
 * @description Gestisce la comunicazione bidirezionale tra WebView ed Extension
 */

import { Observable, Subject, filter, map } from 'rxjs';
import { Logger } from './Logger';
import { validateMessage, createMessageValidator, type BaseMessage } from './validate';

const logger = new Logger('WebviewDispatcher');

/**
 * Tipo per gli handler dei messaggi
 */
export type MessageHandler<T = unknown> = (payload: T, message: BaseMessage<T>) => void;

/**
 * Classe singleton che gestisce la comunicazione bidirezionale tra WebView ed Extension
 */
export class WebviewDispatcher {
  private static instance: WebviewDispatcher | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private messagesSubject: Subject<BaseMessage> = new Subject<BaseMessage>();

  /**
   * Costruttore privato per garantire il pattern singleton
   */
  private constructor() {
    logger.debug('WebviewDispatcher istanziato');

    // Registra l'handler per i messaggi dal vscode.postMessage
    window.addEventListener('message', this.handleVscodeMessage);
  }

  /**
   * Restituisce l'istanza della classe (singleton)
   * @returns L'istanza del WebviewDispatcher
   */
  public static getInstance(): WebviewDispatcher {
    if (!this.instance) {
      this.instance = new WebviewDispatcher();
    }
    return this.instance;
  }

  /**
   * Gestisce i messaggi in arrivo da vscode
   * @param event Evento di messaggistica
   */
  private handleVscodeMessage = (event: MessageEvent) => {
    const message = event.data;
    logger.debug('Messaggio ricevuto', message);

    const validation = validateMessage(message);
    if (!validation.valid) {
      logger.error(`Messaggio non valido: ${validation.error}`, message);
      return;
    }

    // Passa il messaggio a tutti gli observable
    this.messagesSubject.next(message as BaseMessage);

    // Gestisci il messaggio
    this.dispatchMessage(message as BaseMessage);
  };

  /**
   * Invia un messaggio a vscode
   * @param message Il messaggio da inviare
   * @returns true se il messaggio è stato inviato con successo
   */
  public sendMessage<T = Record<string, unknown>>(message: BaseMessage<T>): boolean {
    const validation = validateMessage(message);
    if (!validation.valid) {
      logger.error(`Invio messaggio fallito - Validazione: ${validation.error}`, message);
      return false;
    }

    try {
      // @ts-ignore - vscode non è riconosciuto dal compilatore ma è disponibile in runtime
      window.vscode?.postMessage(message);
      logger.debug('Messaggio inviato', message);
      return true;
    } catch (error) {
      logger.error(`Errore nell'invio del messaggio: ${error}`, message);
      return false;
    }
  }

  /**
   * Gestisce il dispatch del messaggio agli handler registrati
   * @param message Il messaggio da dispatcare
   */
  private dispatchMessage(message: BaseMessage): void {
    const { type } = message;
    const handlersForType = this.handlers.get(type);

    if (!handlersForType || handlersForType.size === 0) {
      logger.warn(`Nessun handler registrato per il messaggio di tipo '${type}'`);
      return;
    }

    logger.debug(`Dispatching messaggio '${type}' a ${handlersForType.size} handlers`);
    handlersForType.forEach((handler) => {
      try {
        handler(message.payload, message);
      } catch (error) {
        logger.error(`Errore nell'handler per il messaggio '${type}': ${error}`);
      }
    });
    }

  /**
   * Registra un handler per un tipo specifico di messaggio
   * @param type Il tipo di messaggio da gestire
   * @param handler La funzione di callback da invocare
   * @returns Una funzione per deregistrare l'handler
   */
  public on<T = unknown>(type: string, handler: MessageHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlersSet = this.handlers.get(type)!;
    handlersSet.add(handler as MessageHandler);
    logger.debug(`Handler registrato per il messaggio di tipo '${type}'`);

    // Restituisci una funzione di cleanup
    return () => {
      handlersSet.delete(handler as MessageHandler);
      logger.debug(`Handler deregistrato per il messaggio di tipo '${type}'`);
    };
  }

  /**
   * Crea un Observable che emette solo messaggi di un tipo specifico
   * @param type Il tipo di messaggio da osservare
   * @returns Un Observable dei messaggi filtrati
   */
  public onMessage<T = unknown>(type: string): Observable<BaseMessage<T>> {
    return this.messagesSubject.pipe(
      filter((message) => message.type === type),
      map((message) => message as BaseMessage<T>)
    );
    }

  /**
   * Crea un validatore di messaggi specializzato
   * @param type Il tipo di messaggio da validare
   * @param requiredFields I campi richiesti nel payload
   * @returns Una funzione per validare messaggi di quel tipo
   */
  public createValidator(type: string, requiredFields: string[] = []) {
    return createMessageValidator(type, requiredFields);
  }

  /**
   * Libera le risorse (rimuove gli event listener)
   */
  public dispose(): void {
    window.removeEventListener('message', this.handleVscodeMessage);
    this.handlers.clear();
    logger.debug('WebviewDispatcher disposed');
    }
}

// Esportazione singleton
export const webviewDispatcher = WebviewDispatcher.getInstance();