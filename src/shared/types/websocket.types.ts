/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  // Connection messages
  CONNECT = 'ws.connect',
  DISCONNECT = 'ws.disconnect',
  PING = 'ws.ping',
  PONG = 'ws.pong',
  
  // Status messages
  STATUS = 'ws.status',
  ERROR = 'ws.error',
  
  // LLM messages
  LLM_STATUS = 'ws.llm/status',
  LLM_CANCEL = 'ws.llm/cancel',
  LLM_STREAM = 'ws.llm/stream',
  
  // Control messages
  RESET = 'ws.reset',
  RELOAD = 'ws.reload'
}

/**
 * Base WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: number;
}

/**
 * Connection message interfaces
 */
export interface ConnectMessage extends WebSocketMessage {
  type: WebSocketMessageType.CONNECT;
  clientId: string;
  version: string;
}

export interface DisconnectMessage extends WebSocketMessage {
  type: WebSocketMessageType.DISCONNECT;
  reason?: string;
}

export interface PingMessage extends WebSocketMessage {
  type: WebSocketMessageType.PING;
}

export interface PongMessage extends WebSocketMessage {
  type: WebSocketMessageType.PONG;
}

/**
 * Status message interfaces
 */
export interface StatusMessage extends WebSocketMessage {
  type: WebSocketMessageType.STATUS;
  status: 'connected' | 'disconnected' | 'error';
  details?: string;
}

export interface ErrorMessage extends WebSocketMessage {
  type: WebSocketMessageType.ERROR;
  error: string;
  code: number;
  details?: Record<string, unknown>;
}

/**
 * LLM message interfaces
 */
export interface LLMStatusMessage extends WebSocketMessage {
  type: WebSocketMessageType.LLM_STATUS;
  modelId: string;
  status: 'loading' | 'ready' | 'error';
  error?: string;
}

export interface LLMCancelMessage extends WebSocketMessage {
  type: WebSocketMessageType.LLM_CANCEL;
  requestId: string;
}

export interface LLMStreamMessage extends WebSocketMessage {
  type: WebSocketMessageType.LLM_STREAM;
  requestId: string;
  chunk: string;
  done: boolean;
}

/**
 * Control message interfaces
 */
export interface ResetMessage extends WebSocketMessage {
  type: WebSocketMessageType.RESET;
}

export interface ReloadMessage extends WebSocketMessage {
  type: WebSocketMessageType.RELOAD;
}

/**
 * Union type of all WebSocket messages
 */
export type WebSocketMessageUnion =
  | ConnectMessage
  | DisconnectMessage
  | PingMessage
  | PongMessage
  | StatusMessage
  | ErrorMessage
  | LLMStatusMessage
  | LLMCancelMessage
  | LLMStreamMessage
  | ResetMessage
  | ReloadMessage; 