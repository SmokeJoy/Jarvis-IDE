/**
 * Validatori di runtime per WebviewMessage e ExtensionMessage
 * Usa gli schemi JSON generati per validazione a runtime
 */

import Ajv from 'ajv';
import type { WebviewMessage } from './WebviewMessage';
import type { ExtensionMessage } from './ExtensionMessage';
import type { ChatMessage } from './types/index';
import type { ChatSettings, ApiConfiguration } from '../types/extension';
import { Logger } from './logger';
import type { ChatSession } from './types/session.js';
import { isChatSession } from './types/session.js';

// Usa require per importare gli schemi JSON 
// (assicurati che i path siano corretti rispetto a dove verranno generati)
let webviewSchema: any;
let extensionSchema: any;
let chatMessageSchema: any;
let chatSettingsSchema: any;
let apiConfigSchema: any;
let chatSessionSchema: any;

try {
  // In produzione, gli schemi dovrebbero essere bundled con l'estensione
  webviewSchema = require('../../docs/schemas/WebviewMessage.schema.json');
  extensionSchema = require('../../docs/schemas/ExtensionMessage.schema.json');
  chatMessageSchema = require('../../docs/schemas/ChatMessage.schema.json');
  chatSettingsSchema = require('../../docs/schemas/ChatSettings.schema.json');
  apiConfigSchema = require('../../docs/schemas/ApiConfiguration.schema.json');
  chatSessionSchema = require('../../docs/schemas/ChatSession.schema.json');
} catch (error) {
  Logger.warn('Schemi JSON non trovati. La validazione runtime sarà disabilitata.');
}

// Instanzia AJV solo se gli schemi sono disponibili
let ajv: Ajv | null = null;
let validateWebviewMessage: ((data: unknown) => boolean) | null = null;
let validateExtensionMessage: ((data: unknown) => boolean) | null = null;
let validateChatMessage: ((data: unknown) => boolean) | null = null;
let validateChatSettings: ((data: unknown) => boolean) | null = null;
let validateApiConfiguration: ((data: unknown) => boolean) | null = null;
let validateChatMessageArray: ((data: unknown) => boolean) | null = null;
let validateChatSession: ((data: unknown) => boolean) | null = null;

if (webviewSchema && extensionSchema && chatMessageSchema && chatSettingsSchema && apiConfigSchema && chatSessionSchema) {
  try {
    ajv = new Ajv({ allErrors: true, removeAdditional: 'failing' });
    validateWebviewMessage = ajv.compile(webviewSchema);
    validateExtensionMessage = ajv.compile(extensionSchema);
    validateChatMessage = ajv.compile(chatMessageSchema);
    validateChatSettings = ajv.compile(chatSettingsSchema);
    validateApiConfiguration = ajv.compile(apiConfigSchema);
    validateChatSession = ajv.compile(chatSessionSchema);
    
    // Crea uno schema custom per array di ChatMessage
    const chatMessageArraySchema = {
      type: 'array',
      items: chatMessageSchema
    };
    validateChatMessageArray = ajv.compile(chatMessageArraySchema);
  } catch (error) {
    Logger.error('Errore durante la compilazione degli schemi JSON', error);
  }
}

/**
 * Valida un messaggio WebView usando lo schema JSON
 * @param message Messaggio da validare
 * @returns true se valido, false altrimenti
 */
export function isValidWebviewMessage(message: unknown): message is WebviewMessage {
  if (!validateWebviewMessage) {
    // Fallback sui type guards quando la validazione schema non è disponibile
    return require('./typeGuards').isWebviewMessage(message);
  }
  
  return validateWebviewMessage(message);
}

/**
 * Valida un messaggio Extension usando lo schema JSON
 * @param message Messaggio da validare
 * @returns true se valido, false altrimenti
 */
export function isValidExtensionMessage(message: unknown): message is ExtensionMessage {
  if (!validateExtensionMessage) {
    // Fallback sui type guards quando la validazione schema non è disponibile
    return require('./typeGuards').isExtensionMessage(message);
  }
  
  return validateExtensionMessage(message);
}

