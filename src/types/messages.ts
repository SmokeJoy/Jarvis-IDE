/**
 * @file messages.ts
 * @description Definizioni per i messaggi webview utilizzati dal frontend e dal backend
 * @version 1.0.0
 */

import type { ApiConfiguration } from '../shared/types/api.types.js.js'
import type { WebviewMessage, WebviewMessageType } from '../shared/types/webview.types.js.js'

export interface WebviewMessageBase {
  type: WebviewMessageType
}

// Esporto tipi core dalla definizione condivisa
export type { WebviewMessage, WebviewMessageType }