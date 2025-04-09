import type { useCallback, useState } from 'react';
import type { AIProvider, AIModel } from '../types/provider.types.js.js';
import type { WebviewMessage } from '../types/webview.js.js';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeModel = (provider: AIProvider) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(provider.models[0]);

  const updateModel = useCallback(async (modelId: string) => {
    try {
      const model = provider.models.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Invia l'aggiornamento del modello al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          selectedModel: modelId
        }
      });

      setSelectedModel(model);
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  }, [provider.models]);

  const getModelInfo = useCallback((modelId: string) => {
    return provider.models.find(m => m.id === modelId);
  }, [provider.models]);

  return {
    selectedModel,
    updateModel,
    getModelInfo,
    availableModels: provider.models
  };
};