/**
 * @file agent-memory-message-guards.ts
 * @description Type guards per i messaggi relativi alla memoria degli agenti
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import {
  AgentMemoryMessageType,
  AgentMemoryMessageUnion,
  RequestMemorySnapshotMessage,
  MemorySnapshotReceivedMessage,
  ClearAgentMemoryMessage,
  AgentMemoryClearedMessage,
  SaveMemoryItemMessage,
  MemoryItemSavedMessage,
  DeleteMemoryItemMessage,
  MemoryItemDeletedMessage,
  AgentMemory,
  MemoryItem
} from './agent-memory-message';

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio da verificare
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends AgentMemoryMessageUnion>(
  message: WebviewMessage<any>,
  type: AgentMemoryMessageType
): message is T {
  return message?.type === type;
}

/**
 * Type guard per verificare se un messaggio è un'unione di messaggi della memoria dell'agente
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un'unione di messaggi della memoria dell'agente
 */
export function isAgentMemoryMessage(message: WebviewMessage<any>): message is AgentMemoryMessageUnion {
  return Object.values(AgentMemoryMessageType).includes(message?.type as AgentMemoryMessageType);
}

/**
 * Type guard per verificare se un messaggio è una richiesta di snapshot della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di snapshot della memoria
 */
export function isRequestMemorySnapshotMessage(
  message: WebviewMessage<any>
): message is RequestMemorySnapshotMessage {
  return isMessageOfType<RequestMemorySnapshotMessage>(
    message,
    AgentMemoryMessageType.REQUEST_MEMORY_SNAPSHOT
  ) && validateRequestMemorySnapshotPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una risposta con snapshot della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una risposta con snapshot della memoria
 */
export function isMemorySnapshotReceivedMessage(
  message: WebviewMessage<any>
): message is MemorySnapshotReceivedMessage {
  return isMessageOfType<MemorySnapshotReceivedMessage>(
    message,
    AgentMemoryMessageType.MEMORY_SNAPSHOT_RECEIVED
  ) && validateMemorySnapshotReceivedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una richiesta di pulizia della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di pulizia della memoria
 */
export function isClearAgentMemoryMessage(
  message: WebviewMessage<any>
): message is ClearAgentMemoryMessage {
  return isMessageOfType<ClearAgentMemoryMessage>(
    message,
    AgentMemoryMessageType.CLEAR_AGENT_MEMORY
  ) && validateClearAgentMemoryPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una conferma di pulizia della memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di pulizia della memoria
 */
export function isAgentMemoryClearedMessage(
  message: WebviewMessage<any>
): message is AgentMemoryClearedMessage {
  return isMessageOfType<AgentMemoryClearedMessage>(
    message,
    AgentMemoryMessageType.AGENT_MEMORY_CLEARED
  ) && validateAgentMemoryClearedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una richiesta di salvataggio di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di salvataggio di un elemento di memoria
 */
export function isSaveMemoryItemMessage(
  message: WebviewMessage<any>
): message is SaveMemoryItemMessage {
  return isMessageOfType<SaveMemoryItemMessage>(
    message,
    AgentMemoryMessageType.SAVE_MEMORY_ITEM
  ) && validateSaveMemoryItemPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una conferma di salvataggio di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di salvataggio di un elemento di memoria
 */
export function isMemoryItemSavedMessage(
  message: WebviewMessage<any>
): message is MemoryItemSavedMessage {
  return isMessageOfType<MemoryItemSavedMessage>(
    message,
    AgentMemoryMessageType.MEMORY_ITEM_SAVED
  ) && validateMemoryItemSavedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una richiesta di eliminazione di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di eliminazione di un elemento di memoria
 */
export function isDeleteMemoryItemMessage(
  message: WebviewMessage<any>
): message is DeleteMemoryItemMessage {
  return isMessageOfType<DeleteMemoryItemMessage>(
    message,
    AgentMemoryMessageType.DELETE_MEMORY_ITEM
  ) && validateDeleteMemoryItemPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una conferma di eliminazione di un elemento di memoria
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una conferma di eliminazione di un elemento di memoria
 */
export function isMemoryItemDeletedMessage(
  message: WebviewMessage<any>
): message is MemoryItemDeletedMessage {
  return isMessageOfType<MemoryItemDeletedMessage>(
    message,
    AgentMemoryMessageType.MEMORY_ITEM_DELETED
  ) && validateMemoryItemDeletedPayload(message.payload);
}

// Funzioni di validazione payload

/**
 * Valida un payload di richiesta snapshot della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateRequestMemorySnapshotPayload(payload: any): boolean {
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
function validateMemoryItem(item: any): item is MemoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.content === 'string' &&
    typeof item.timestamp === 'number' &&
    Array.isArray(item.tags) &&
    item.tags.every((tag: any) => typeof tag === 'string')
  );
}

/**
 * Valida un payload di memoria dell'agente
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateAgentMemory(payload: any): payload is AgentMemory {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    Array.isArray(payload.memories) &&
    payload.memories.every((memory: any) => validateMemoryItem(memory))
  );
}

/**
 * Valida un payload di risposta con snapshot della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateMemorySnapshotReceivedPayload(payload: any): boolean {
  return validateAgentMemory(payload);
}

/**
 * Valida un payload di richiesta di pulizia della memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateClearAgentMemoryPayload(payload: any): boolean {
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
function validateAgentMemoryClearedPayload(payload: any): boolean {
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
function validateSaveMemoryItemPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.content === 'string' &&
    (!payload.tags || (
      Array.isArray(payload.tags) &&
      payload.tags.every((tag: any) => typeof tag === 'string')
    ))
  );
}

/**
 * Valida un payload di conferma di salvataggio di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateMemoryItemSavedPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    validateMemoryItem(payload.item)
  );
}

/**
 * Valida un payload di richiesta di eliminazione di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateDeleteMemoryItemPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.itemId === 'string' &&
    payload.agentId.trim() !== '' &&
    payload.itemId.trim() !== ''
  );
}

/**
 * Valida un payload di conferma di eliminazione di un elemento di memoria
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateMemoryItemDeletedPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.agentId === 'string' &&
    typeof payload.itemId === 'string' &&
    payload.agentId.trim() !== '' &&
    payload.itemId.trim() !== ''
  );
} 