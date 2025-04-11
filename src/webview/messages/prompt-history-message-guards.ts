import { PromptHistoryMessageType, PromptHistoryMessageUnion } from './prompt-history-message';

export const isPromptHistoryLoadedMessage = (
  message: PromptHistoryMessageUnion
): message is PromptHistoryMessageUnion<PromptHistoryMessageType.HISTORY_LOADED> => {
  return message.type === PromptHistoryMessageType.HISTORY_LOADED;
};

export const isPromptHistoryUpdatedMessage = (
  message: PromptHistoryMessageUnion
): message is PromptHistoryMessageUnion<PromptHistoryMessageType.HISTORY_UPDATED> => {
  return message.type === PromptHistoryMessageType.HISTORY_UPDATED;
};

export const isPromptHistoryError = (
  message: PromptHistoryMessageUnion
): message is PromptHistoryMessageUnion<PromptHistoryMessageType.HISTORY_ERROR> => {
  return message.type === PromptHistoryMessageType.HISTORY_ERROR;
};