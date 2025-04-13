import { ModelSelectorMessageUnion } from './model-selector-message';

export const isModelSelectedMessage = (
  message: unknown
): message is Extract<ModelSelectorMessageUnion, { type: 'modelSelected' }> => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as ModelSelectorMessageUnion).type === 'modelSelected'
  );
};

export const isRequestModelsMessage = (
  message: unknown
): message is Extract<ModelSelectorMessageUnion, { type: 'requestModels' }> => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as ModelSelectorMessageUnion).type === 'requestModels'
  );
};

export const isModelListUpdatedMessage = (
  message: unknown
): message is Extract<ModelSelectorMessageUnion, { type: 'modelListUpdated' }> => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as ModelSelectorMessageUnion).type === 'modelListUpdated'
  );
};
