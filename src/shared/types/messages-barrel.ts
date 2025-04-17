// BARREL DEI TIPI MESSAGGI MAS/LLM/WS UNIFICATI
// Questo file accorpa e re-esporta tutte le definizioni di messaggio comuni, eliminando duplicazioni nel flusso WebSocket/MAS/LLM

export type {
  WebviewMessageUnion,
  UnifiedWebviewMessageUnion,
  LlmCancelMessage,
  LlmRequestMessage,
  LlmResponseMessage,
  LlmStatusMessage,
  WebSocketErrorMessage,
  ConnectMessage,
  DisconnectMessage,
  PingMessage,
  PongMessage,
  InstructionMessage,
  InstructionCompletedMessage,
  InstructionFailedMessage,
  AgentTypingMessage,
  AgentTypingDoneMessage,
  AgentTaskCreatedMessage,
  AgentTaskDoneMessage,
  BaseWebviewMessage
} from './webviewMessageUnion';
// tutti i nuovi messaggi centralizzati devono essere aggiunti qui per garantire la discriminated union unica e coerenza tra barrel, guard e signature

export type { ApiConfiguration, ModelInfo } from './api.types';


export * from "./webview-message-guards";
export { isWebviewMessage } from "./webviewMessageUnion";