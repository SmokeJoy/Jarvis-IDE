import { 
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketMessageUnion,
  ConnectMessage,
  DisconnectMessage,
  PingMessage,
  PongMessage,
  StatusMessage,
  ErrorMessage,
  LLMStatusMessage,
  LLMCancelMessage,
  LLMStreamMessage,
  ResetMessage,
  ReloadMessage
} from '../../types/websocket.types';

/**
 * Type guard for base WebSocket message
 */
export function isWebSocketMessage(msg: unknown): msg is WebSocketMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'timestamp' in msg &&
    typeof (msg as WebSocketMessage).timestamp === 'number' &&
    Object.values(WebSocketMessageType).includes((msg as WebSocketMessage).type)
  );
}

/**
 * Type guard for Connect message
 */
export function isConnectMessage(msg: unknown): msg is ConnectMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.CONNECT &&
    'clientId' in msg &&
    typeof msg.clientId === 'string' &&
    'version' in msg &&
    typeof msg.version === 'string'
  );
}

/**
 * Type guard for Disconnect message
 */
export function isDisconnectMessage(msg: unknown): msg is DisconnectMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.DISCONNECT &&
    (!('reason' in msg) || typeof msg.reason === 'string')
  );
}

/**
 * Type guard for Ping message
 */
export function isPingMessage(msg: unknown): msg is PingMessage {
  return isWebSocketMessage(msg) && msg.type === WebSocketMessageType.PING;
}

/**
 * Type guard for Pong message
 */
export function isPongMessage(msg: unknown): msg is PongMessage {
  return isWebSocketMessage(msg) && msg.type === WebSocketMessageType.PONG;
}

/**
 * Type guard for Status message
 */
export function isStatusMessage(msg: unknown): msg is StatusMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.STATUS &&
    'status' in msg &&
    ['connected', 'disconnected', 'error'].includes(msg.status) &&
    (!('details' in msg) || typeof msg.details === 'string')
  );
}

/**
 * Type guard for Error message
 */
export function isErrorMessage(msg: unknown): msg is ErrorMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.ERROR &&
    'error' in msg &&
    typeof msg.error === 'string' &&
    'code' in msg &&
    typeof msg.code === 'number' &&
    (!('details' in msg) || typeof msg.details === 'object')
  );
}

/**
 * Type guard for LLM Status message
 */
export function isLLMStatusMessage(msg: unknown): msg is LLMStatusMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.LLM_STATUS &&
    'modelId' in msg &&
    typeof msg.modelId === 'string' &&
    'status' in msg &&
    ['loading', 'ready', 'error'].includes(msg.status) &&
    (!('error' in msg) || typeof msg.error === 'string')
  );
}

/**
 * Type guard for LLM Cancel message
 */
export function isLLMCancelMessage(msg: unknown): msg is LLMCancelMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.LLM_CANCEL &&
    'requestId' in msg &&
    typeof msg.requestId === 'string'
  );
}

/**
 * Type guard for LLM Stream message
 */
export function isLLMStreamMessage(msg: unknown): msg is LLMStreamMessage {
  return (
    isWebSocketMessage(msg) &&
    msg.type === WebSocketMessageType.LLM_STREAM &&
    'requestId' in msg &&
    typeof msg.requestId === 'string' &&
    'chunk' in msg &&
    typeof msg.chunk === 'string' &&
    'done' in msg &&
    typeof msg.done === 'boolean'
  );
}

/**
 * Type guard for Reset message
 */
export function isResetMessage(msg: unknown): msg is ResetMessage {
  return isWebSocketMessage(msg) && msg.type === WebSocketMessageType.RESET;
}

/**
 * Type guard for Reload message
 */
export function isReloadMessage(msg: unknown): msg is ReloadMessage {
  return isWebSocketMessage(msg) && msg.type === WebSocketMessageType.RELOAD;
}

/**
 * Type guard for any WebSocket message
 */
export function isAnyWebSocketMessage(msg: unknown): msg is WebSocketMessageUnion {
  return (
    isConnectMessage(msg) ||
    isDisconnectMessage(msg) ||
    isPingMessage(msg) ||
    isPongMessage(msg) ||
    isStatusMessage(msg) ||
    isErrorMessage(msg) ||
    isLLMStatusMessage(msg) ||
    isLLMCancelMessage(msg) ||
    isLLMStreamMessage(msg) ||
    isResetMessage(msg) ||
    isReloadMessage(msg)
  );
} 