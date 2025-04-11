/**
 * @file memory-message-guards.ts
 * @description Type guards per i messaggi relativi alla memoria dell'agente
 * @version 1.0.0
 */

import { WebviewMessage } from "./messages";
import { 
  MemoryMessageType,
  GetMemorySnapshotMessage,
  MemorySnapshotResponseMessage,
  AddMemoryItemMessage,
  DeleteMemoryItemMessage,
  ClearAllMemoryMessage,
  MemoryOperationResultMessage,
  MemoryMessageUnion
} from "./memory-messages";

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico
 * @param message Il messaggio da verificare
 * @param type Il tipo atteso del messaggio
 * @returns true se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends MemoryMessageUnion>(
  message: WebviewMessage<any>,
  type: MemoryMessageType
): message is T {
  return message.type === type;
}

/**
 * Type guard per verificare se un messaggio è di tipo GetMemorySnapshotMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo GetMemorySnapshotMessage
 */
export function isGetMemorySnapshotMessage(
  message: WebviewMessage<any>
): message is GetMemorySnapshotMessage {
  return isMessageOfType<GetMemorySnapshotMessage>(
    message,
    MemoryMessageType.GET_MEMORY_SNAPSHOT
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo MemorySnapshotResponseMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo MemorySnapshotResponseMessage
 */
export function isMemorySnapshotResponseMessage(
  message: WebviewMessage<any>
): message is MemorySnapshotResponseMessage {
  return isMessageOfType<MemorySnapshotResponseMessage>(
    message,
    MemoryMessageType.MEMORY_SNAPSHOT_RESPONSE
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo AddMemoryItemMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo AddMemoryItemMessage
 */
export function isAddMemoryItemMessage(
  message: WebviewMessage<any>
): message is AddMemoryItemMessage {
  return isMessageOfType<AddMemoryItemMessage>(
    message,
    MemoryMessageType.ADD_MEMORY_ITEM
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo DeleteMemoryItemMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo DeleteMemoryItemMessage
 */
export function isDeleteMemoryItemMessage(
  message: WebviewMessage<any>
): message is DeleteMemoryItemMessage {
  return isMessageOfType<DeleteMemoryItemMessage>(
    message,
    MemoryMessageType.DELETE_MEMORY_ITEM
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo ClearAllMemoryMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo ClearAllMemoryMessage
 */
export function isClearAllMemoryMessage(
  message: WebviewMessage<any>
): message is ClearAllMemoryMessage {
  return isMessageOfType<ClearAllMemoryMessage>(
    message,
    MemoryMessageType.CLEAR_ALL_MEMORY
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo MemoryOperationResultMessage
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è di tipo MemoryOperationResultMessage
 */
export function isMemoryOperationResultMessage(
  message: WebviewMessage<any>
): message is MemoryOperationResultMessage {
  return isMessageOfType<MemoryOperationResultMessage>(
    message,
    MemoryMessageType.MEMORY_OPERATION_RESULT
  );
}

/**
 * Type guard per verificare se un messaggio è un messaggio di memoria
 * @param message Il messaggio da verificare
 * @returns true se il messaggio è un messaggio di memoria
 */
export function isMemoryMessage(
  message: WebviewMessage<any>
): message is MemoryMessageUnion {
  return (
    isGetMemorySnapshotMessage(message) ||
    isMemorySnapshotResponseMessage(message) ||
    isAddMemoryItemMessage(message) ||
    isDeleteMemoryItemMessage(message) ||
    isClearAllMemoryMessage(message) ||
    isMemoryOperationResultMessage(message)
  );
} 