import { z } from 'zod';
import { WebviewMessage, ExtensionMessage } from '@shared/messages';

/**
 * Type guard per validare un messaggio webview generico
 */
export function isWebviewMessage(msg: unknown): msg is WebviewMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as any).type === 'string'
  );
}

/**
 * Type guard per validare un messaggio di errore
 */
export function isErrorMessage(msg: WebviewMessage): msg is ExtensionMessage & { type: 'error' } {
  return (
    msg.type === 'error' &&
    typeof (msg.payload as unknown) === 'object' &&
    (msg.payload as unknown) !== null &&
    'message' in (msg.payload as unknown) &&
    typeof (msg.payload as unknown).message === 'string'
  );
}

/**
 * Type guard per validare un messaggio di navigazione
 */
export function isNavigationMessage(msg: WebviewMessage): msg is ExtensionMessage & { type: 'navigate' } {
  return (
    msg.type === 'navigate' &&
    typeof (msg.payload as unknown) === 'object' &&
    (msg.payload as unknown) !== null &&
    'route' in (msg.payload as unknown) &&
    typeof (msg.payload as unknown).route === 'string'
  );
}
