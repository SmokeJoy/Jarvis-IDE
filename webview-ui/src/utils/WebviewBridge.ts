/**
 * @file WebviewBridge.ts
 * @description Bridge per la comunicazione tra la WebView e l'estensione VS Code
 */

import { Logger } from './Logger';

// Interfaccia che rappresenta l'acquirente dei messaggi VSCode
declare global {
  interface Window {
    // Interfaccia per l'API di messaggistica di VS Code
    acquireVsCodeApi?: () => {
      postMessage: (message: unknown) => void;
      setState: (state: unknown) => void;
      getState: () => unknown;
    };
  }
}

// Tipo per la funzione handler di messaggi
export type MessageListener = (message: unknown) => void;

/**
 * WebviewBridge gestisce la comunicazione bi-direzionale tra WebView e VS Code.
 * Implementa un pattern singleton per garantire un'unica istanza in tutta l'applicazione.
 */
export class WebviewBridge {
  private static instance: WebviewBridge;
  private vscode: ReturnType<NonNullable<typeof window.acquireVsCodeApi>> | null = null;
  private listeners: Set<MessageListener> = new Set();
  private logger: Logger;
  private initialized: boolean = false;

  /**
   * Costruttore privato per implementare il pattern singleton
   * @param logger - L'istanza di Logger da utilizzare
   */
  private constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Ottiene l'istanza singola di WebviewBridge
   * @param logger - L'istanza di Logger da utilizzare
   * @returns L'istanza di WebviewBridge
   */
  public static getInstance(logger: Logger): WebviewBridge {
    if (!WebviewBridge.instance) {
      WebviewBridge.instance = new WebviewBridge(logger);
    }
    return WebviewBridge.instance;
  }

  /**
   * Inizializza il bridge acquisendo l'API VS Code e configurando i listener
   * @returns true se l'inizializzazione ha avuto successo, false altrimenti
   */
  public initialize(): boolean {
    if (this.initialized) {
      this.logger.warn('WebviewBridge è già stato inizializzato');
      return true;
    }

    try {
      // Acquisisci l'API VS Code
      if (typeof window.acquireVsCodeApi === 'function') {
        this.vscode = window.acquireVsCodeApi();
        
        // Configura il listener per i messaggi in arrivo
        window.addEventListener('message', this.handleWindowMessage);
        
        this.initialized = true;
        this.logger.info('WebviewBridge inizializzato con successo');
        return true;
      } else {
        // Nel caso in cui non siamo in un contesto VS Code (ad es. durante lo sviluppo)
        this.logger.warn('acquireVsCodeApi non è disponibile. WebviewBridge funzionerà in modalità mock');
        return false;
      }
    } catch (error) {
      this.logger.error(`Errore nell'inizializzazione di WebviewBridge: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Gestisce i messaggi in arrivo dalla finestra
   * @param event - L'evento di messaggio
   */
  private handleWindowMessage = (event: MessageEvent): void => {
    try {
      // Estrarre il messaggio dai dati dell'evento
      const message = event.data;
      
      // Utilizzare un timeout per evitare blocchi nell'handler dell'evento
      setTimeout(() => {
        this.notifyListeners(message);
      }, 0);
    } catch (error) {
      this.logger.error(`Errore nella gestione del messaggio dalla finestra: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Notifica tutti i listener registrati
   * @param message - Il messaggio da inviare ai listener
   */
  private notifyListeners(message: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        this.logger.error(`Errore nella notifica del listener: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Registra un listener per i messaggi in arrivo
   * @param listener - La funzione che gestirà i messaggi in arrivo
   * @returns Una funzione per rimuovere il listener
   */
  public onMessage(listener: MessageListener): () => void {
    // Assicurati che il bridge sia inizializzato
    if (!this.initialized) {
      this.initialize();
    }

    this.listeners.add(listener);
    this.logger.debug('Listener registrato per i messaggi in arrivo');
    
    // Restituisce una funzione per rimuovere il listener
    return () => {
      this.listeners.delete(listener);
      this.logger.debug('Listener rimosso');
    };
  }

  /**
   * Invia un messaggio all'estensione VS Code
   * @param message - Il messaggio da inviare
   * @returns true se il messaggio è stato inviato con successo, false altrimenti
   */
  public postMessage(message: unknown): boolean {
    // Assicurati che il bridge sia inizializzato
    if (!this.initialized) {
      this.initialize();
    }

    try {
      if (this.vscode) {
        this.vscode.postMessage(message);
        this.logger.debug('Messaggio inviato a VS Code');
        return true;
      } else {
        this.logger.warn('Impossibile inviare il messaggio: l\'API VS Code non è disponibile');
        return false;
      }
    } catch (error) {
      this.logger.error(`Errore nell'invio del messaggio: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Salva lo stato nella memoria di VS Code
   * @param state - Lo stato da salvare
   * @returns true se lo stato è stato salvato con successo, false altrimenti
   */
  public setState(state: unknown): boolean {
    // Assicurati che il bridge sia inizializzato
    if (!this.initialized) {
      this.initialize();
    }

    try {
      if (this.vscode) {
        this.vscode.setState(state);
        this.logger.debug('Stato salvato in VS Code');
        return true;
      } else {
        this.logger.warn('Impossibile salvare lo stato: l\'API VS Code non è disponibile');
        return false;
      }
    } catch (error) {
      this.logger.error(`Errore nel salvataggio dello stato: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Ottiene lo stato salvato da VS Code
   * @returns Lo stato salvato o undefined se non è stato possibile recuperarlo
   */
  public getState<T = unknown>(): T | undefined {
    // Assicurati che il bridge sia inizializzato
    if (!this.initialized) {
      this.initialize();
    }

    try {
      if (this.vscode) {
        const state = this.vscode.getState() as T;
        this.logger.debug('Stato recuperato da VS Code');
        return state;
      } else {
        this.logger.warn('Impossibile recuperare lo stato: l\'API VS Code non è disponibile');
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Errore nel recupero dello stato: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Rimuove un listener specifico
   * @param listener - Il listener da rimuovere
   * @returns true se il listener è stato rimosso, false altrimenti
   */
  public removeListener(listener: MessageListener): boolean {
    const wasPresent = this.listeners.has(listener);
    this.listeners.delete(listener);
    
    if (wasPresent) {
      this.logger.debug('Listener rimosso');
    }
    
    return wasPresent;
  }

  /**
   * Rimuove tutti i listener registrati
   */
  public clearListeners(): void {
    this.listeners.clear();
    this.logger.info('Tutti i listener sono stati rimossi');
  }

  /**
   * Dismette il bridge rimuovendo i listener dagli eventi della finestra
   */
  public dispose(): void {
    window.removeEventListener('message', this.handleWindowMessage);
    this.listeners.clear();
    this.initialized = false;
    this.logger.info('WebviewBridge dismesso');
  }

  /**
   * Reset dell'istanza singola (utile per i test)
   */
  public static resetInstance(): void {
    if (WebviewBridge.instance) {
      WebviewBridge.instance.dispose();
    }
    WebviewBridge.instance = undefined as any;
  }
} 