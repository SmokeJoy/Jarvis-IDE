import * as vscode from 'vscode';
import { WebviewMessage } from '../../shared/types/webview.types.js';
import { WebviewMessageUnion } from '../../shared/types/webviewMessageUnion.js';
import { WebviewMessageType } from '../../shared/types/webview.types.js';

/**
 * Interfaccia per gli handler di messaggi della WebView
 */
export interface WebviewMessageHandler {
  /**
   * Inizializza l'handler con la webview
   * @param webview La webview a cui collegarsi
   */
  initialize(webview: vscode.Webview): void;
  
  /**
   * Gestisce un messaggio ricevuto dalla webview
   * @param message Il messaggio ricevuto dalla webview
   */
  handleMessage(message: WebviewMessage): void;
  
  /**
   * Libera le risorse utilizzate dall'handler
   */
  dispose(): void;
}

/**
 * Implementazione base del WebviewMessageHandler con supporto per dispatch type-safe
 */
export abstract class BaseWebviewMessageHandler implements WebviewMessageHandler {
  protected _webview: vscode.Webview | null = null;
  
  /**
   * Inizializza l'handler con la webview
   * @param webview La webview a cui collegarsi
   */
  public initialize(webview: vscode.Webview): void {
    this._webview = webview;
  }
  
  /**
   * Gestisce un messaggio ricevuto dalla webview
   * Implementa un dispatch type-safe utilizzando il pattern Extract<T>
   * @param message Il messaggio ricevuto dalla webview
   */
  public handleMessage(message: WebviewMessage): void {
    if (!message || !message.type) {
      console.warn('Ricevuto messaggio senza tipo');
      return;
    }
    
    try {
      // Dispatcher type-safe
      this.dispatchMessage(message as WebviewMessageUnion);
    } catch (error) {
      console.error(`Errore durante la gestione del messaggio: ${error}`);
      this.handleError({
        type: WebviewMessageType.ERROR,
        payload: {
          message: error instanceof Error ? error.message : 'Errore sconosciuto',
          code: 'MESSAGE_HANDLER_ERROR'
        }
      });
    }
  }
  
  /**
   * Dispatcher type-safe per i messaggi WebView
   * @param message Messaggio WebView da dispatchare
   */
  protected abstract dispatchMessage(message: WebviewMessageUnion): void;

  /**
   * Gestisce un messaggio di errore
   * @param errorMessage Messaggio di errore
   */
  protected abstract handleError(errorMessage: Extract<WebviewMessageUnion, { type: typeof WebviewMessageType.ERROR }>): void;
  
  /**
   * Libera le risorse utilizzate dall'handler
   */
  public dispose(): void {
    this._webview = null;
  }
  
  /**
   * Invia un messaggio alla WebView
   * @param message Messaggio da inviare alla WebView
   */
  protected postMessageToWebview(message: WebviewMessage): void {
    if (!this._webview) {
      console.warn('WebView non disponibile, impossibile inviare il messaggio');
      return;
    }
    
    try {
      this._webview.postMessage(message);
    } catch (error) {
      console.error('Errore durante invio messaggio a Webview:', error);
    }
  }
}