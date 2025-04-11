/**
 * Utilità per la gestione sicura dei messaggi della WebView
 */

import { 
  WebviewMessage,
  ExtensionMessage, 
  WebviewMessageType
} from '../../../src/shared/types/webview.types';
import { t } from '../i18n';

// Logger condiviso per le operazioni di messaggistica
const logger = {
  debug: (message: string, ...data: any[]) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[WebView] ${message}`, ...data);
    }
  },
  info: (message: string, ...data: any[]) => console.info(`[WebView] ${message}`, ...data),
  warn: (message: string, ...data: any[]) => console.warn(`[WebView] ${message}`, ...data),
  error: (message: string, ...data: any[]) => console.error(`[WebView] ${message}`, ...data)
};

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
      logger.error(t('errors.vsCodeApiNotAvailable'), error);
      // Fallback per test/dev
      vscode = {
        postMessage: (message: unknown) => logger.debug('postMessage:', message),
        getState: () => ({}),
        setState: () => {}
      };
    }
  }
  return vscode;
}

/**
 * Verifica se un messaggio è un WebviewMessage valido
 * @param message Il messaggio da verificare
 */
export function isValidWebviewMessage(message: any): message is WebviewMessage {
  return (
    message &&
    typeof message === 'object' &&
    'type' in message &&
    typeof message.type === 'string'
  );
}

/**
 * Verifica se un messaggio è un ExtensionMessage valido
 * @param message Il messaggio da verificare
 */
export function isValidExtensionMessage(message: any): message is ExtensionMessage {
  return (
    message &&
    typeof message === 'object' &&
    'type' in message &&
    typeof message.type === 'string'
  );
}

/**
 * Invia un messaggio all'estensione VS Code con validazione di tipo
 * @param message Il messaggio da inviare
 * @throws Error se il messaggio non è un WebviewMessage valido
 */
export function sendMessageToExtension(message: WebviewMessage): void {
  try {
    if (!isValidWebviewMessage(message)) {
      throw new Error(t('errors.invalidMessageFormat'));
    }
    
    logger.debug(`Invio messaggio all'estensione di tipo: ${message.type}`, message);
    getVSCodeAPI().postMessage(message);
  } catch (error) {
    logger.error(t('errors.sendFailed'), error, message);
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
    
    if (isValidExtensionMessage(message)) {
      logger.debug(`Messaggio ricevuto dall'estensione di tipo: ${message.type}`);
      callback(message);
    } else {
      logger.warn(t('errors.invalidMessageReceived'), message);
    }
  };
  
  window.addEventListener('message', handler);
  logger.debug('Listener dei messaggi registrato');
  
  // Restituisce una funzione per rimuovere il listener
  return () => {
    window.removeEventListener('message', handler);
    logger.debug('Listener dei messaggi rimosso');
  };
}

/**
 * Utility per la creazione di oggetti WebviewMessage tipizzati
 */
export const createMessage = {
  getSettings: (): WebviewMessage => ({ 
    type: WebviewMessageType.GET_SETTINGS 
  }),
  
  saveSettings: (settings: any): WebviewMessage => ({
    type: WebviewMessageType.SAVE_SETTINGS,
    payload: settings
  }),
  
  chatRequest: (prompt: string, options?: any): WebviewMessage => ({
    type: WebviewMessageType.SEND_PROMPT,
    payload: {
      prompt,
      ...options
    }
  }),
  
  cancelRequest: (): WebviewMessage => ({ 
    type: 'cancelRequest' // Per compatibilità con il sistema esistente
  }),
  
  clearChat: (): WebviewMessage => ({ 
    type: WebviewMessageType.CLEAR_CHAT_HISTORY
  }),
  
  resetApiKey: (): WebviewMessage => ({ 
    type: 'resetApiKey' // Per compatibilità con il sistema esistente
  }),
  
  exportChat: (format: 'markdown' | 'html' | 'pdf' | 'json'): WebviewMessage => ({
    type: WebviewMessageType.EXPORT_CHAT_HISTORY,
    payload: { format }
  }),
  
  executeCommand: (command: string, args?: any[]): WebviewMessage => ({
    type: 'executeCommand', // Per compatibilità con il sistema esistente
    payload: { command, args }
  }),
  
  selectFiles: (): WebviewMessage => ({ 
    type: WebviewMessageType.SELECT_IMAGES
  }),
  
  loadContext: (path: string, recursive?: boolean): WebviewMessage => ({
    type: 'loadContext', // Per compatibilità con il sistema esistente
    payload: { path, recursive }
  }),
  
  modelSwitch: (modelId: string): WebviewMessage => ({
    type: 'modelSwitch', // Per compatibilità con il sistema esistente
    payload: { modelId }
  })
}; 