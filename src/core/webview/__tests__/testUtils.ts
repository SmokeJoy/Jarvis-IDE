import { ExtensionMessage, ExtensionMessageType } from '@/shared/types/messages';
import { ModelInfo } from '@/shared/types/api.types';
import { ExtensionSettings } from '@/shared/types/settings.types';
import {
  MockedChatMessage,
  MessageSeverity,
  LogLevel,
  ModelStatus,
  ChatStatus,
  MockMessageCreator
} from '@/shared/types/test-utils.types';

export const mockModelInfo: ModelInfo = {
  id: 'test-model',
  name: 'Test Model',
  provider: 'test-provider',
  contextLength: 4096,
  maxTokens: 2048,
  supportsImages: false,
  inputPrice: 0.0001,
  outputPrice: 0.0002,
  description: 'A test model for testing purposes'
};

export const mockExtensionSettings: ExtensionSettings = {
  theme: 'dark',
  fontSize: 14,
  enableNotifications: true,
  language: 'en',
  defaultModel: 'test-model',
  apiKeys: {
    'test-provider': 'test-api-key'
  }
};

export const mockChatMessages: MockedChatMessage[] = [
  {
    id: 'msg1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: Date.now(),
    metadata: {}
  },
  {
    id: 'msg2',
    role: 'assistant',
    content: 'I am fine, thank you!',
    timestamp: Date.now() + 1000,
    metadata: {}
  }
];

export const mockMessageCreator: MockMessageCreator = {
  createMessage: <T extends ExtensionMessageType>(
    type: T,
    payload: ExtensionMessage<T>['payload']
  ): ExtensionMessage<T> => ({
    type,
    timestamp: Date.now(),
    payload
  }),

  createError: (error: Error): ExtensionMessage<'error'> => ({
    type: 'error',
    timestamp: Date.now(),
    payload: {
      code: 'TEST_ERROR',
      message: error.message,
      details: {
        stack: error.stack
      }
    }
  }),

  createInfoMessage: (message: string, severity: MessageSeverity = 'info'): ExtensionMessage<'info'> => ({
    type: 'info',
    timestamp: Date.now(),
    payload: {
      message,
      severity
    }
  }),

  createLogMessage: (level: LogLevel, message: string, context: Record<string, unknown> = {}): ExtensionMessage<'log.update'> => ({
    type: 'log.update',
    timestamp: Date.now(),
    payload: {
      level,
      message,
      context
    }
  }),

  createModelUpdate: (modelId: string, modelInfo: ModelInfo, status: ModelStatus = 'ready'): ExtensionMessage<'model.update'> => ({
    type: 'model.update',
    timestamp: Date.now(),
    payload: {
      modelId,
      modelInfo,
      status
    }
  }),

  createSettingsUpdate: (settings: ExtensionSettings): ExtensionMessage<'settings.update'> => ({
    type: 'settings.update',
    timestamp: Date.now(),
    payload: {
      settings
    }
  }),

  createChatUpdate: (threadId: string, messages: MockedChatMessage[], status: ChatStatus = 'active'): ExtensionMessage<'chat.update'> => ({
    type: 'chat.update',
    timestamp: Date.now(),
    payload: {
      threadId,
      messages,
      status
    }
  })
}; 