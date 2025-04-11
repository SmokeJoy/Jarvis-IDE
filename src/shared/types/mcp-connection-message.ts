import { BaseMessage } from './message.js';

export enum McpConnectionMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_CONFIG = 'requestConfig',
  CONFIG_UPDATED = 'configUpdated',
  ERROR = 'error'
}

export interface McpConnectionMessage<T extends McpConnectionMessageType> extends BaseMessage<T> {
  payload: T extends McpConnectionMessageType.REQUEST_STATUS ? void :
    T extends McpConnectionMessageType.STATUS_UPDATED ? {
      status: {
        isConnected: boolean;
        lastConnection: number;
        lastDisconnection: number;
        reason?: string;
      };
      config: {
        host: string;
        port: number;
        timeout: number;
        retryCount: number;
        retryDelay: number;
      };
    } :
    T extends McpConnectionMessageType.REQUEST_CONFIG ? void :
    T extends McpConnectionMessageType.CONFIG_UPDATED ? {
      config: {
        host: string;
        port: number;
        timeout: number;
        retryCount: number;
        retryDelay: number;
      };
      lastUpdated: number;
    } :
    T extends McpConnectionMessageType.ERROR ? {
      error: string;
    } :
    never;
}

export type McpConnectionMessageUnion = {
  [K in McpConnectionMessageType]: McpConnectionMessage<K>;
}[McpConnectionMessageType];

export function createMcpConnectionMessage<T extends McpConnectionMessageType>(
  type: T,
  payload: McpConnectionMessage<T>['payload']
): McpConnectionMessage<T> {
  return { type, payload } as McpConnectionMessage<T>;
} 