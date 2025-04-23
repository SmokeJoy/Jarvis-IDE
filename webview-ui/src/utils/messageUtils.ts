import { Message as WebviewMessage, isWebviewMessage } from '@shared/messages';
import { t } from '../i18n';

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

declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

let vscode: ReturnType<typeof acquireVsCodeApi>;

export function getVSCodeAPI() {
  if (!vscode) {
    try {
      vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error(t('errors.vsCodeApiNotAvailable'), error);
      vscode = {
        postMessage: (message: unknown) => logger.debug('postMessage:', message),
        getState: () => ({}),
        setState: () => {}
      };
    }
  }
  return vscode;
}

export function isValidWebviewMessage(msg: unknown): msg is WebviewMessage {
  return isWebviewMessage(msg);
}

export function sendMessageToExtension<T extends WebviewMessage>(message: T): void {
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

export function createMessageListener(
  callback: (message: WebviewMessage) => void
): () => void {
  const handler = (event: MessageEvent) => {
    const message = event.data;
    if (message && isWebviewMessage(message)) {
      logger.debug(`Messaggio ricevuto dall'estensione di tipo: ${message.type}`);
      callback(message);
    } else {
      logger.warn(t('errors.invalidMessageReceived'), message);
    }
  };
  window.addEventListener('message', handler);
  logger.debug('Listener dei messaggi registrato');
  return () => {
    window.removeEventListener('message', handler);
    logger.debug('Listener dei messaggi rimosso');
  };
}

export const createMessage = {
  getSettings: (): WebviewMessage => ({ type: 'GET_SETTINGS' } as unknown as WebviewMessage),
  saveSettings: (settings: unknown): WebviewMessage => ({ type: 'SAVE_SETTINGS', payload: settings } as unknown as WebviewMessage),
  chatRequest: (prompt: string, options?: unknown): WebviewMessage => ({ type: 'LLM_REQUEST', payload: { prompt, ...(options as object) } } as unknown as WebviewMessage),
  cancelRequest: (): WebviewMessage => ({ type: 'LLM_CANCEL' } as unknown as WebviewMessage),
  clearChat: (): WebviewMessage => ({ type: 'CLEAR_CHAT_HISTORY' } as unknown as WebviewMessage),
  resetApiKey: (): WebviewMessage => ({ type: 'RESET_API_KEY' } as unknown as WebviewMessage),
  exportChat: (format: 'markdown' | 'html' | 'pdf' | 'json'): WebviewMessage => ({ type: 'EXPORT_CHAT_HISTORY', payload: { format } } as unknown as WebviewMessage),
  executeCommand: (command: string, args?: unknown[]): WebviewMessage => ({ type: 'EXECUTE_COMMAND', payload: { command, args } } as unknown as WebviewMessage),
  selectFiles: (): WebviewMessage => ({ type: 'SELECT_IMAGES' } as unknown as WebviewMessage),
  loadContext: (path: string, recursive?: boolean): WebviewMessage => ({ type: 'LOAD_CONTEXT', payload: { path, recursive } } as unknown as WebviewMessage),
  modelSwitch: (modelId: string): WebviewMessage => ({ type: 'MODEL_SWITCH', payload: { modelId } } as unknown as WebviewMessage),
};