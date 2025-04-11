import { WebviewMessage } from './webview-message.js';

export enum TelemetryMessageType {
  REQUEST_DATA = 'requestData',
  DATA_UPDATED = 'dataUpdated',
  ERROR = 'error'
}

export interface TelemetryMessage<T extends TelemetryMessageType> extends WebviewMessage<T> {
  payload: T extends TelemetryMessageType.REQUEST_DATA ? void :
    T extends TelemetryMessageType.DATA_UPDATED ? {
      metrics: {
        totalRequests: number;
        successRate: number;
        averageResponseTime: number;
        errorRate: number;
        lastUpdated: number;
      };
      providers: Array<{
        name: string;
        requests: number;
        successCount: number;
        failureCount: number;
        averageResponseTime: number;
        lastUsed: number;
      }>;
    } :
    T extends TelemetryMessageType.ERROR ? {
      error: string;
    } :
    never;
}

export type TelemetryMessageUnion = {
  [K in TelemetryMessageType]: TelemetryMessage<K>;
}[TelemetryMessageType];

export function createTelemetryMessage<T extends TelemetryMessageType>(
  type: T,
  payload: TelemetryMessage<T>['payload']
): TelemetryMessage<T> {
  return { type, payload } as TelemetryMessage<T>;
} 