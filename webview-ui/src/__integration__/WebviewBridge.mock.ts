/**
 * Mock semplificato del WebviewBridge per i test di integrazione
 */
import { WebviewMessage, ExtensionMessage } from './type-validation.mock';

// Logger condiviso per il bridge webview
interface Logger {
  debug: (message: string, ...data: unknown[]) => void;
  info: (message: string, ...data: unknown[]) => void;
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
}

const logger: Logger = {
  debug: (message: string, ...data: unknown[]) => console.log(`[WebviewBridge] ${message}`, ...data),
  info: (message: string, ...data: unknown[]) => console.info(`[WebviewBridge] ${message}`, ...data),
  warn: (message: string, ...data: unknown[]) => console.warn(`[WebviewBridge] ${message}`, ...data),
  error: (message: string, ...data: unknown[]) => console.error(`[WebviewBridge] ${message}`, ...data)
};

// Tipo per i callback dei messaggi
type MessageCallback = (message: ExtensionMessage) => void;

// Interfaccia per l'API VS Code
interface VSCodeAPI {
  postMessage: (msg: WebviewMessage) => void;
}

/**
 * Versione semplificata del WebviewBridge per i test
 */
class WebviewBridgeMock {
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private vscode: VSCodeAPI;
  private isConnected = true;
  
  constructor() {
    // Inizializza il vscode mock
    this.vscode = {
      postMessage: (msg: WebviewMessage) => {
        logger.debug(`Messaggio inviato di tipo '${msg.type}'`, msg);
      }
    };
    
    // Inizializza il listener di messaggi
    window.addEventListener('message', this.handleMessage);
    logger.debug('WebviewBridge mock inizializzato');
  }
  
  /**
   * Gestisce i messaggi in arrivo
   */
  private handleMessage = (event: MessageEvent) => {
    const message = event.data as ExtensionMessage;
    
    // Conferma che la connessione è attiva
    this.isConnected = true;
    
    // Verifica che il messaggio sia valido
    if (!message || typeof message !== 'object' || !message.type) {
      logger.warn('Messaggio ricevuto non valido', message);
      return;
    }
    
    // Estrai il tipo di messaggio
    const { type } = message;
    
    // Chiama i callback registrati per questo tipo di messaggio
    if (this.callbacks.has(type)) {
      const handlers = this.callbacks.get(type);
      if (handlers) {
        handlers.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            logger.error(`Errore nel callback per il messaggio di tipo '${type}':`, error);
          }
        });
      }
    }
  }
  
  /**
   * Invia un messaggio all'estensione VS Code
   */
  sendMessage(message: WebviewMessage): void {
    try {
      // Validazione del messaggio
      if (!message || typeof message !== 'object' || !message.type) {
        throw new Error('Formato messaggio non valido');
      }
      
      // Invio del messaggio
      this.vscode.postMessage(message);
      logger.debug(`Messaggio inviato di tipo '${message.type}'`, message);
    } catch (error) {
      logger.error('Errore nell\'invio del messaggio:', error);
      throw error;
    }
  }
  
  /**
   * Ascolta i messaggi di un tipo specifico
   */
  on(messageType: string, callback: MessageCallback): () => void {
    // Inizializza il set dei callback se non esiste
    if (!this.callbacks.has(messageType)) {
      this.callbacks.set(messageType, new Set());
    }
    
    // Aggiungi il callback
    const handlers = this.callbacks.get(messageType);
    if (handlers) {
      handlers.add(callback);
      logger.debug(`Listener aggiunto per il tipo '${messageType}'`);
    }
    
    // Restituisci una funzione per rimuovere il listener
    return () => {
      const set = this.callbacks.get(messageType);
      if (set) {
        set.delete(callback);
        logger.debug(`Listener rimosso per il tipo '${messageType}'`);
      }
    };
  }
  
  /**
   * Rimuove tutti i listener per un tipo di messaggio
   */
  off(messageType: string): void {
    this.callbacks.delete(messageType);
    logger.debug(`Tutti i listener rimossi per il tipo '${messageType}'`);
  }
  
  /**
   * Rimuove tutti i listener
   */
  removeAllListeners(): void {
    this.callbacks.clear();
    logger.debug('Tutti i listener sono stati rimossi');
  }
  
  /**
   * Controlla se il bridge è connesso all'estensione
   */
  isExtensionConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Cleanup della classe
   */
  dispose(): void {
    window.removeEventListener('message', this.handleMessage);
    this.removeAllListeners();
    logger.debug('WebviewBridge distrutto');
  }
}

// Esporta l'istanza singleton
export const webviewBridge = new WebviewBridgeMock(); 