/**
 * Ottiene la lista di errori di validazione per un messaggio WebView
 * @param message Messaggio da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getWebviewMessageErrors(message: unknown): string[] | null {
  if (!validateWebviewMessage) {
    return null;
  }
  
  validateWebviewMessage(message);
  return validateWebviewMessage.errors ? 
    validateWebviewMessage.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Ottiene la lista di errori di validazione per un messaggio Extension
 * @param message Messaggio da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getExtensionMessageErrors(message: unknown): string[] | null {
  if (!validateExtensionMessage) {
    return null;
  }
  
  validateExtensionMessage(message);
  return validateExtensionMessage.errors ? 
    validateExtensionMessage.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Valida un messaggio WebView e lancia un errore se non valido
 * @param message Messaggio da validare
 * @throws Error se il messaggio non è valido
 */
export function validateWebviewMessageOrThrow(message: unknown): asserts message is WebviewMessage {
  const errors = getWebviewMessageErrors(message);
  
  if (errors && errors.length > 0) {
    throw new Error(`Messaggio WebView non valido: ${errors.join(', ')}`);
  }
  
  // Se non ci sono errori tramite schema ma il tipo di base non è corretto,
  // usa il type guard come fallback
  if (!require('./typeGuards').isWebviewMessage(message)) {
    throw new Error('Messaggio non conforme al tipo WebviewMessage');
  }
}

/**
 * Valida un messaggio Extension e lancia un errore se non valido
 * @param message Messaggio da validare
 * @throws Error se il messaggio non è valido
 */
export function validateExtensionMessageOrThrow(message: unknown): asserts message is ExtensionMessage {
  const errors = getExtensionMessageErrors(message);
  
  if (errors && errors.length > 0) {
    throw new Error(`Messaggio Extension non valido: ${errors.join(', ')}`);
  }
  
  // Se non ci sono errori tramite schema ma il tipo di base non è corretto,
  // usa il type guard come fallback
  if (!require('./typeGuards').isExtensionMessage(message)) {
    throw new Error('Messaggio non conforme al tipo ExtensionMessage');
  }
}

/**
 * Valida un ChatMessage usando lo schema JSON
 * @param message Messaggio da validare
 * @returns true se valido, false altrimenti
 */
export function isValidChatMessage(message: unknown): message is ChatMessage {
  if (!validateChatMessage) {
    // Fallback: verifiche di base sulla struttura
    if (!message || typeof message !== 'object') return false;
    const msg = message as Record<string, unknown>;
    return typeof msg.role === 'string' && typeof msg.content === 'string';
  }
  
  return validateChatMessage(message);
}

/**
 * Valida un array di ChatMessage usando lo schema JSON
 * @param messages Array di messaggi da validare
 * @returns true se valido, false altrimenti
 */
export function isValidChatMessageArray(messages: unknown): messages is ChatMessage[] {
  if (!validateChatMessageArray) {
    // Fallback: verifica che sia un array e ogni elemento sia un valido ChatMessage
    if (!Array.isArray(messages)) return false;
    return messages.every(isValidChatMessage);
  }
  
  return validateChatMessageArray(messages);
}

/**
 * Valida un oggetto ChatSettings usando lo schema JSON
 * @param settings Impostazioni da validare
 * @returns true se valido, false altrimenti
 */
export function isValidChatSettings(settings: unknown): settings is ChatSettings {
  if (!validateChatSettings) {
    // Fallback: verifiche di base sulla struttura
    if (!settings || typeof settings !== 'object') return false;
    const s = settings as Record<string, unknown>;
    return typeof s.modelId === 'string'; // verifica campo minimo obbligatorio
  }
  
  return validateChatSettings(settings);
}

/**
 * Valida un oggetto ApiConfiguration usando lo schema JSON
 * @param config Configurazione da validare
 * @returns true se valido, false altrimenti
 */
