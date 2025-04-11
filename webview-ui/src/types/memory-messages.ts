/**
 * @file memory-messages.ts
 * @description Tipi di messaggi per la gestione della memoria dell'agente
 * @version 1.0.0
 */

import { WebviewMessage } from "./messages";

/**
 * Enumerazione dei tipi di messaggi relativi alla memoria
 */
export enum MemoryMessageType {
  GET_MEMORY_SNAPSHOT = "GET_MEMORY_SNAPSHOT",
  MEMORY_SNAPSHOT_RESPONSE = "MEMORY_SNAPSHOT_RESPONSE",
  ADD_MEMORY_ITEM = "ADD_MEMORY_ITEM",
  DELETE_MEMORY_ITEM = "DELETE_MEMORY_ITEM",
  CLEAR_ALL_MEMORY = "CLEAR_ALL_MEMORY",
  MEMORY_OPERATION_RESULT = "MEMORY_OPERATION_RESULT"
}

/**
 * Tipo per un elemento di memoria
 */
export interface MemoryItem {
  id: string;
  content: string;
  tags: string[];
  timestamp: string;
  source?: string;
}

/**
 * Messaggio per richiedere uno snapshot della memoria
 */
export interface GetMemorySnapshotMessage extends WebviewMessage<MemoryMessageType.GET_MEMORY_SNAPSHOT> {
  type: MemoryMessageType.GET_MEMORY_SNAPSHOT;
}

/**
 * Messaggio di risposta con lo snapshot della memoria
 */
export interface MemorySnapshotResponseMessage extends WebviewMessage<MemoryMessageType.MEMORY_SNAPSHOT_RESPONSE> {
  type: MemoryMessageType.MEMORY_SNAPSHOT_RESPONSE;
  payload: {
    items: MemoryItem[];
  };
}

/**
 * Messaggio per aggiungere un elemento alla memoria
 */
export interface AddMemoryItemMessage extends WebviewMessage<MemoryMessageType.ADD_MEMORY_ITEM> {
  type: MemoryMessageType.ADD_MEMORY_ITEM;
  payload: {
    content: string;
    tags: string[];
  };
}

/**
 * Messaggio per eliminare un elemento dalla memoria
 */
export interface DeleteMemoryItemMessage extends WebviewMessage<MemoryMessageType.DELETE_MEMORY_ITEM> {
  type: MemoryMessageType.DELETE_MEMORY_ITEM;
  payload: {
    id: string;
  };
}

/**
 * Messaggio per eliminare tutti gli elementi dalla memoria
 */
export interface ClearAllMemoryMessage extends WebviewMessage<MemoryMessageType.CLEAR_ALL_MEMORY> {
  type: MemoryMessageType.CLEAR_ALL_MEMORY;
}

/**
 * Messaggio di risposta per un'operazione sulla memoria
 */
export interface MemoryOperationResultMessage extends WebviewMessage<MemoryMessageType.MEMORY_OPERATION_RESULT> {
  type: MemoryMessageType.MEMORY_OPERATION_RESULT;
  payload: {
    success: boolean;
    operation: string;
    message: string;
    item?: MemoryItem;
  };
}

/**
 * Unione dei tipi di messaggi relativi alla memoria
 */
export type MemoryMessageUnion =
  | GetMemorySnapshotMessage
  | MemorySnapshotResponseMessage
  | AddMemoryItemMessage
  | DeleteMemoryItemMessage
  | ClearAllMemoryMessage
  | MemoryOperationResultMessage; 