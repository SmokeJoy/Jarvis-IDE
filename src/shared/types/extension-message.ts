import type { WebviewMessage } from './webview.types';

export enum ExtensionMessageType {
  REQUEST_STATUS = 'requestStatus',
  STATUS_UPDATED = 'statusUpdated',
  REQUEST_CONFIG = 'requestConfig',
  CONFIG_UPDATED = 'configUpdated',
  ERROR = 'error',
}

export interface RequestStatusMessage extends WebviewMessage<ExtensionMessageType.REQUEST_STATUS, {}> {
  type: ExtensionMessageType.REQUEST_STATUS;
  payload: {};
}

export interface StatusUpdatedMessage extends WebviewMessage<ExtensionMessageType.STATUS_UPDATED, {
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
}> {
  type: ExtensionMessageType.STATUS_UPDATED;
  payload: {
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
  };
}

export interface RequestConfigMessage extends WebviewMessage<ExtensionMessageType.REQUEST_CONFIG, {}> {
  type: ExtensionMessageType.REQUEST_CONFIG;
  payload: {};
}

export interface ConfigUpdatedMessage extends WebviewMessage<ExtensionMessageType.CONFIG_UPDATED, {
  config: {
    strategy: string;
    maxRetries: number;
    retryDelay: number;
    successThreshold: number;
    failureThreshold: number;
    blacklistDuration: number;
  };
  lastUpdated: number;
}> {
  type: ExtensionMessageType.CONFIG_UPDATED;
  payload: {
    config: {
      strategy: string;
      maxRetries: number;
      retryDelay: number;
      successThreshold: number;
      failureThreshold: number;
      blacklistDuration: number;
    };
    lastUpdated: number;
  };
}

export interface ExtensionErrorMessage extends WebviewMessage<ExtensionMessageType.ERROR, { error: string }> {
  type: ExtensionMessageType.ERROR;
  payload: { error: string };
}

export type ExtensionMessageUnion =
  | RequestStatusMessage
  | StatusUpdatedMessage
  | RequestConfigMessage
  | ConfigUpdatedMessage
  | ExtensionErrorMessage;
