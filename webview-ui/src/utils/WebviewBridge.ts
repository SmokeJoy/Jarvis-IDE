/**
 * Ponte di comunicazione tra la webview e l'estensione VS Code
 */

import { WebviewMessage } from '../../../src/shared/WebviewMessage';
import { ExtensionMessage } from '../../../src/shared/ExtensionMessage';
import { 
  safeCastAs, 
  isExtensionMessage 
} from '../../../src/shared/typeGuards';
import { getVSCodeAPI } from './messageUtils';

// Tipo per i callback dei messaggi
type MessageCallback = (message: ExtensionMessage) => void;

// WebviewBridge singleton
class WebviewBridge {
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private vscode = getVSCodeAPI();
  
  constructor() {
    // Inizializza il listener di messaggi
    window.addEventListener('message', this.handleMessage);
  }
  
  /**
   * Gestisce i messaggi in arrivo dall'estensione
   */
  private handleMessage = (event: MessageEvent) => {
    const message = event.data;
    
    // Verifica che il messaggio sia un ExtensionMessage valido
    if (!isExtensionMessage(message)) {
      console.warn('Ricevuto messaggio non valido:', message);
      return;
    }
    
    // Estrai il tipo di messaggio
    const { type } = message;
    
    // Chiama i callback registrati per questo tipo di messaggio
    if (this.callbacks.has(type)) {
      const handlers = this.callbacks.get(type);
      if (handlers) {
        handlers.forEach(callback => callback(message));
      }
    }
  }
  
  /**
   * Invia un messaggio all'estensione VS Code con validazione di tipo
   */
  sendMessage(message: WebviewMessage): void {
    try {
      // Validazione del messaggio
      const validMessage = safeCastAs<WebviewMessage>(message);
      // Invio del messaggio
      this.vscode.postMessage(validMessage);
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
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
    }
    
    // Restituisci una funzione per rimuovere il listener
    return () => {
      const set = this.callbacks.get(messageType);
      if (set) {
        set.delete(callback);
      }
    };
  }
  
  /**
   * Rimuove tutti i listener per un tipo di messaggio
   */
  off(messageType: string): void {
    this.callbacks.delete(messageType);
  }
  
  /**
   * Rimuove tutti i listener
   */
  removeAllListeners(): void {
    this.callbacks.clear();
  }
  
  /**
   * Cleanup della classe
   */
  dispose(): void {
    window.removeEventListener('message', this.handleMessage);
    this.removeAllListeners();
  }
}

// Esporta l'istanza singleton
export const webviewBridge = new WebviewBridge(); 