export function isValidApiConfiguration(config: unknown): config is ApiConfiguration {
  if (!validateApiConfiguration) {
    // Fallback: verifiche di base sulla struttura
    if (!config || typeof config !== 'object') return false;
    const c = config as Record<string, unknown>;
    return typeof c.apiKey === 'string' && typeof c.baseUrl === 'string';
  }
  
  return validateApiConfiguration(config);
}

/**
 * Ottiene la lista di errori di validazione per un ChatMessage
 * @param message Messaggio da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getChatMessageErrors(message: unknown): string[] | null {
  if (!validateChatMessage) {
    return null;
  }
  
  validateChatMessage(message);
  return validateChatMessage.errors ? 
    validateChatMessage.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Ottiene la lista di errori di validazione per un array di ChatMessage
 * @param messages Array di messaggi da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getChatMessageArrayErrors(messages: unknown): string[] | null {
  if (!validateChatMessageArray) {
    return null;
  }
  
  validateChatMessageArray(messages);
  return validateChatMessageArray.errors ? 
    validateChatMessageArray.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Ottiene la lista di errori di validazione per un ChatSettings
 * @param settings Impostazioni da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getChatSettingsErrors(settings: unknown): string[] | null {
  if (!validateChatSettings) {
    return null;
  }
  
  validateChatSettings(settings);
  return validateChatSettings.errors ? 
    validateChatSettings.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Ottiene la lista di errori di validazione per un ApiConfiguration
 * @param config Configurazione da validare
 * @returns Array di errori di validazione o null se valido
 */
export function getApiConfigurationErrors(config: unknown): string[] | null {
  if (!validateApiConfiguration) {
    return null;
  }
  
  validateApiConfiguration(config);
  return validateApiConfiguration.errors ? 
    validateApiConfiguration.errors.map(e => `${e.instancePath} ${e.message}`) : 
    null;
}

/**
 * Valida un ChatMessage e lancia un errore se non valido
 * @param message Messaggio da validare
 * @throws Error se il messaggio non è valido
 */
export function validateChatMessageOrThrow(message: unknown): asserts message is ChatMessage {
  const errors = getChatMessageErrors(message);
  
  if (errors && errors.length > 0) {
    throw new Error(`ChatMessage non valido: ${errors.join(', ')}`);
  }
  
  // Fallback validazione base
  if (!isValidChatMessage(message)) {
    throw new Error('Oggetto non conforme al tipo ChatMessage');
  }
}

/**
 * Valida un array di ChatMessage e lancia un errore se non valido
 * @param messages Array di messaggi da validare
 * @throws Error se i messaggi non sono validi
 */
export function validateChatMessageArrayOrThrow(messages: unknown): asserts messages is ChatMessage[] {
  const errors = getChatMessageArrayErrors(messages);
  
  if (errors && errors.length > 0) {
    throw new Error(`Array di ChatMessage non valido: ${errors.join(', ')}`);
  }
  
  // Fallback validazione base
  if (!isValidChatMessageArray(messages)) {
    throw new Error('Oggetto non conforme al tipo ChatMessage[]');
  }
}

/**
 * Valida un ChatSettings e lancia un errore se non valido
 * @param settings Impostazioni da validare
 * @throws Error se le impostazioni non sono valide
 */
export function validateChatSettingsOrThrow(settings: unknown): asserts settings is ChatSettings {
  const errors = getChatSettingsErrors(settings);
  
  if (errors && errors.length > 0) {
    throw new Error(`ChatSettings non valido: ${errors.join(', ')}`);
  }
  
  // Fallback validazione base
  if (!isValidChatSettings(settings)) {
    throw new Error('Oggetto non conforme al tipo ChatSettings');
  }
}

/**
 * Valida un ApiConfiguration e lancia un errore se non valido
 * @param config Configurazione da validare
 * @throws Error se la configurazione non è valida
 */
