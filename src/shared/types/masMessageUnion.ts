import { z } from 'zod';
/**
 * @file masMessageUnion.ts
 * @description Definizione centralizzata delle unioni discriminate per i messaggi MAS unificati
 * @version 2.0.0
 */

import { BaseMessage } from './message-utils';

/**
 * Messaggio che indica che un agente sta scrivendo
 */
export type AgentTypingMessage = BaseMessage<
  'mas.agent/typing',
  { 
    agentId: string;
    threadId?: string;
  }
>;

/**
 * Messaggio che indica che un agente ha terminato di scrivere
 */
export type AgentTypingDoneMessage = BaseMessage<
  'mas.agent/typingDone',
  { 
    agentId: string;
    threadId?: string;
  }
>;

/**
 * Messaggio che indica che è stato richiesto l'annullamento di una richiesta LLM
 */
export type LlmCancelMessage = BaseMessage<
  'mas.llm/cancel',
  { 
    requestId: string;
  }
>;

/**
 * Messaggio che contiene lo stato aggiornato di un agente
 */
export type AgentStatusUpdateMessage = BaseMessage<
  'mas.agent/statusUpdate',
  { 
    agentId: string;
    status: 'idle' | 'busy' | 'error';
    taskId?: string;
    timestamp?: number;
  }
>;

/**
 * Unione discriminata di tutti i messaggi MAS unificati
 */
export type MasMessageUnion =
  | AgentTypingMessage
  | AgentTypingDoneMessage
  | LlmCancelMessage
  | AgentStatusUpdateMessage;

/**
 * Type guard per verificare se un messaggio è un messaggio MAS unificato
 */
export function isMasMessage(msg: unknown): msg is MasMessageUnion {
  if (typeof msg !== 'object' || msg === null || !('type' in msg)) {
    return false;
  }
  
  const type = (msg as { type: string }).type;
  
  return (
    type === 'mas.agent/typing' ||
    type === 'mas.agent/typingDone' ||
    type === 'mas.llm/cancel' ||
    type === 'mas.agent/statusUpdate'
  );
}

/**
 * Type guards specifiche per ogni tipo di messaggio MAS
 */
export function isAgentTypingMessage(msg: unknown): msg is AgentTypingMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'mas.agent/typing';
}

export function isAgentTypingDoneMessage(msg: unknown): msg is AgentTypingDoneMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'mas.agent/typingDone';
}

export function isMasLlmCancelMessage(msg: unknown): msg is LlmCancelMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'mas.llm/cancel';
}

export function isAgentStatusUpdateMessage(msg: unknown): msg is AgentStatusUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'mas.agent/statusUpdate';
} 