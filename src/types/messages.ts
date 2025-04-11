/**
 * @file messages.ts
 * @description Definizioni per i messaggi webview utilizzati dal frontend e dal backend
 * @version 1.0.0
 */

import { ApiConfiguration } from '../shared/types/api.types.js'
import { WebviewMessage, WebviewMessageType } from '../shared/types/webview.types.js'

export interface WebviewMessageBase {
  type: WebviewMessageType
}

// Esporto tipi core dalla definizione condivisa
export type { WebviewMessage, WebviewMessageType }