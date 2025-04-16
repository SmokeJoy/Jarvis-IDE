import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewMessageHandler } from './handlers/WebviewMessageHandler';
import { TaskQueueMessageHandler } from './handlers/TaskQueueMessageHandler';
import { Logger } from '../utils/logger';
import { MasManager } from '../mas/MasManager';
import { BaseWebviewMessageHandler } from './handlers/BaseWebviewMessageHandler';

/**
 * Gestisce la WebView e i suoi handler di messaggi
 */
export class WebviewManager {
  private static instance: WebviewManager;
  private _panel: vscode.WebviewPanel | undefined;
  private _handlers: BaseWebviewMessageHandler[] = [];
  private _context: vscode.ExtensionContext;
  private _masManager: MasManager;
  private _logger: Logger;

  private constructor(context: vscode.ExtensionContext, masManager: MasManager) {
    this._context = context;
    this._masManager = masManager;
    this._logger = new Logger('WebviewManager');

    // Registra gli handler dei messaggi
    this._registerMessageHandlers();
  }

  /**
   * Ottiene l'istanza singleton del WebviewManager
   */
  static getInstance(context: vscode.ExtensionContext, masManager: MasManager): WebviewManager {
    if (!WebviewManager.instance) {
      WebviewManager.instance = new WebviewManager(context, masManager);
    }
    return WebviewManager.instance;
  }

  /**
   * Registra tutti gli handler di messaggi supportati
   */
  private _registerMessageHandlers(): void {
    // Aggiungi qui nuovi handler
    this._handlers.push(new TaskQueueMessageHandler(this._context, this._masManager));
  }

  /**
   * Crea o mostra il pannello WebView
   */
  createOrShowWebview(): void {
    // Se il pannello esiste già, mostralo
    if (this._panel) {
      this._panel.reveal();
      return;
    }

    // Altrimenti, crea un nuovo pannello
    this._panel = vscode.window.createWebviewPanel(
      'jarvisIdeWebview',
      'Jarvis IDE',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this._context.extensionUri.fsPath, 'webview-ui')),
        ],
      }
    );

    // Imposta il contenuto HTML
    this._panel.webview.html = this._getWebviewContent();

    // Inizializza gli handler con la webview
    this._handlers.forEach((handler) => {
      if (typeof (handler as any).initialize === 'function') {
        (handler as any).initialize(this._panel!.webview);
      }
    });

    // Registra il gestore dei messaggi
    this._panel.webview.onDidReceiveMessage(
      this._handleWebviewMessage.bind(this),
      undefined,
      this._context.subscriptions
    );

    // Gestisci la chiusura del pannello
    this._panel.onDidDispose(
      () => {
        this._panel = undefined;
        this._handlers.forEach((handler) => handler.dispose());
      },
      null,
      this._context.subscriptions
    );

    this._logger.debug('WebView creata e inizializzata');
  }

  /**
   * Gestisce un messaggio ricevuto dalla WebView
   */
  private _handleWebviewMessage(message: any): void {
    if (!message || !message.type) {
      this._logger.warn('Ricevuto messaggio senza tipo');
      return;
    }

    this._logger.debug(`Ricevuto messaggio di tipo: ${message.type}`);

    // Inoltra il messaggio a tutti gli handler registrati
    this._handlers.forEach((handler) => {
      try {
        handler.processMessage(message);
      } catch (error) {
        this._logger.error(`Errore durante la gestione del messaggio: ${error}`);
      }
    });
  }

  /**
   * Ottiene il contenuto HTML per la WebView
   */
  private _getWebviewContent(): string {
    // Verifica se siamo in ambiente di sviluppo
    const isDevelopment = process.env['NODE_ENV'] === 'development';

    if (isDevelopment) {
      // Durante lo sviluppo, utilizza un server locale
      return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Jarvis IDE</title>
          <script>
            const vscode = acquireVsCodeApi();
            window.vscode = vscode;
          </script>
        </head>
        <body>
          <div id="root">Caricamento dell'applicazione...</div>
          <script src="http://localhost:3000/main.js"></script>
        </body>
        </html>`;
    }

    // In produzione, carica il bundle compilato
    const webviewPath = path.join(this._context.extensionUri.fsPath, 'webview-ui', 'build');
    const scriptUri = this._panel!.webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewPath, 'main.js'))
    );
    const styleUri = this._panel!.webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewPath, 'main.css'))
    );

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this._panel!.webview.cspSource} https:; script-src ${this._panel!.webview.cspSource}; style-src ${this._panel!.webview.cspSource};">
        <title>Jarvis IDE</title>
        <link rel="stylesheet" href="${styleUri}">
        <script>
          const vscode = acquireVsCodeApi();
          window.vscode = vscode;
        </script>
      </head>
      <body>
        <div id="root">Caricamento dell'applicazione...</div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  /**
   * Invia un messaggio alla WebView
   */
  postMessage(message: any): void {
    if (this._panel) {
      this._panel.webview.postMessage(message);
    }
  }

  /**
   * Libera le risorse
   */
  dispose(): void {
    if (this._panel) {
      this._panel.dispose();
      this._panel = undefined;
    }

    this._handlers.forEach((handler) => handler.dispose());
    this._handlers = [];
  }
}
