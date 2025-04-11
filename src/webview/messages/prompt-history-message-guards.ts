import { PromptHistoryMessageType, PromptHistoryMessageUnion } from './prompt-history-message';

export function isPromptHistoryLoadedMessage(message: unknown): message is PromptHistoryMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_LOADED
  );
}

export function isPromptHistoryUpdatedMessage(message: unknown): message is PromptHistoryMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_UPDATED
  );
}

export function isPromptHistoryErrorMessage(message: unknown): message is PromptHistoryMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_ERROR
  );
}