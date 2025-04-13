export enum ModelSelectorMessageType {
  REQUEST_MODELS = 'requestModels',
  MODEL_SELECTED = 'modelSelected',
  MODEL_LIST_UPDATED = 'modelListUpdated',
}

export interface RequestModelsMessage {
  type: ModelSelectorMessageType.REQUEST_MODELS;
}

export interface ModelSelectedMessage {
  type: ModelSelectorMessageType.MODEL_SELECTED;
  payload: {
    modelId: string;
  };
}

export interface ModelListUpdatedMessage {
  type: ModelSelectorMessageType.MODEL_LIST_UPDATED;
  payload: Array<{
    id: string;
    name: string;
  }>;
}

export type ModelSelectorMessageUnion =
  | RequestModelsMessage
  | ModelSelectedMessage
  | ModelListUpdatedMessage;
