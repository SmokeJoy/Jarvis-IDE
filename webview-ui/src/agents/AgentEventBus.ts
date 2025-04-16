import {
  isAgentMemoryResponseMessage,
  isAgentRetryResultMessage,
  isAgentToggleDashboardMessage
} from '../types/mas-message-guards';
import type {
  AgentMessageUnion,
  AgentMemoryResponseMessage,
  AgentRetryResultMessage,
  AgentToggleDashboardMessage
} from '../types/mas-message';
import { MasMessageType } from '../types/mas-message';

/**
 * Mappa type-safe degli handler per ogni tipo di messaggio MAS gestito dall'AgentEventBus.
 */
export type AgentHandlers = {
  [MasMessageType.AGENT_MEMORY_RESPONSE]?: (msg: AgentMemoryResponseMessage) => void;
  [MasMessageType.AGENT_RETRY_RESULT]?: (msg: AgentRetryResultMessage) => void;
  [MasMessageType.AGENT_TOGGLE_DASHBOARD]?: (msg: AgentToggleDashboardMessage) => void;
  // Estendibile per altri tipi MAS
};

/**
 * EventBus centralizzato per la gestione dei messaggi MAS lato agent.
 */
export class AgentEventBus {
  private handlers: AgentHandlers = {};
  private messageDispatcher: ((msg: AgentMessageUnion) => void) | undefined;

  /**
   * Registra uno o più handler per i messaggi MAS gestiti.
   */
  registerAgentHandlers(handlers: AgentHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Dispatch centralizzato: chiama l'handler corretto in base al tipo di messaggio.
   */
  dispatch(message: AgentMessageUnion): void {
    switch (message.type) {
      case MasMessageType.AGENT_MEMORY_RESPONSE:
        this.handlers[MasMessageType.AGENT_MEMORY_RESPONSE]?.(message as AgentMemoryResponseMessage);
        break;
      case MasMessageType.AGENT_RETRY_RESULT:
        this.handlers[MasMessageType.AGENT_RETRY_RESULT]?.(message as AgentRetryResultMessage);
        break;
      case MasMessageType.AGENT_TOGGLE_DASHBOARD:
        this.handlers[MasMessageType.AGENT_TOGGLE_DASHBOARD]?.(message as AgentToggleDashboardMessage);
        break;
      // TODO: aggiungere altri case per nuovi tipi MAS
      default:
        // Handler non registrato
        break;
    }
  }

  /**
   * Collega l'EventBus al MessageDispatcher globale (placeholder).
   * @param dispatcher Funzione di dispatch globale
   */
  setMessageDispatcher(dispatcher: (msg: AgentMessageUnion) => void): void {
    this.messageDispatcher = dispatcher;
    // TODO: integrare con il MessageDispatcher principale
  }
}

// TODO: Implementare logica specifica per MemorySnapshot, Retry, ToggleDashboard

export const agentEventBus = new AgentEventBus(); 