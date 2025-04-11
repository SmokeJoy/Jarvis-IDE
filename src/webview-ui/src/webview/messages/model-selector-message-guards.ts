import { ModelSelectorMessageType, ModelSelectorMessageUnion } from './model-selector-message';

export const isRequestModelsMessage = (
  message: ModelSelectorMessageUnion
): message is { type: ModelSelectorMessageType.REQUEST_MODELS } => {
  return message.type === ModelSelectorMessageType.REQUEST_MODELS;
};

export const isModelSelectedMessage = (
  message: ModelSelectorMessageUnion
): message is { 
  type: ModelSelectorMessageType.MODEL_SELECTED,
  payload: { modelId: string }
} => {
  return message.type === ModelSelectorMessageType.MODEL_SELECTED;
};

export const isModelListUpdatedMessage = (
  message: ModelSelectorMessageUnion
): message is {
  type: ModelSelectorMessageType.MODEL_LIST_UPDATED,
  payload: Array<{ id: string; name: string }>
} => {
  return message.type === ModelSelectorMessageType.MODEL_LIST_UPDATED;
};