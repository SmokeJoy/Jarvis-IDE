import { z } from 'zod';
import type { LlmCancelMessage, InstructionCompletedMessage, WebviewMessageUnion } from '@shared/messages';

/**
 * Tipo base per messaggi sconosciuti ma con un campo type
 * Utilizzato per controlli preliminari prima del narrowing con type guards specifiche
 */
export type WebviewMessageUnknown = {
  type: string;
  [key: string]: any;
};

export function isLlmCancelMessage(msg: unknown): msg is LlmCancelMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'LLM_CANCEL';
}

export function isInstructionCompletedMessage(msg: unknown): msg is InstructionCompletedMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'INSTRUCTION_COMPLETED';
}

export function isWebviewMessageOfType<T extends WebviewMessageUnion['type']>(msg: unknown, type: T): msg is Extract<WebviewMessageUnion, { type: T }> {
  return typeof msg === 'object' && msg !== null && (msg as any).type === type;
}

// Variant that only checks presence of .type for unknown message objects
export function isWebviewMessageUnknown(msg: unknown): msg is WebviewMessageUnknown {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }
  
  const maybeMessage = msg as Record<string, unknown>;
  
  return 'type' in maybeMessage && typeof maybeMessage.type === 'string';
} 