export function validateApiConfigurationOrThrow(config: unknown): asserts config is ApiConfiguration {
  const errors = getApiConfigurationErrors(config);
  
  if (errors && errors.length > 0) {
    throw new Error(`ApiConfiguration non valido: ${errors.join(', ')}`);
  }
  
  // Fallback validazione base
  if (!isValidApiConfiguration(config)) {
    throw new Error('Oggetto non conforme al tipo ApiConfiguration');
  }
}

/**
 * Verifica se un oggetto è una sessione di chat valida
 */
export function isValidChatSession(obj: unknown): obj is ChatSession {
  if (!obj || typeof obj !== 'object') return false;
  
  // Usa il validatore AJV se disponibile
  if (validateChatSession) {
    return validateChatSession(obj) === true;
  }
  
  // Fallback: usa la funzione isChatSession dal modulo session.js
  return isChatSession(obj);
}

/**
 * Ottiene gli errori di validazione per una sessione di chat
 */
export function getChatSessionErrors(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object') return ['Input non è un oggetto valido'];
  
  // Usa il validatore AJV se disponibile
  if (validateChatSession) {
    validateChatSession(obj);
    if (validateChatSession.errors) {
      return validateChatSession.errors.map(err => {
        return `${err.instancePath} ${err.message}`;
      });
    }
    return [];
  }
  
  // Fallback: messaggi di errore basati su controlli manuali
  const errors: string[] = [];
  const session = obj as ChatSession;
  
  if (!session.id || typeof session.id !== 'string') {
    errors.push('id mancante o non valido');
  }
  
  if (!session.title || typeof session.title !== 'string') {
    errors.push('title mancante o non valido');
  }
  
  if (!session.createdAt || typeof session.createdAt !== 'number') {
    errors.push('createdAt mancante o non valido');
  }
  
  if (!Array.isArray(session.messages)) {
    errors.push('messages deve essere un array');
  } else {
    // Verifica messaggi individuali
    session.messages.forEach((msg, index) => {
      if (!isValidChatMessage(msg)) {
        errors.push(`messages[${index}] non è un messaggio valido`);
      }
    });
  }
  
  if (!session.settings || typeof session.settings !== 'object') {
    errors.push('settings mancante o non valido');
  } else if (!isValidChatSettings(session.settings)) {
    errors.push('settings non è una configurazione valida');
  }
  
  return errors;
}

/**
 * Valida una sessione di chat e lancia un'eccezione se non è valida
 */
export function validateChatSessionOrThrow(obj: unknown): ChatSession {
  const errors = getChatSessionErrors(obj);
  
  if (errors.length > 0) {
    throw new Error(`Sessione chat non valida: ${errors.join(', ')}`);
  }
  
  return obj as ChatSession;
}

/**
 * Verifica se un array contiene sessioni di chat valide
 */
export function isValidChatSessionArray(obj: unknown): obj is ChatSession[] {
  if (!Array.isArray(obj)) return false;
  
  return obj.every(item => isValidChatSession(item));
}

/**
 * Ottiene gli errori di validazione per un array di sessioni di chat
 */
export function getChatSessionArrayErrors(obj: unknown): string[] {
  if (!Array.isArray(obj)) return ['Input non è un array'];
  
  const errors: string[] = [];
  
  obj.forEach((item, index) => {
    const itemErrors = getChatSessionErrors(item);
    if (itemErrors.length > 0) {
      errors.push(`Elemento ${index}: ${itemErrors.join(', ')}`);
    }
  });
  
  return errors;
}

/**
 * Valida un array di sessioni di chat e lancia un'eccezione se non è valido
 */
export function validateChatSessionArrayOrThrow(obj: unknown): ChatSession[] {
  const errors = getChatSessionArrayErrors(obj);
  
  if (errors.length > 0) {
    throw new Error(`Array di sessioni chat non valido: ${errors.join('; ')}`);
  }
  
  return obj as ChatSession[];
} 