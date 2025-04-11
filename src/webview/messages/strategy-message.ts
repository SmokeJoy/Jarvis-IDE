import { WebviewMessage } from './webview-message.js';

export enum StrategyMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_CONFIG = 'requestConfig',
  CONFIG_UPDATED = 'configUpdated',
  ERROR = 'error'
}

export interface StrategyMessage<T extends StrategyMessageType> extends WebviewMessage<T> {
  payload: T extends StrategyMessageType.REQUEST_STATUS ? void :
    T extends StrategyMessageType.STATUS_UPDATED ? {
      currentStrategy: string;
      lastSwitch: number;
      reason?: string;
      providers: Array<{
        name: string;
        priority: number;
        lastUsed: number;
        successCount: number;
        failureCount: number;
      }>;
    } :
    T extends StrategyMessageType.REQUEST_CONFIG ? void :
    T extends StrategyMessageType.CONFIG_UPDATED ? {
      strategy: string;
      config: {
        maxRetries: number;
        retryDelay: number;
        successThreshold: number;
        failureThreshold: number;
        blacklistDuration: number;
      };
      lastUpdated: number;
    } :
    T extends StrategyMessageType.ERROR ? {
      error: string;
    } :
    never;
}

export type StrategyMessageUnion = {
  [K in StrategyMessageType]: StrategyMessage<K>;
}[StrategyMessageType];

export function createStrategyMessage<T extends StrategyMessageType>(
  type: T,
  payload: StrategyMessage<T>['payload']
): StrategyMessage<T> {
  return { type, payload } as StrategyMessage<T>;
} 