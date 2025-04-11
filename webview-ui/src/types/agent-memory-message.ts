/**
 * @file agent-memory-message.ts
 * @description Definizione delle interfacce per i messaggi relativi alla memoria degli agenti
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';

/**
 * Interfaccia per la struttura di una memoria di agente
 */
export interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  tags: string[];
}

/**
 * Interfaccia per lo stato della memoria di un agente
 */
export interface AgentMemory {
  agentId: string;
  memories: MemoryItem[];
}

/**
 * Enumerazione dei tipi di messaggi per la memoria degli agenti
 */
export enum AgentMemoryMessageType {
  REQUEST_MEMORY_SNAPSHOT = 'requestMemorySnapshot',
  MEMORY_SNAPSHOT_RECEIVED = 'memorySnapshotReceived',
  CLEAR_AGENT_MEMORY = 'clearAgentMemory',
  AGENT_MEMORY_CLEARED = 'agentMemoryCleared',
  SAVE_MEMORY_ITEM = 'saveMemoryItem',
  MEMORY_ITEM_SAVED = 'memoryItemSaved',
  DELETE_MEMORY_ITEM = 'deleteMemoryItem',
  MEMORY_ITEM_DELETED = 'memoryItemDeleted'
}

/**
 * Interfaccia base per tutti i messaggi della memoria degli agenti
 */
export interface AgentMemoryMessageBase extends WebviewMessageUnion {
  type: AgentMemoryMessageType | string;
}

/**
 * Interfaccia per il messaggio di richiesta snapshot della memoria
 */
export interface RequestMemorySnapshotMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.REQUEST_MEMORY_SNAPSHOT;
  payload: {
    agentId: string;
  };
}

/**
 * Interfaccia per il messaggio di risposta con snapshot della memoria
 */
export interface MemorySnapshotReceivedMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.MEMORY_SNAPSHOT_RECEIVED;
  payload: AgentMemory;
}

/**
 * Interfaccia per il messaggio di pulizia della memoria di un agente
 */
export interface ClearAgentMemoryMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.CLEAR_AGENT_MEMORY;
  payload: {
    agentId: string;
  };
}

/**
 * Interfaccia per il messaggio di conferma pulizia memoria
 */
export interface AgentMemoryClearedMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.AGENT_MEMORY_CLEARED;
  payload: {
    agentId: string;
  };
}

/**
 * Interfaccia per il messaggio di salvataggio di un elemento di memoria
 */
export interface SaveMemoryItemMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.SAVE_MEMORY_ITEM;
  payload: {
    agentId: string;
    content: string;
    tags?: string[];
  };
}

/**
 * Interfaccia per il messaggio di conferma salvataggio elemento di memoria
 */
export interface MemoryItemSavedMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.MEMORY_ITEM_SAVED;
  payload: {
    agentId: string;
    item: MemoryItem;
  };
}

/**
 * Interfaccia per il messaggio di eliminazione di un elemento di memoria
 */
export interface DeleteMemoryItemMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.DELETE_MEMORY_ITEM;
  payload: {
    agentId: string;
    itemId: string;
  };
}

/**
 * Interfaccia per il messaggio di conferma eliminazione elemento di memoria
 */
export interface MemoryItemDeletedMessage extends AgentMemoryMessageBase {
  type: AgentMemoryMessageType.MEMORY_ITEM_DELETED;
  payload: {
    agentId: string;
    itemId: string;
  };
}

/**
 * Unione discriminata di tutti i tipi di messaggi della memoria degli agenti
 */
export type AgentMemoryMessageUnion =
  | RequestMemorySnapshotMessage
  | MemorySnapshotReceivedMessage
  | ClearAgentMemoryMessage
  | AgentMemoryClearedMessage
  | SaveMemoryItemMessage
  | MemoryItemSavedMessage
  | DeleteMemoryItemMessage
  | MemoryItemDeletedMessage; 