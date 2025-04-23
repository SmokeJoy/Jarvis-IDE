import { ApiMessageUnion } from './api-messages';

export enum WebviewMessageType {
  API_MESSAGE = 'api_message',
  STATE_UPDATE = 'state_update',
  ERROR = 'error',
  LOG = 'log'
}

export interface ApiWebviewMessage {
  type: WebviewMessageType.API_MESSAGE;
  payload: ApiMessageUnion;
}

export interface StateUpdateMessage {
  type: WebviewMessageType.STATE_UPDATE;
  payload: {
    key: string;
    value: unknown;
  };
}

export interface ErrorMessage {
  type: WebviewMessageType.ERROR;
  payload: {
    message: string;
    stack?: string;
  };
}

export interface LogMessage {
  type: WebviewMessageType.LOG;
  payload: {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: unknown;
  };
}

export type WebviewMessage =
  | ApiWebviewMessage
  | StateUpdateMessage
  | ErrorMessage
  | LogMessage;

export function isWebviewMessage(message: unknown): message is WebviewMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const { type, payload } = message as { type: string; payload: unknown };

  if (typeof type !== 'string' || !Object.values(WebviewMessageType).includes(type as WebviewMessageType)) {
    return false;
  }

  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  switch (type) {
    case WebviewMessageType.API_MESSAGE:
      return 'type' in payload;
    
    case WebviewMessageType.STATE_UPDATE:
      return 'key' in payload && 'value' in payload;
    
    case WebviewMessageType.ERROR:
      return 'message' in payload;
    
    case WebviewMessageType.LOG:
      return 'level' in payload && 'message' in payload;
    
    default:
      return false;
  }
}

export function isApiWebviewMessage(message: unknown): message is ApiWebviewMessage {
  return isWebviewMessage(message) && message.type === WebviewMessageType.API_MESSAGE;
}

export function isStateUpdateMessage(message: unknown): message is StateUpdateMessage {
  return isWebviewMessage(message) && message.type === WebviewMessageType.STATE_UPDATE;
}

export function isErrorMessage(message: unknown): message is ErrorMessage {
  return isWebviewMessage(message) && message.type === WebviewMessageType.ERROR;
}

export function isLogMessage(message: unknown): message is LogMessage {
  return isWebviewMessage(message) && message.type === WebviewMessageType.LOG;
} 