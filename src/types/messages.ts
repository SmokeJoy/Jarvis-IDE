/**
 * @file messages.ts
 * @description Definizioni per i messaggi webview utilizzati dal frontend e dal backend
 * @version 1.0.0
 */

import type {
  ApiConfiguration,
  ChatLlmConfig,
  ExtensionSettings,
  ModelInfo,
  ModelProvider,
  TextGenSettings,
} from '../shared/types/api.types';
import type {
  ChatMessage,
  ChatRole,
  ContentBlock,
  ContentType,
} from '../shared/types/chat.types';
import type { ErrorMessage } from '../shared/types/error.types';
import { WebviewMessage, WebviewMessageType } from '../shared/types/webview.types';

export interface WebviewMessageBase {
  type: WebviewMessageType;
}

// Esporto tipi core dalla definizione condivisa
export type { WebviewMessage, WebviewMessageType };
