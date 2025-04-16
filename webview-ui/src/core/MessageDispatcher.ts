// MessageDispatcher.ts
import { SuggestionsMessageType, SuggestionsUpdatedMessage } from '../types/suggestions-message';
import { AgentMemoryMessageType, MemoryItemSavedMessage } from '../types/agent-memory-message';

// Handler signatures
export type MessageHandler<T> = (message: T) => void;

// Dispatcher map: aggiungi qui i tipi supportati
interface DispatcherMap {
  [SuggestionsMessageType.SUGGESTIONS_UPDATED]: SuggestionsUpdatedMessage;
  [AgentMemoryMessageType.MEMORY_ITEM_SAVED]: MemoryItemSavedMessage;
  // ...estendibile
}

// Handler registry
const handlers: Partial<Record<keyof DispatcherMap, MessageHandler<any>>> = {
  [SuggestionsMessageType.SUGGESTIONS_UPDATED]: (msg) => {
    // TODO: implement real handler
    console.info('Handled suggestionsUpdated', msg);
  },
  [AgentMemoryMessageType.MEMORY_ITEM_SAVED]: (msg) => {
    // TODO: implement real handler
    console.info('Handled memoryItemSaved', msg);
  },
};

// Main dispatcher function
export function handleWebviewMessage(message: unknown): void {
  if (typeof message !== 'object' || message === null || !('type' in message) || typeof (message as any).type !== 'string') {
    console.warn('[MessageDispatcher] Messaggio non valido o senza type:', message);
    return;
  }
  const type = (message as any).type as keyof DispatcherMap;
  const handler = handlers[type];
  if (handler) {
    handler(message);
  } else {
    console.warn(`[MessageDispatcher] Nessun handler per type: ${type}`);
  }
} 