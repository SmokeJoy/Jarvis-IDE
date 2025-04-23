import { z } from 'zod';
import type {
  ApiMessage,
  ApiRequestMessage,
  ApiResponseMessage,
  ApiErrorMessage,
  ApiStreamStartMessage,
  ApiStreamDataMessage,
  ApiStreamEndMessage,
  HttpMethod,
} from '../types/apiMessages';

/**
 * Type guard for checking if a value is a valid HTTP method
 */
export function isHttpMethod(value: unknown): value is HttpMethod {
  if (typeof value !== 'string') return false;
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(value);
}

/**
 * Type guard for checking if a value is a valid base API message
 */
export function isApiMessage(value: unknown): value is ApiMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as any;
  return (
    typeof msg.type === 'string' &&
    typeof msg.requestId === 'string' &&
    typeof msg.timestamp === 'number'
  );
}

/**
 * Type guard for checking if a value is a valid API request message
 */
export function isApiRequestMessage(value: unknown): value is ApiRequestMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'request' &&
    typeof msg.endpoint === 'string' &&
    isHttpMethod(msg.method) &&
    (msg.headers === undefined || typeof msg.headers === 'object') &&
    (msg.body === undefined || typeof msg.body === 'object')
  );
}

/**
 * Type guard for checking if a value is a valid API response message
 */
export function isApiResponseMessage(value: unknown): value is ApiResponseMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'response' &&
    typeof msg.status === 'number' &&
    (msg.headers === undefined || typeof msg.headers === 'object') &&
    'data' in msg
  );
}

/**
 * Type guard for checking if a value is a valid API error message
 */
export function isApiErrorMessage(value: unknown): value is ApiErrorMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'error' &&
    typeof msg.error === 'string' &&
    typeof msg.code === 'number' &&
    (msg.details === undefined || typeof msg.details === 'object')
  );
}

/**
 * Type guard for checking if a value is a valid API stream start message
 */
export function isApiStreamStartMessage(
  value: unknown
): value is ApiStreamStartMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'stream_start' &&
    typeof msg.streamId === 'string' &&
    (msg.metadata === undefined || typeof msg.metadata === 'object')
  );
}

/**
 * Type guard for checking if a value is a valid API stream data message
 */
export function isApiStreamDataMessage(
  value: unknown
): value is ApiStreamDataMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'stream_data' &&
    typeof msg.streamId === 'string' &&
    msg.data !== undefined &&
    (msg.sequence === undefined || typeof msg.sequence === 'number')
  );
}

/**
 * Type guard for checking if a value is a valid API stream end message
 */
export function isApiStreamEndMessage(value: unknown): value is ApiStreamEndMessage {
  if (!isApiMessage(value)) return false;
  const msg = value as any;
  return (
    msg.type === 'stream_end' &&
    typeof msg.streamId === 'string' &&
    (msg.finalMetadata === undefined || typeof msg.finalMetadata === 'object')
  );
}

/**
 * Type guard for checking if a value is any valid API message type
 */
export function isAnyApiMessage(
  value: unknown
): value is
  | ApiRequestMessage
  | ApiResponseMessage
  | ApiErrorMessage
  | ApiStreamStartMessage
  | ApiStreamDataMessage
  | ApiStreamEndMessage {
  return (
    isApiRequestMessage(value) ||
    isApiResponseMessage(value) ||
    isApiErrorMessage(value) ||
    isApiStreamStartMessage(value) ||
    isApiStreamDataMessage(value) ||
    isApiStreamEndMessage(value)
  );
} 