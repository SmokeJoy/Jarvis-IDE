import { WebviewMessage } from './webview-message';

export enum PromptHistoryMessageType {
  REQUEST_HISTORY = 'requestPromptHistory',
  HISTORY_LOADED = 'promptHistoryLoaded',
  SAVE_PROMPT = 'savePromptToHistory',
  HISTORY_UPDATED = 'promptHistoryUpdated',
  HISTORY_ERROR = 'promptHistoryError'
}

export type PromptHistoryMessageUnion = WebviewMessage<
  PromptHistoryMessageType,
  {
    [PromptHistoryMessageType.REQUEST_HISTORY]: undefined,
    [PromptHistoryMessageType.HISTORY_LOADED]: {
      history: Array<{ id: string; prompt: string; timestamp: number }>;
    },
    [PromptHistoryMessageType.SAVE_PROMPT]: {
      prompt: string;
      agentId?: string;
    },
    [PromptHistoryMessageType.HISTORY_UPDATED]: {
      newEntry: { id: string; prompt: string; timestamp: number };
    },
    [PromptHistoryMessageType.HISTORY_ERROR]: {
      error: string;
      errorCode: number;
    }
  }
>;