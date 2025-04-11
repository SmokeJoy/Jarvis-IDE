import { ExtensionMessage, ExtensionMessageType } from './messages';
import { ModelInfo } from './api.types';
import { ExtensionSettings } from './settings.types';

export interface MockedWebviewApi {
  postMessage: (message: unknown) => void;
  getState: () => Record<string, unknown>;
  setState: (state: Record<string, unknown>) => void;
}

export interface MockedContext {
  subscriptions: { dispose: () => void }[];
  workspaceState: {
    get: <T>(key: string) => T | undefined;
    update: (key: string, value: unknown) => Promise<void>;
  };
}

export interface MockedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export type MessageSeverity = 'info' | 'warning' | 'error';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ModelStatus = 'loading' | 'ready' | 'error';
export type ChatStatus = 'active' | 'inactive';

export interface MockMessageCreator {
  createMessage: <T extends ExtensionMessageType>(
    type: T,
    payload: ExtensionMessage<T>['payload']
  ) => ExtensionMessage<T>;
  
  createError: (error: Error) => ExtensionMessage<'error'>;
  createInfoMessage: (message: string, severity?: MessageSeverity) => ExtensionMessage<'info'>;
  createLogMessage: (level: LogLevel, message: string, context?: Record<string, unknown>) => ExtensionMessage<'log.update'>;
  createModelUpdate: (modelId: string, modelInfo: ModelInfo, status?: ModelStatus) => ExtensionMessage<'model.update'>;
  createSettingsUpdate: (settings: ExtensionSettings) => ExtensionMessage<'settings.update'>;
  createChatUpdate: (threadId: string, messages: MockedChatMessage[], status?: ChatStatus) => ExtensionMessage<'chat.update'>;
} 