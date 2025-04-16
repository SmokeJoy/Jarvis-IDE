import type { AgentMessageUnion } from '@/types/mas-message';
import { MasMessageType } from '@/types/mas-message';
import {
  isAgentMemoryResponseMessage,
  isInstructionCompletedMessage,
  isInstructionFailedMessage,
  isTaskQueueUpdateMessage,
  // aggiungi altri type guard man mano
} from '@/types/mas-message-guards';

// Mappa type-safe degli handler MAS
const handlers: Partial<{
  [K in AgentMessageUnion['type']]: (msg: Extract<AgentMessageUnion, { type: K }>) => void;
}> = {};

/**
 * Registra un handler per uno specifico tipo di messaggio MAS
 */
function on<T extends AgentMessageUnion['type']>(
  type: T,
  handler: (msg: Extract<AgentMessageUnion, { type: T }>) => void
): void {
  handlers[type] = handler;
}

/**
 * Resetta tutti gli handler registrati (per test)
 */
function reset(): void {
  Object.keys(handlers).forEach((k) => {
    delete handlers[k as AgentMessageUnion['type']];
  });
}

/**
 * Dispatch centralizzato: chiama l'handler corretto in base al tipo di messaggio.
 * Logga info se dispatch valido, warn se il tipo non è gestito.
 */
function dispatch(message: AgentMessageUnion | unknown): void {
  if (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    typeof (message as any).type === 'string' &&
    handlers[(message as any).type as AgentMessageUnion['type']]
  ) {
    // @ts-expect-error: type narrowed by runtime check
    handlers[(message as any).type](message);
    // Log info su dispatch valido
    // eslint-disable-next-line no-console
    console.info('[AgentEventBus] Dispatching', (message as any).type, message);
  } else if (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    typeof (message as any).type === 'string'
  ) {
    // Tipo noto ma handler mancante
    // eslint-disable-next-line no-console
    console.warn('[AgentEventBus] Nessun handler registrato per type:', (message as any).type);
  } else {
    // Messaggio non valido
    // eslint-disable-next-line no-console
    console.warn('[AgentEventBus] Invalid message:', message);
  }
}

export const AgentEventBus = {
  on,
  dispatch,
  reset,
};

export class AgentEventBus {
  /**
   * Dispatch centralizzato per i messaggi MAS lato agent.
   * Chiama l'handler corretto o logga warning se non gestito.
   */
  static dispatch(message: unknown): void {
    if (isAgentMemoryResponseMessage(message)) {
      // TODO: integrare context React per aggiornare stato memory
      console.log('[MAS] MemoryResponse:', message);
      return;
    }

    if (isInstructionCompletedMessage(message)) {
      console.log('[MAS] Instruction COMPLETED:', message.payload.taskId);
      return;
    }

    if (isInstructionFailedMessage(message)) {
      console.warn('[MAS] Instruction FAILED:', message.payload.error);
      return;
    }

    if (isTaskQueueUpdateMessage(message)) {
      // Es: aggiorna badge o tabellone task
      console.log('[MAS] TaskQueueUpdate:', message);
      return;
    }

    console.warn('[MAS] Messaggio non gestito dal MAS EventBus:', message);
  }
} 