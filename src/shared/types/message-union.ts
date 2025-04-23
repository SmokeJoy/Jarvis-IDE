import { z } from 'zod';
// @file message-union.ts
// Contratto canonico dei messaggi tra Webview e Extension

export enum WebviewMessageType {
  SEND_PROMPT = 'send_prompt',
  INSTRUCTION = 'instruction',
  STATE = 'state',
  ERROR = 'error',
  RESPONSE = 'response',
  ACTION = 'action',
}

export enum ExtensionMessageType {
  READY = 'ready',
  SETTINGS = 'settings',
  AUTH_STATE = 'auth_state',
  EXTENSION_ERROR = 'extension_error',
}

export type Message =
  | { type: WebviewMessageType.SEND_PROMPT; payload: { text: string } }
  | { type: WebviewMessageType.INSTRUCTION; payload: { code: string } }
  | { type: WebviewMessageType.STATE; payload: unknown } // payload da affinare successivamente
  | { type: WebviewMessageType.RESPONSE; payload: { response: string } }
  | { type: WebviewMessageType.ERROR; payload: { error: string } }
  | { type: ExtensionMessageType.READY }
  | { type: ExtensionMessageType.SETTINGS; payload: unknown }
  | { type: ExtensionMessageType.EXTENSION_ERROR; payload: { reason: string } };

export function isWebviewMessage(msg: unknown): msg is Extract<Message, { type: WebviewMessageType }> {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    Object.values(WebviewMessageType).includes((msg as any).type)
  );
} 