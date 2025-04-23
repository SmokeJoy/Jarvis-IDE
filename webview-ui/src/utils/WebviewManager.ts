/**
 * @file WebviewManager.ts
 * @description Gestisce le operazioni di alto livello tra webview ed extension 
 * utilizzando il WebviewDispatcher come layer di comunicazione
 */

import { webviewDispatcher } from './WebviewDispatcher';
import { logger } from './Logger';
import { 
  WebviewMessage, 
  WebviewToExtensionMessageType, 
  ExtensionToWebviewMessageType,
  SettingsResponseMessage,
  ChatCompletionResponseMessage,
  AgentMemoryResponseMessage
} from '../types/WebviewMessage';

/**
 * Gestisce le operazioni di alto livello tra webview ed extension
 * Fornisce API type-safe per le operazioni comuni come richiesta impostazioni,
 * invio prompt, gestione memoria agenti, etc.
 */
export class WebviewManager {
  private static instance: WebviewManager;

  /**
   * Costruttore privato per implementare il pattern Singleton
   */
  private constructor() {
    logger.info('WebviewManager inizializzato');
    this.setupEventListeners();
  }

  /**
   * Restituisce l'istanza singleton del manager
   */
  public static getInstance(): WebviewManager {
    if (!WebviewManager.instance) {
      WebviewManager.instance = new WebviewManager();
    }
    return WebviewManager.instance;
  }

  /**
   * Configura i listener di base per eventi comuni
   */
  private setupEventListeners(): void {
    // Listener per le risposte alle impostazioni
    webviewDispatcher.on<SettingsResponseMessage['payload']>(
      ExtensionToWebviewMessageType.SETTINGS_RESPONSE, 
      (payload) => {
        logger.debug('Impostazioni ricevute dall\'extension', payload);
      }
    );

    // Altri listener base possono essere aggiunti qui
  }

  /**
   * Richiede le impostazioni all'extension
   * @returns true se la richiesta è stata inviata con successo
   */
  public requestSettings(): boolean {
    logger.debug('Richiesta impostazioni all\'extension');
    return webviewDispatcher.sendMessage<void>({
      type: WebviewToExtensionMessageType.GET_SETTINGS
    });
  }

  /**
   * Aggiorna le impostazioni nell'extension
   * @param settings Le impostazioni da aggiornare
   * @returns true se la richiesta è stata inviata con successo
   */
  public updateSettings(settings: Record<string, unknown>): boolean {
    logger.debug('Aggiornamento impostazioni', settings);
    return webviewDispatcher.sendMessage({
      type: WebviewToExtensionMessageType.UPDATE_SETTINGS,
      payload: { settings }
    });
  }

  /**
   * Invia un prompt all'extension per l'elaborazione
   * @param prompt Il testo del prompt
   * @param options Opzioni aggiuntive per l'elaborazione del prompt
   * @returns true se la richiesta è stata inviata con successo
   */
  public sendPrompt(prompt: string, options?: Record<string, unknown>): boolean {
    logger.debug('Invio prompt all\'extension', { prompt, options });
    return webviewDispatcher.sendMessage({
      type: WebviewToExtensionMessageType.SEND_PROMPT,
      payload: { 
        prompt,
        options
      }
    });
  }

  /**
   * Richiede la memoria dell'agente
   * @param filters Filtri opzionali per la memoria (tag, query, etc.)
   * @returns true se la richiesta è stata inviata con successo
   */
  public requestAgentMemory(filters?: Record<string, unknown>): boolean {
    logger.debug('Richiesta memoria agente', filters);
    return webviewDispatcher.sendMessage({
      type: WebviewToExtensionMessageType.GET_AGENT_MEMORY,
      payload: filters || {}
    });
  }

  /**
   * Registra un handler per le risposte di completamento chat
   * @param handler La funzione che gestirà le risposte
   * @returns Una funzione per rimuovere l'handler
   */
  public onChatCompletion(
    handler: (payload: ChatCompletionResponseMessage['payload']) => void
  ): () => void {
    return webviewDispatcher.on<ChatCompletionResponseMessage['payload']>(
      ExtensionToWebviewMessageType.MODEL_RESPONSE,
      handler
    );
  }

  /**
   * Registra un handler per le risposte della memoria agente
   * @param handler La funzione che gestirà le risposte
   * @returns Una funzione per rimuovere l'handler
   */
  public onAgentMemory(
    handler: (payload: AgentMemoryResponseMessage['payload']) => void
  ): () => void {
    return webviewDispatcher.on<AgentMemoryResponseMessage['payload']>(
      ExtensionToWebviewMessageType.AGENT_MEMORY_RESPONSE,
      handler
    );
  }

  /**
   * Cancella la chat corrente
   * @returns true se la richiesta è stata inviata con successo
   */
  public clearChat(): boolean {
    logger.debug('Richiesta pulizia chat');
    return webviewDispatcher.sendMessage<void>({
      type: WebviewToExtensionMessageType.CLEAR_CHAT
    });
  }

  /**
   * Interrompe l'elaborazione corrente
   * @returns true se la richiesta è stata inviata con successo
   */
  public cancelCurrentExecution(): boolean {
    logger.debug('Richiesta interruzione elaborazione');
    return webviewDispatcher.sendMessage<void>({
      type: WebviewToExtensionMessageType.CANCEL_EXECUTION
    });
  }
}

// Esporta l'istanza singleton
export const webviewManager = WebviewManager.getInstance(); 