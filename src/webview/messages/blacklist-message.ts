import { WebviewMessage } from './webview-message.js';

export enum BlacklistMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_HISTORY = 'requestHistory',
  HISTORY_UPDATED = 'historyUpdated',
  ERROR = 'error'
}

export interface BlacklistMessage<T extends BlacklistMessageType> extends WebviewMessage<T> {
  payload: T extends BlacklistMessageType.REQUEST_STATUS ? void :
    T extends BlacklistMessageType.STATUS_UPDATED ? {
      blacklistedProviders: Array<{
        name: string;
        reason: string;
        timestamp: number;
        duration: number;
      }>;
      lastUpdated: number;
    } :
    T extends BlacklistMessageType.REQUEST_HISTORY ? void :
    T extends BlacklistMessageType.HISTORY_UPDATED ? {
      history: Array<{
        provider: string;
        reason: string;
        startTime: number;
        endTime: number;
        duration: number;
      }>;
      lastUpdated: number;
    } :
    T extends BlacklistMessageType.ERROR ? {
      error: string;
    } :
    never;
}

export type BlacklistMessageUnion = {
  [K in BlacklistMessageType]: BlacklistMessage<K>;
}[BlacklistMessageType];

export function createBlacklistMessage<T extends BlacklistMessageType>(
  type: T,
  payload: BlacklistMessage<T>['payload']
): BlacklistMessage<T> {
  return { type, payload } as BlacklistMessage<T>;
} 