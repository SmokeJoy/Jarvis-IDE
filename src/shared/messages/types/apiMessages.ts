/**
 * Base interface for all API messages
 */
export interface ApiMessage {
  type: string;
  requestId: string;
  timestamp: number;
}

/**
 * Valid HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Interface for API request messages
 */
export interface ApiRequestMessage extends ApiMessage {
  type: 'request';
  endpoint: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

/**
 * Interface for API response messages
 */
export interface ApiResponseMessage extends ApiMessage {
  type: 'response';
  status: number;
  headers?: Record<string, string>;
  data: unknown;
}

/**
 * Interface for API error messages
 */
export interface ApiErrorMessage extends ApiMessage {
  type: 'error';
  error: string;
  code: number;
  details?: Record<string, unknown>;
}

/**
 * Interface for stream start messages
 */
export interface ApiStreamStartMessage extends ApiMessage {
  type: 'stream_start';
  streamId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for stream data messages
 */
export interface ApiStreamDataMessage extends ApiMessage {
  type: 'stream_data';
  streamId: string;
  data: unknown;
  sequence?: number;
}

/**
 * Interface for stream end messages
 */
export interface ApiStreamEndMessage extends ApiMessage {
  type: 'stream_end';
  streamId: string;
  finalMetadata?: Record<string, unknown>;
}

// Union type of all API messages
export type ApiMessageUnion =
  | ApiRequestMessage
  | ApiResponseMessage
  | ApiErrorMessage
  | ApiStreamStartMessage
  | ApiStreamDataMessage
  | ApiStreamEndMessage; 