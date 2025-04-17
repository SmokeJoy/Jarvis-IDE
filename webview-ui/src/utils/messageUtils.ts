import { WebviewMessageUnion, isWebviewMessage } from '@shared/types/messages-barrel';
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

export function isValidWebviewMessage(msg: unknown): msg is WebviewMessageUnion {
  return isWebviewMessage(msg);
}

export function sendMessageToExtension<T extends WebviewMessageUnion>(message: T): void {
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
  callback: (message: WebviewMessageUnion) => void
): () => void {
  const handler = (event: MessageEvent) => {
    const message = event.data;
    if (message && isValidWebviewMessage(message)) {
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
  getSettings: (): WebviewMessageUnion => ({ type: 'GET_SETTINGS' }),
  saveSettings: (settings: any): WebviewMessageUnion => ({ type: 'SAVE_SETTINGS', payload: settings }),
  chatRequest: (prompt: string, options?: any): WebviewMessageUnion => ({ type: 'LLM_REQUEST', payload: { prompt, ...options } }),
  cancelRequest: (): WebviewMessageUnion => ({ type: 'LLM_CANCEL' }),
  clearChat: (): WebviewMessageUnion => ({ type: 'CLEAR_CHAT_HISTORY' }),
  resetApiKey: (): WebviewMessageUnion => ({ type: 'RESET_API_KEY' }),
  exportChat: (format: 'markdown' | 'html' | 'pdf' | 'json'): WebviewMessageUnion => ({ type: 'EXPORT_CHAT_HISTORY', payload: { format } }),
  executeCommand: (command: string, args?: any[]): WebviewMessageUnion => ({ type: 'EXECUTE_COMMAND', payload: { command, args } }),
  selectFiles: (): WebviewMessageUnion => ({ type: 'SELECT_IMAGES' }),
  loadContext: (path: string, recursive?: boolean): WebviewMessageUnion => ({ type: 'LOAD_CONTEXT', payload: { path, recursive } }),
  modelSwitch: (modelId: string): WebviewMessageUnion => ({ type: 'MODEL_SWITCH', payload: { modelId } })
};