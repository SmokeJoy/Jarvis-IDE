import { BaseMessage } from './message.js';

export enum PromptHistoryMessageType {
  REQUEST_HISTORY = 'requestHistory',
  HISTORY_LOADED = 'historyLoaded',
  SAVE_PROMPT = 'savePrompt',
  HISTORY_UPDATED = 'historyUpdated',
  ERROR = 'error'
}

export interface PromptHistoryMessage<T extends PromptHistoryMessageType> extends BaseMessage<T> {
  payload: T extends PromptHistoryMessageType.REQUEST_HISTORY ? void :
    T extends PromptHistoryMessageType.HISTORY_LOADED ? {
      history: Array<{
        id: string;
        timestamp: number;
        prompt: string;
        response: string;
        provider: string;
        success: boolean;
        error?: string;
        duration: number;
        metadata?: Record<string, unknown>;
      }>;
      lastUpdated: number;
    } :
    T extends PromptHistoryMessageType.SAVE_PROMPT ? {
      prompt: string;
      response: string;
      provider: string;
      success: boolean;
      error?: string;
      duration: number;
      metadata?: Record<string, unknown>;
    } :
    T extends PromptHistoryMessageType.HISTORY_UPDATED ? {
      history: Array<{
        id: string;
        timestamp: number;
        prompt: string;
        response: string;
        provider: string;
        success: boolean;
        error?: string;
        duration: number;
        metadata?: Record<string, unknown>;
      }>;
      lastUpdated: number;
    } :
    T extends PromptHistoryMessageType.ERROR ? {
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