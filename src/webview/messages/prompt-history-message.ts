import { WebviewMessage } from './webview-message.js';

export enum PromptHistoryMessageType {
  REQUEST_HISTORY = 'requestHistory',
  HISTORY_LOADED = 'historyLoaded',
  SAVE_PROMPT = 'savePrompt',
  HISTORY_UPDATED = 'historyUpdated',
  HISTORY_ERROR = 'historyError'
}

export interface PromptHistoryMessage<T extends PromptHistoryMessageType> extends WebviewMessage<T> {
  payload: T extends PromptHistoryMessageType.REQUEST_HISTORY ? void :
    T extends PromptHistoryMessageType.HISTORY_LOADED ? Array<{
      id: string;
      prompt: string;
      timestamp: number;
    }> :
    T extends PromptHistoryMessageType.SAVE_PROMPT ? {
      prompt: string;
    } :
    T extends PromptHistoryMessageType.HISTORY_UPDATED ? Array<{
      id: string;
      prompt: string;
      timestamp: number;
    }> :
    T extends PromptHistoryMessageType.HISTORY_ERROR ? {
      error: string;
    } :
    never;
}

export type PromptHistoryMessageUnion = {
  [K in PromptHistoryMessageType]: PromptHistoryMessage<K>;
}[PromptHistoryMessageType];

export function createPromptHistoryMessage<T extends PromptHistoryMessageType>(
  type: T,
  payload: PromptHistoryMessage<T>['payload']
): PromptHistoryMessage<T> {
  return { type, payload } as PromptHistoryMessage<T>;
}