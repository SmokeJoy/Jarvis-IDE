/**
 * @file agent-memory-message-guards.ts
 * @description Type guards per i messaggi relativi alla memoria degli agenti
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import type {
  AgentMemoryMessageUnion,
  RequestMemorySnapshotMessage,
  MemorySnapshotReceivedMessage,
  ClearAgentMemoryMessage,
  AgentMemoryClearedMessage,
  SaveMemoryItemMessage,
  MemoryItemSavedMessage,
  DeleteMemoryItemMessage,
  MemoryItemDeletedMessage,
  AgentMemoryMessageType,
  MemoryItem,
  AgentMemory
} from './agent-memory-message';
import { AgentMemoryMessageType as AgentMemoryMessageTypeImport } from './agent-memory-message';

/**
 * Type for unknown message payload
 */
type UnknownPayload = Record<string, unknown>;

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio da verificare
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends AgentMemoryMessageUnion>(
  message: unknown,
  type: AgentMemoryMessageType
): message is T {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as any).type === type
  );
}

/**
 * Type guard per verificare se un messaggio è un'unione di messaggi della memoria dell'agente
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un'unione di messaggi della memoria dell'agente
 */
export function isAgentMemoryMessage(message: unknown): message is AgentMemoryMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    Object.values(AgentMemoryMessageTypeImport).includes((message as any).type)
  );
}

/**
 * Type guard per verificare se un messaggio è una richiesta di snapshot della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di snapshot della memoria
 */
export function isRequestMemorySnapshotMessage(message: unknown): message is RequestMemorySnapshotMessage {
  return isMessageOfType<RequestMemorySnapshotMessage>(message, AgentMemoryMessageTypeImport.REQUEST_MEMORY_SNAPSHOT) &&
    validateRequestMemorySnapshotPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una risposta con snapshot della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una risposta con snapshot della memoria
 */
export function isMemorySnapshotReceivedMessage(message: unknown): message is MemorySnapshotReceivedMessage {
  return isMessageOfType<MemorySnapshotReceivedMessage>(message, AgentMemoryMessageTypeImport.MEMORY_SNAPSHOT_RECEIVED) &&
    validateMemorySnapshotReceivedPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una richiesta di pulizia della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di pulizia della memoria
 */
export function isClearAgentMemoryMessage(message: unknown): message is ClearAgentMemoryMessage {
  return isMessageOfType<ClearAgentMemoryMessage>(message, AgentMemoryMessageTypeImport.CLEAR_AGENT_MEMORY) &&
    validateClearAgentMemoryPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una conferma di pulizia della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di pulizia della memoria
 */
export function isAgentMemoryClearedMessage(message: unknown): message is AgentMemoryClearedMessage {
  return isMessageOfType<AgentMemoryClearedMessage>(message, AgentMemoryMessageTypeImport.AGENT_MEMORY_CLEARED) &&
    validateAgentMemoryClearedPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una richiesta di salvataggio di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di salvataggio di un elemento di memoria
 */
export function isSaveMemoryItemMessage(message: unknown): message is SaveMemoryItemMessage {
  return isMessageOfType<SaveMemoryItemMessage>(message, AgentMemoryMessageTypeImport.SAVE_MEMORY_ITEM) &&
    validateSaveMemoryItemPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una conferma di salvataggio di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di salvataggio di un elemento di memoria
 */
export function isMemoryItemSavedMessage(
  message: unknown
): message is MemoryItemSavedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === 'memoryItemSaved'
  );
}

/**
 * Type guard per verificare se un messaggio è una richiesta di eliminazione di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di eliminazione di un elemento di memoria
 */
export function isDeleteMemoryItemMessage(message: unknown): message is DeleteMemoryItemMessage {
  return isMessageOfType<DeleteMemoryItemMessage>(message, AgentMemoryMessageTypeImport.DELETE_MEMORY_ITEM) &&
    validateDeleteMemoryItemPayload((msg.payload as unknown));
}

/**
 * Type guard per verificare se un messaggio è una conferma di eliminazione di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di eliminazione di un elemento di memoria
 */
export function isMemoryItemDeletedMessage(message: unknown): message is MemoryItemDeletedMessage {
  return isMessageOfType<MemoryItemDeletedMessage>(message, AgentMemoryMessageTypeImport.MEMORY_ITEM_DELETED) &&
    validateMemoryItemDeletedPayload((msg.payload as unknown));
}

// Funzioni di validazione payload

/**
 * Valida un payload di richiesta snapshot della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateRequestMemorySnapshotPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    payload.agentId.trim() !== ''
  );
}

/**
 * Valida un item di memoria
 * @param item L'item da validare
 * @returns True se l'item è valido
 */
function validateMemoryItem(item: UnknownPayload): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.content === 'string' &&
    typeof item.timestamp === 'number' &&
    Array.isArray(item.tags) &&
    item.tags.every((tag: unknown) => typeof tag === 'string')
  );
}

/**
 * Valida un payload di memoria dell'agente
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateAgentMemory(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    Array.isArray(payload.memories) &&
    payload.memories.every(validateMemoryItem)
  );
}

/**
 * Valida un payload di risposta con snapshot della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateMemorySnapshotReceivedPayload(payload: UnknownPayload): boolean {
  return validateAgentMemory(payload);
}

/**
 * Valida un payload di richiesta di pulizia della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateClearAgentMemoryPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    payload.agentId.trim() !== ''
  );
}

/**
 * Valida un payload di conferma di pulizia della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateAgentMemoryClearedPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    payload.agentId.trim() !== ''
  );
}

/**
 * Valida un payload di richiesta di salvataggio di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSaveMemoryItemPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.content === 'string' &&
    Array.isArray(payload.tags) &&
    payload.tags.every((tag: unknown) => typeof tag === 'string')
  );
}

/**
 * Valida un payload di conferma di eliminazione di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateMemoryItemDeletedPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.memoryId === 'string'
  );
}

/**
 * Valida un payload di richiesta di eliminazione di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateDeleteMemoryItemPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.memoryId === 'string'
  );
} 