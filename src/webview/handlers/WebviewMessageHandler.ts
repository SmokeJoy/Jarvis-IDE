import * as vscode from 'vscode';
import type { WebviewMessage } from '../../types/webview.types.js.js';

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