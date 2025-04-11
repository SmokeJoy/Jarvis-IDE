/**
 * Tipi di messaggi supportati tra VSCode e Webview
 */
export type WebviewMessageType = 
  | 'updateSettings'
  | 'modelSelected'
  | 'apiKeyUpdated'
  | 'error'
  | 'info';

/**
 * Interfaccia base per tutti i messaggi
 */
export interface BaseWebviewMessage {
  type: WebviewMessageType;
  timestamp: number;
}

/**
 * Messaggio di aggiornamento impostazioni
 */
export interface SettingsUpdateMessage extends BaseWebviewMessage {
  type: 'updateSettings';
  payload: {
    theme?: 'light' | 'dark' | 'system';
    fontSize?: number;
    enableNotifications?: boolean;
    language?: string;
  };
}

/**
 * Messaggio di selezione modello
 */
export interface ModelSelectedMessage extends BaseWebviewMessage {
  type: 'modelSelected';
  payload: {
    modelId: string;
    modelInfo: OpenAiCompatibleModelInfo;
  };
}

/**
 * Messaggio di aggiornamento API key
 */
export interface ApiKeyUpdatedMessage extends BaseWebviewMessage {
  type: 'apiKeyUpdated';
  payload: {
    provider: string;
    apiKey: string;
  };
}

/**
 * Messaggio di errore
 */
export interface ErrorMessage extends BaseWebviewMessage {
  type: 'error';
  payload: {
    message: string;
    code?: string;
  };
}

/**
 * Messaggio informativo
 */
export interface InfoMessage extends BaseWebviewMessage {
  type: 'info';
  payload: {
    message: string;
    severity?: 'info' | 'warning' | 'success';
  };
}

/**
 * Unione di tutti i tipi di messaggi
 */
export type WebviewMessage = 
  | SettingsUpdateMessage
  | ModelSelectedMessage
  | ApiKeyUpdatedMessage
  | ErrorMessage
  | InfoMessage; 