export type ModelSelectorMessageUnion =
  | { type: 'modelSelected'; payload: { modelId: string } }
  | { type: 'requestModels' }
  | { type: 'modelListUpdated'; payload: Array<{ id: string; name: string }> };

export const isModelSelectorMessage = (message: unknown): message is ModelSelectorMessageUnion => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    ['modelSelected', 'requestModels', 'modelListUpdated'].includes(
      (message as ModelSelectorMessageUnion).type
    )
  );
};
