import { BaseMessage } from './message';

export enum ProviderMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_CONFIG = 'requestConfig',
  CONFIG_UPDATED = 'configUpdated',
  ERROR = 'error',
}

export interface ProviderMessage<T extends ProviderMessageType> extends BaseMessage<T> {
  payload: T extends ProviderMessageType.REQUEST_STATUS
    ? void
    : T extends ProviderMessageType.STATUS_UPDATED
      ? {
          providers: Array<{
            name: string;
            isEnabled: boolean;
            priority: number;
            lastUsed: number;
            successCount: number;
            failureCount: number;
            averageResponseTime: number;
          }>;
          lastUpdated: number;
        }
      : T extends ProviderMessageType.REQUEST_CONFIG
        ? void
        : T extends ProviderMessageType.CONFIG_UPDATED
          ? {
              config: {
                defaultProvider: string;
                fallbackProvider: string;
                maxRetries: number;
                retryDelay: number;
                successThreshold: number;
                failureThreshold: number;
              };
              lastUpdated: number;
            }
          : T extends ProviderMessageType.ERROR
            ? {
                error: string;
              }
            : never;
}

export type ProviderMessageUnion = {
  [K in ProviderMessageType]: ProviderMessage<K>;
}[ProviderMessageType];

export function createProviderMessage<T extends ProviderMessageType>(
  type: T,
  payload: ProviderMessage<T>['payload']
): ProviderMessage<T> {
  return { type, payload } as ProviderMessage<T>;
}
