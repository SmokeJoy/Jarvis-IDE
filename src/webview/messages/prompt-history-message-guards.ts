import {
  PromptHistoryMessageType,
  PromptHistoryMessageUnion,
  PromptHistoryMessage,
} from './prompt-history-message';

export function isPromptHistoryLoadedMessage(
  message: unknown
): message is PromptHistoryMessage<PromptHistoryMessageType.HISTORY_LOADED> {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_LOADED
  );
}

export function isPromptHistoryUpdatedMessage(
  message: unknown
): message is PromptHistoryMessage<PromptHistoryMessageType.HISTORY_UPDATED> {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_UPDATED
  );
}

export function isPromptHistoryErrorMessage(
  message: unknown
): message is PromptHistoryMessage<PromptHistoryMessageType.HISTORY_ERROR> {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === PromptHistoryMessageType.HISTORY_ERROR
  );
}
