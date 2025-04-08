/**
 * Utilità per la gestione sicura dei messaggi della WebView
 */

import { WebviewMessage } from '../../../src/shared/WebviewMessage';
import { ExtensionMessage } from '../../../src/shared/ExtensionMessage';
import { 
  isWebviewMessage, 
  isExtensionMessage, 
  requireWebviewMessage 
} from '../../../src/shared/typeGuards';

// Riferimento al vscode API
declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

// Singleton vscode API
let vscode: ReturnType<typeof acquireVsCodeApi>;

/**
 * Ottiene l'istanza dell'API VS Code
 */
export function getVSCodeAPI() {
  if (!vscode) {
    try {
      vscode = acquireVsCodeApi();
    } catch (error) {
      console.error('Impossibile acquisire VS Code API', error);
      // Fallback per test/dev
      vscode = {
        postMessage: (message: unknown) => console.log('postMessage:', message),
        getState: () => ({}),
        setState: () => {}
      };
    }
  }
  return vscode;
}

/**
 * Invia un messaggio all'estensione VS Code con validazione di tipo
 * @param message Il messaggio da inviare
 * @throws Error se il messaggio non è un WebviewMessage valido
 */
export function sendMessageToExtension(message: WebviewMessage): void {
  try {
    const validMessage = requireWebviewMessage(message);
    getVSCodeAPI().postMessage(validMessage);
  } catch (error) {
    console.error('Tentativo di invio di un messaggio non valido:', error);
    throw error;
  }
}

/**
 * Crea un listener di messaggi che filtra automaticamente i messaggi dall'estensione
 * @param callback La funzione da chiamare quando arriva un messaggio valido
 * @returns Una funzione per rimuovere il listener
 */
export function createMessageListener(
  callback: (message: ExtensionMessage) => void
): () => void {
  const handler = (event: MessageEvent) => {
    const message = event.data;
    
    if (isExtensionMessage(message)) {
      callback(message);
    } else {
      console.warn('Messaggio ricevuto non è un ExtensionMessage valido:', message);
    }
  };
  
  window.addEventListener('message', handler);
  
  // Restituisce una funzione per rimuovere il listener
  return () => window.removeEventListener('message', handler);
}

/**
 * Utility per la creazione di oggetti WebviewMessage tipizzati
 */
export const createMessage = {
  getSettings: (): WebviewMessage => ({ type: 'getSettings' }),
  
  saveSettings: (settings: any): WebviewMessage => ({
    type: 'saveSettings',
    payload: settings
  }),
  
  chatRequest: (prompt: string, options?: any): WebviewMessage => ({
    type: 'chatRequest',
    payload: {
      prompt,
      ...options
    }
  }),
  
  cancelRequest: (): WebviewMessage => ({ type: 'cancelRequest' }),
  
  clearChat: (): WebviewMessage => ({ type: 'clearChat' }),
  
  resetApiKey: (): WebviewMessage => ({ type: 'resetApiKey' }),
  
  exportChat: (format: 'markdown' | 'html' | 'pdf' | 'json'): WebviewMessage => ({
    type: 'exportChat',
    payload: { format }
  }),
  
  executeCommand: (command: string, args?: any[]): WebviewMessage => ({
    type: 'executeCommand',
    payload: { command, args }
  }),
  
  selectFiles: (): WebviewMessage => ({ type: 'selectFiles' }),
  
  loadContext: (path: string, recursive?: boolean): WebviewMessage => ({
    type: 'loadContext',
    payload: { path, recursive }
  }),
  
  modelSwitch: (modelId: string): WebviewMessage => ({
    type: 'modelSwitch',
    payload: { modelId }
  })
}; 