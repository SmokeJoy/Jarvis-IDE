import { useCallback } from 'react';
import { useExtensionState } from '../context/ExtensionStateContext';
import { ConfigModelInfo } from '../types/models';

export const useConfigModel = () => {
  const { state, setApiConfiguration } = useExtensionState();

  const setSelectedModel = useCallback(
    (modelId: string) => {
      const model = state.availableModels.find((m) => m.value === modelId);
      if (model) {
        setApiConfiguration({
          selectedModel: modelId,
          modelInfo: model,
        });
      }
    },
    [state.availableModels, setApiConfiguration]
  );

  const getModelInfo = useCallback(
    (modelId: string): ConfigModelInfo | undefined => {
      return state.availableModels.find((m) => m.value === modelId);
    },
    [state.availableModels]
  );

  const getDefaultModel = useCallback((): ConfigModelInfo | undefined => {
    return state.availableModels.find((m) => m.isDefault) || state.availableModels[0];
  }, [state.availableModels]);

  return {
    selectedModel: state.apiConfiguration.selectedModel,
    modelInfo: state.apiConfiguration.modelInfo,
    availableModels: state.availableModels,
    setSelectedModel,
    getModelInfo,
    getDefaultModel,
  };
};
