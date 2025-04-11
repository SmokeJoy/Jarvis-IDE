import { ModelInfo, ModelStatus } from './model.types';
import { ChatMessage } from './chat.types';
import { ExtensionSettings } from './settings.types';

/**
 * Enum che definisce tutti i tipi di messaggi supportati dall'estensione
 */
export enum ExtensionMessageType {
  // Messaggi di log
  LOG_UPDATE = 'log.update',
  
  // Messaggi informativi
  INFO = 'info',
  
  // Messaggi di errore
  ERROR = 'error',
  
  // Aggiornamenti di stato del modello
  MODEL_UPDATE = 'model.update',
  
  // Aggiornamenti impostazioni
  SETTINGS_UPDATE = 'settings.update',
  
  // Aggiornamenti chat
  CHAT_UPDATE = 'chat.update'
}

/**
 * Tipo base per tutti i messaggi dell'estensione con timestamp
 */
interface BaseMessage<T extends ExtensionMessageType, P> {
  type: T;
  payload: P;
  timestamp: number;
}

/**
 * Livelli di log supportati
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Interfaccia per i messaggi di log
 */
export interface LogMessage extends BaseMessage<ExtensionMessageType.LOG_UPDATE, {
  level: LogLevel;
  message: string;
  data?: any;
}> {}

/**
 * Livelli di severità per i messaggi informativi
 */
export type InfoSeverity = 'info' | 'warning' | 'error';

/**
 * Interfaccia per i messaggi informativi
 */
export interface InfoMessage extends BaseMessage<ExtensionMessageType.INFO, {
  message: string;
  severity: InfoSeverity;
  data?: any;
}> {}

/**
 * Interfaccia per i messaggi di errore
 */
export interface ErrorMessage extends BaseMessage<ExtensionMessageType.ERROR, {
  message: string;
  stack?: string;
  code?: string;
  data?: any;
}> {}

/**
 * Interfaccia per gli aggiornamenti di stato del modello
 */
export interface ModelUpdateMessage extends BaseMessage<ExtensionMessageType.MODEL_UPDATE, {
  modelId: string;
  model: ModelInfo;
  status: ModelStatus;
}> {}

/**
 * Interfaccia per gli aggiornamenti delle impostazioni
 */
export interface SettingsUpdateMessage extends BaseMessage<ExtensionMessageType.SETTINGS_UPDATE, ExtensionSettings> {}

/**
 * Stato di un thread di chat
 */
export type ChatThreadStatus = 'active' | 'archived' | 'deleted';

/**
 * Interfaccia per gli aggiornamenti della chat
 */
export interface ChatUpdateMessage extends BaseMessage<ExtensionMessageType.CHAT_UPDATE, {
  threadId: string;
  messages: ChatMessage[];
  status: ChatThreadStatus;
}> {}

/**
 * Union discriminata di tutti i possibili messaggi dell'estensione
 */
export type ExtensionMessage = 
  | LogMessage
  | InfoMessage
  | ErrorMessage
  | ModelUpdateMessage
  | SettingsUpdateMessage
  | ChatUpdateMessage;

/**
 * Type guard per verificare se un messaggio è valido ed è del tipo specificato
 * @param message Il messaggio da verificare
 * @param expectedType Il tipo atteso (opzionale)
 * @returns true se il messaggio è valido e del tipo atteso (se specificato)
 */
export function isExtensionMessage(
  message: any, 
  expectedType?: ExtensionMessageType | string
): message is ExtensionMessage {
  // Verifica che il messaggio abbia una struttura valida
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  // Verifica che il tipo sia presente e sia una stringa
  if (!message.type || typeof message.type !== 'string') {
    return false;
  }
  
  // Verifica che il payload sia un oggetto (può essere null solo in certi messaggi specifici)
  if (message.payload === undefined) {
    return false;
  }
  
  // Verifica che il timestamp sia presente e sia un numero
  if (typeof message.timestamp !== 'number') {
    return false;
  }
  
  // Se è stato specificato un tipo atteso, verifica che corrisponda
  if (expectedType && message.type !== expectedType) {
    return false;
  }
  
  // Controllo se il tipo è uno di quelli supportati
  const isKnownType = Object.values(ExtensionMessageType).includes(message.type as ExtensionMessageType);
  
  return isKnownType;
}

/**
 * Funzione per creare un timestamp consistente per i messaggi
 * @returns Il timestamp corrente in millisecondi
 */
export function createTimestamp(): number {
  return Date.now();
} 