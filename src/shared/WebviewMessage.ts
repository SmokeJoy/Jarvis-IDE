/**
 * Definizioni dei tipi per i messaggi inviati dalla WebView all'estensione
 */

/**
 * Interfaccia di base per tutti i messaggi WebView
 */
export interface WebviewMessageBase {
  type: string;
  payload?: unknown;
}

/**
 * Richiesta impostazioni
 */
export interface GetSettingsMessage extends WebviewMessageBase {
  type: 'getSettings';
}

/**
 * Salvataggio impostazioni
 */
export interface SaveSettingsMessage extends WebviewMessageBase {
  type: 'saveSettings';
  payload: {
    apiKey?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    [key: string]: unknown;
  };
}

/**
 * Richiesta di chat
 */
export interface ChatRequestMessage extends WebviewMessageBase {
  type: 'chatRequest';
  payload: {
    prompt: string;
    messageId?: string;
    contextFiles?: string[];
    systemPrompt?: string;
  };
}

/**
 * Annullamento richiesta
 */
export interface CancelRequestMessage extends WebviewMessageBase {
  type: 'cancelRequest';
}

/**
 * Pulizia chat
 */
export interface ClearChatMessage extends WebviewMessageBase {
  type: 'clearChat';
}

/**
 * Reset chiave API
 */
export interface ResetApiKeyMessage extends WebviewMessageBase {
  type: 'resetApiKey';
}

/**
 * Esportazione chat
 */
export interface ExportChatMessage extends WebviewMessageBase {
  type: 'exportChat';
  payload: {
    format: 'markdown' | 'html' | 'pdf' | 'json';
  };
}

/**
 * Esecuzione comando
 */
export interface ExecuteCommandMessage extends WebviewMessageBase {
  type: 'executeCommand';
  payload: {
    command: string;
    args?: any[];
  };
}

/**
 * Selezione file
 */
export interface SelectFilesMessage extends WebviewMessageBase {
  type: 'selectFiles';
}

/**
 * Caricamento contesto
 */
export interface LoadContextMessage extends WebviewMessageBase {
  type: 'loadContext';
  payload: {
    path: string;
    recursive?: boolean;
  };
}

/**
 * Cambio modello
 */
export interface ModelSwitchMessage extends WebviewMessageBase {
  type: 'modelSwitch';
  payload: {
    modelId: string;
  };
}

/**
 * Aggiornamento progresso
 */
export interface ProgressUpdateMessage extends WebviewMessageBase {
  type: 'progressUpdate';
  payload: {
    id: string;
    progress: number;
    message?: string;
  };
}

/**
 * Ricerca nella documentazione (deprecato)
 * @deprecated Usare executeCommand invece
 */
export interface SearchDocsMessage extends WebviewMessageBase {
  type: 'searchDocs';
  payload: {
    query: string;
  };
}

/**
 * Tipo unione che rappresenta tutti i possibili messaggi della WebView
 */
export type WebviewMessage =
  | GetSettingsMessage
  | SaveSettingsMessage
  | ChatRequestMessage
  | CancelRequestMessage
  | ClearChatMessage
  | ResetApiKeyMessage
  | ExportChatMessage
  | ExecuteCommandMessage
  | SelectFilesMessage
  | LoadContextMessage
  | ModelSwitchMessage
  | ProgressUpdateMessage
  | SearchDocsMessage; 