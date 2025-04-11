import { WebviewMessage } from './webview-message.js';

export enum FallbackMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_STATS = 'requestStats',
  STATS_UPDATED = 'statsUpdated',
  ERROR = 'error'
}

export interface FallbackMessage<T extends FallbackMessageType> extends WebviewMessage<T> {
  payload: T extends FallbackMessageType.REQUEST_STATUS ? void :
    T extends FallbackMessageType.STATUS_UPDATED ? {
      active: boolean;
      currentProvider: string;
      fallbackProvider: string;
      lastSwitch: number;
      reason?: string;
    } :
    T extends FallbackMessageType.REQUEST_STATS ? void :
    T extends FallbackMessageType.STATS_UPDATED ? {
      providers: Array<{
        name: string;
        requests: number;
        successCount: number;
        failureCount: number;
        averageResponseTime: number;
        lastUsed: number;
      }>;
      lastUpdated: number;
    } :
    T extends FallbackMessageType.ERROR ? {
      error: string;
    } :
    never;
}

export type FallbackMessageUnion = {
  [K in FallbackMessageType]: FallbackMessage<K>;
}[FallbackMessageType];

export function createFallbackMessage<T extends FallbackMessageType>(
  type: T,
  payload: FallbackMessage<T>['payload']
): FallbackMessage<T> {
  return { type, payload } as FallbackMessage<T>;
} 