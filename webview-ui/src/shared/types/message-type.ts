/**
 * @file message-type.ts
 * @description Definizione dei tipi di messaggio supportati per la comunicazione WebView-Extension
 */

/**
 * Enum dei tipi di messaggio supportati
 * 
 * Messaggi da WebView a Extension (TO_EXTENSION):
 * - GET_SETTINGS: Richiesta delle impostazioni
 * - SAVE_SETTINGS: Salva le impostazioni
 * - SEND_CHAT_MESSAGE: Invia un messaggio di chat
 * - ABORT_REQUEST: Interrompe una richiesta in corso
 * - GET_WORKSPACE_FILE: Richiede il contenuto di un file
 * - SAVE_FILE: Salva un file
 * - EXECUTE_COMMAND: Esegue un comando
 * - RUN_CODE: Esegue del codice nel terminale
 * 
 * Messaggi da Extension a WebView (FROM_EXTENSION):
 * - SETTINGS_DATA: Invia le impostazioni
 * - MODEL_RESPONSE: Risposta del modello
 * - MODEL_ERROR: Errore del modello
 * - MODEL_THINKING: Stato "thinking" del modello
 * - MODEL_STREAM_TOKEN: Token stream dal modello
 * - FILE_CONTENT: Contenuto di un file
 * - COMMAND_RESULT: Risultato di un comando
 * - CODE_EXECUTION_RESULT: Risultato dell'esecuzione di codice
 * - ERROR: Errore generico
 * - NOTIFICATION: Notifica
 */
export enum MessageType {
  // Da WebView a Extension
  GET_SETTINGS = 'GET_SETTINGS',
  SAVE_SETTINGS = 'SAVE_SETTINGS',
  SEND_CHAT_MESSAGE = 'SEND_CHAT_MESSAGE',
  ABORT_REQUEST = 'ABORT_REQUEST',
  GET_WORKSPACE_FILE = 'GET_WORKSPACE_FILE',
  SAVE_FILE = 'SAVE_FILE',
  EXECUTE_COMMAND = 'EXECUTE_COMMAND',
  RUN_CODE = 'RUN_CODE',

  // Da Extension a WebView
  SETTINGS_DATA = 'SETTINGS_DATA',
  MODEL_RESPONSE = 'MODEL_RESPONSE',
  MODEL_ERROR = 'MODEL_ERROR',
  MODEL_THINKING = 'MODEL_THINKING',
  MODEL_STREAM_TOKEN = 'MODEL_STREAM_TOKEN',
  FILE_CONTENT = 'FILE_CONTENT',
  COMMAND_RESULT = 'COMMAND_RESULT',
  CODE_EXECUTION_RESULT = 'CODE_EXECUTION_RESULT',
  ERROR = 'ERROR',
  NOTIFICATION = 'NOTIFICATION'
}

/**
 * Messaggi che vengono inviati dalla WebView all'Extension
 */
export type ToExtensionMessageType =
  | MessageType.GET_SETTINGS
  | MessageType.SAVE_SETTINGS
  | MessageType.SEND_CHAT_MESSAGE
  | MessageType.ABORT_REQUEST
  | MessageType.GET_WORKSPACE_FILE
  | MessageType.SAVE_FILE
  | MessageType.EXECUTE_COMMAND
  | MessageType.RUN_CODE;

/**
 * Messaggi che vengono inviati dall'Extension alla WebView
 */
export type FromExtensionMessageType =
  | MessageType.SETTINGS_DATA
  | MessageType.MODEL_RESPONSE
  | MessageType.MODEL_ERROR
  | MessageType.MODEL_THINKING
  | MessageType.MODEL_STREAM_TOKEN
  | MessageType.FILE_CONTENT
  | MessageType.COMMAND_RESULT
  | MessageType.CODE_EXECUTION_RESULT
  | MessageType.ERROR
  | MessageType.NOTIFICATION;

/**
 * Verifica se un valore è un tipo di messaggio valido
 * @param value Valore da verificare
 * @returns true se il valore è un tipo di messaggio valido
 */
export function isValidMessageType(value: string): value is MessageType {
  return Object.values(MessageType).includes(value as MessageType);
}

/**
 * Verifica se un tipo di messaggio è un messaggio da WebView a Extension
 * @param type Tipo di messaggio da verificare
 * @returns true se il tipo è un messaggio da WebView a Extension
 */
export function isToExtensionMessageType(type: MessageType): type is ToExtensionMessageType {
  const toExtensionTypes: MessageType[] = [
    MessageType.GET_SETTINGS,
    MessageType.SAVE_SETTINGS,
    MessageType.SEND_CHAT_MESSAGE,
    MessageType.ABORT_REQUEST,
    MessageType.GET_WORKSPACE_FILE,
    MessageType.SAVE_FILE,
    MessageType.EXECUTE_COMMAND,
    MessageType.RUN_CODE
  ];
  
  return toExtensionTypes.includes(type);
}

/**
 * Verifica se un tipo di messaggio è un messaggio da Extension a WebView
 * @param type Tipo di messaggio da verificare
 * @returns true se il tipo è un messaggio da Extension a WebView
 */
export function isFromExtensionMessageType(type: MessageType): type is FromExtensionMessageType {
  const fromExtensionTypes: MessageType[] = [
    MessageType.SETTINGS_DATA,
    MessageType.MODEL_RESPONSE,
    MessageType.MODEL_ERROR,
    MessageType.MODEL_THINKING,
    MessageType.MODEL_STREAM_TOKEN,
    MessageType.FILE_CONTENT,
    MessageType.COMMAND_RESULT,
    MessageType.CODE_EXECUTION_RESULT,
    MessageType.ERROR,
    MessageType.NOTIFICATION
  ];
  
  return fromExtensionTypes.includes(type);
} 