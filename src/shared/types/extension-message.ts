import { BaseMessage } from './message';

export enum ExtensionMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_CONFIG = 'requestConfig',
  CONFIG_UPDATED = 'configUpdated',
  ERROR = 'error',
}

export interface ExtensionMessage<T extends ExtensionMessageType> extends BaseMessage<T> {
  payload: T extends ExtensionMessageType.REQUEST_STATUS
    ? void
    : T extends ExtensionMessageType.STATUS_UPDATED
      ? {
          status: {
            isEnabled: boolean;
            currentStrategy: string;
            lastSwitch: number;
            reason?: string;
          };
          providers: Array<{
            name: string;
            priority: number;
            lastUsed: number;
            successCount: number;
            failureCount: number;
          }>;
        }
      : T extends ExtensionMessageType.REQUEST_CONFIG
        ? void
        : T extends ExtensionMessageType.CONFIG_UPDATED
          ? {
              config: {
                strategy: string;
                maxRetries: number;
                retryDelay: number;
                successThreshold: number;
                failureThreshold: number;
                blacklistDuration: number;
              };
              lastUpdated: number;
            }
          : T extends ExtensionMessageType.ERROR
            ? {
                error: string;
              }
            : never;
}

export type ExtensionMessageUnion = {
  [K in ExtensionMessageType]: ExtensionMessage<K>;
}[ExtensionMessageType];

export function createExtensionMessage<T extends ExtensionMessageType>(
  type: T,
  payload: ExtensionMessage<T>['payload']
): ExtensionMessage<T> {
  return { type, payload } as ExtensionMessage<T>;
}
