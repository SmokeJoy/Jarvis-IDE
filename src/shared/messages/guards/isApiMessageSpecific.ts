import type {
  ApiMessage,
  ApiRequestMessage,
  ApiResponseMessage,
  ApiErrorMessage,
  ApiStreamStartMessage,
  ApiStreamDataMessage,
  ApiStreamEndMessage,
  ApiMessageUnion
} from '../types/apiMessages';

// Helper function to check if a message is of a specific type
function isApiMessageOfType(msg: unknown, type: string): msg is ApiMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    msg.type === type &&
    'requestId' in msg &&
    typeof msg.requestId === 'string' &&
    'timestamp' in msg &&
    typeof msg.timestamp === 'number'
  );
}

// Base type guard for all API messages
export function isApiMessage(msg: unknown): msg is ApiMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof msg.type === 'string' &&
    'requestId' in msg &&
    typeof msg.requestId === 'string' &&
    'timestamp' in msg &&
    typeof msg.timestamp === 'number'
  );
}

// Type guard for API request messages
export function isApiRequestMessage(msg: unknown): msg is ApiRequestMessage {
  return (
    isApiMessageOfType(msg, 'request') &&
    'endpoint' in msg &&
    typeof msg.endpoint === 'string' &&
    'method' in msg &&
    typeof msg.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].includes(msg.method)
  );
}

// Type guard for API response messages
export function isApiResponseMessage(msg: unknown): msg is ApiResponseMessage {
  return (
    isApiMessageOfType(msg, 'response') &&
    'data' in msg &&
    'status' in msg &&
    typeof msg.status === 'number'
  );
}

// Type guard for API error messages
export function isApiErrorMessage(msg: unknown): msg is ApiErrorMessage {
  return (
    isApiMessageOfType(msg, 'error') &&
    'error' in msg &&
    typeof msg.error === 'string' &&
    'code' in msg &&
    typeof msg.code === 'number'
  );
}

// Type guard for API stream start messages
export function isApiStreamStartMessage(msg: unknown): msg is ApiStreamStartMessage {
  return (
    isApiMessageOfType(msg, 'stream_start') &&
    'streamId' in msg &&
    typeof msg.streamId === 'string'
  );
}

// Type guard for API stream data messages
export function isApiStreamDataMessage(msg: unknown): msg is ApiStreamDataMessage {
  return (
    isApiMessageOfType(msg, 'stream_data') &&
    'streamId' in msg &&
    typeof msg.streamId === 'string' &&
    'data' in msg
  );
}

// Type guard for API stream end messages
export function isApiStreamEndMessage(msg: unknown): msg is ApiStreamEndMessage {
  return (
    isApiMessageOfType(msg, 'stream_end') &&
    'streamId' in msg &&
    typeof msg.streamId === 'string'
  );
}

// Type guard for any API message
export function isAnyApiMessage(msg: unknown): msg is ApiMessageUnion {
  return (
    isApiRequestMessage(msg) ||
    isApiResponseMessage(msg) ||
    isApiErrorMessage(msg) ||
    isApiStreamStartMessage(msg) ||
    isApiStreamDataMessage(msg) ||
    isApiStreamEndMessage(msg)
  );
} 