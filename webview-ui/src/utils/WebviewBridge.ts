/**
 * Ponte di comunicazione tra la webview e l'estensione VS Code
 */

import { 
  WebviewMessage, 
  ExtensionMessage,
  WebviewMessageType
} from '../../../src/shared/types/webview.types';
import { 
  getVSCodeAPI, 
  isValidExtensionMessage,
  isValidWebviewMessage 
} from './messageUtils';
import { t } from '../i18n';

// Logger condiviso per il bridge webview
const logger = {
  debug: (message: string, ...data: any[]) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[WebviewBridge] ${message}`, ...data);
    }
  },
  info: (message: string, ...data: any[]) => console.info(`[WebviewBridge] ${message}`, ...data),
  warn: (message: string, ...data: any[]) => console.warn(`[WebviewBridge] ${message}`, ...data),
  error: (message: string, ...data: any[]) => console.error(`[WebviewBridge] ${message}`, ...data)
};

// Tipo per i callback dei messaggi
type MessageCallback = (message: ExtensionMessage) => void;

// WebviewBridge singleton
class WebviewBridge {
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private vscode = getVSCodeAPI();
  private isConnected = true;
  
  constructor() {
    // Inizializza il listener di messaggi
    window.addEventListener('message', this.handleMessage);
    logger.debug('WebviewBridge inizializzato');
    
    // Configura un ping per verificare la connessione con l'estensione
    this.setupConnectionCheck();
  }
  
  /**
   * Configura un controllo periodico della connessione con l'estensione
   */
  private setupConnectionCheck() {
    // Ogni 30 secondi verifica che la connessione sia attiva
    setInterval(() => {
      if (!this.isConnected) {
        logger.warn(t('errors.connectionLost'));
        // Tenta un recupero automatico con un ping
        try {
          this.sendMessage({
            type: 'ping',
            id: 'connection-check-' + Date.now()
          });
        } catch (e) {
          logger.error('Impossibile riconnettere', e);
        }
      }
      
      // Reset dello stato di connessione (sarà confermato solo alla risposta successiva)
      this.isConnected = false;
    }, 30000);
  }
  
  /**
   * Gestisce i messaggi in arrivo dall'estensione
   */
  private handleMessage = (event: MessageEvent) => {
    const message = event.data;
    
    // Conferma che la connessione è attiva (ogni messaggio ricevuto lo conferma)
    this.isConnected = true;
    
    // Verifica che il messaggio sia un ExtensionMessage valido
    if (!isValidExtensionMessage(message)) {
      logger.warn(t('errors.invalidMessageReceived'), message);
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
    
    // Gestione speciale per i messaggi di errore
    if (type === 'error' || type === WebviewMessageType.ERROR) {
      logger.error('Errore ricevuto dall\'estensione:', message.error || message);
    }
  }
  
  /**
   * Invia un messaggio all'estensione VS Code con validazione di tipo
   */
  sendMessage(message: WebviewMessage): void {
    try {
      // Validazione del messaggio
      if (!isValidWebviewMessage(message)) {
        throw new Error(t('errors.invalidMessageFormat'));
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
   * Ascolta i messaggi di un tipo specifico dall'estensione
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
export const webviewBridge = new WebviewBridge(); 