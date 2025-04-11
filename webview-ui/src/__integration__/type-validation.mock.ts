/**
 * Mock dei tipi per i test di validazione
 * Questo file è necessario perché i tipi reali hanno dipendenze complesse
 * che rendono difficile l'importazione diretta nei test.
 */

export enum WebviewMessageType {
  SEND_PROMPT = 'SEND_PROMPT',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  GET_SETTINGS = 'GET_SETTINGS',
  CLEAR_CHAT_HISTORY = 'CLEAR_CHAT_HISTORY',
  EXPORT_CHAT_HISTORY = 'EXPORT_CHAT_HISTORY',
  SAVE_SETTINGS = 'SAVE_SETTINGS',
  SELECT_IMAGES = 'SELECT_IMAGES',
  ERROR = 'ERROR'
}

// Interfacce per i vari tipi di payload
export interface PromptPayload {
  prompt: string;
  images?: string[];
}

export interface SettingsPayload {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface ErrorPayload {
  message: string;
  code?: number;
  details?: unknown;
}

// Tipo unione per tutti i possibili payload
export type WebviewPayload = 
  | PromptPayload
  | SettingsPayload
  | ErrorPayload
  | Record<string, unknown>;

export interface WebviewMessage {
  type: WebviewMessageType | string;
  payload?: WebviewPayload;
  id?: string;
}

// Tipi per la risposta dell'estensione
export interface ExtensionResponsePayload {
  result?: unknown;
  settings?: Record<string, unknown>;
  status?: string;
  [key: string]: unknown;
}

export interface ExtensionMessage {
  type: string;
  message?: string;
  error?: string;
  id?: string;
  payload?: ExtensionResponsePayload;
} 