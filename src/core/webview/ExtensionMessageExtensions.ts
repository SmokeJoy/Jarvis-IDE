/**
 * @file ExtensionMessageExtensions.ts
 * @description Estensioni per l'interfaccia ExtensionMessage per supportare i messaggi MAS
 */

import { ExtensionMessage } from '../../shared/ExtensionMessage';
import { AgentStatus } from '../../shared/types/mas.types';
import { TaskQueueState } from '../../shared/types/mas.types';

declare module '../../shared/ExtensionMessage' {
  interface ExtensionMessage {
    type: string;
  }
}

/**
 * Messaggio per la ricezione di un'istruzione
 */
export interface InstructionReceivedMessage extends ExtensionMessage {
  type: 'instructionReceived';
  payload: {
    id: string;
    agentId: string;
    instruction: string;
  };
}

/**
 * Messaggio per il fallimento di un'istruzione
 */
export interface InstructionFailedMessage extends ExtensionMessage {
  type: 'instructionFailed';
  payload: {
    id: string;
    agentId: string;
    instruction: string;
    error: string;
  };
}

/**
 * Messaggio per il completamento di un'istruzione
 */
export interface InstructionCompletedMessage extends ExtensionMessage {
  type: 'instructionCompleted';
  payload: {
    id: string;
    agentId: string;
    instruction: string;
    result: any;
  };
}

/**
 * Messaggio per l'aggiornamento dello stato degli agenti
 */
export interface AgentsStatusUpdateMessage extends ExtensionMessage {
  type: 'agentsStatusUpdate';
  payload: AgentStatus[];
}

/**
 * Messaggio per l'aggiornamento della coda di task
 */
export interface TaskQueueUpdateMessage extends ExtensionMessage {
  type: 'taskQueueUpdate';
  payload: TaskQueueState;
}

/**
 * Tipo unione per tutti i messaggi dell'estensione MAS
 */
export type MasExtensionMessage =
  | InstructionReceivedMessage
  | InstructionFailedMessage
  | InstructionCompletedMessage
  | AgentsStatusUpdateMessage
  | TaskQueueUpdateMessage;
