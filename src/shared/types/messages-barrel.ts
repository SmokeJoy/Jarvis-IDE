// BARREL DEI TIPI MESSAGGI UNIFICATI – Jarvis IDE
// Espone tutti i tipi/guard legati ai messaggi in un unico entry‑point.

// ---- Webview & Extension core ----
export type { WebviewMessageType, ExtensionMessageType, Message } from './message-union';
export { isWebviewMessage } from './message-union';

// ---- WebSocket specific ----
export {
  WebSocketMessageType,
  type WebSocketMessageUnion,
  type PingMessage,
  type PongMessage,
  type WebSocketErrorMessage,
  type DisconnectMessage,
  type LlmStatusMessage,
  type LlmCancelMessage,
  isWebSocketMessage,
} from './websocketMessageUnion';

// ---- Legacy unions (da mantenere finché non completato il refactor) ----
export * from './webviewMessageUnion';
export * from './extensionMessageUnion';

// ---- Helpers / validators ----
export { isValidExtensionMessage } from '../validators';

export type { ApiConfiguration, ModelInfo } from './api.types';

export * from "./webview-message-guards";