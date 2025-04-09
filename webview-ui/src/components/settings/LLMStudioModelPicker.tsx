import React, { useEffect, useState } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { OpenAiCompatibleModelInfo } from '../../../src/types/extension';
import { vscode } from '../../utils/vscode';

interface LLMStudioModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
  availableModels?: string[];
}

export const LLMStudioModelPicker: React.FC<LLMStudioModelPickerProps> = ({ 
  modelInfo, 
  onChange,
  availableModels = [] 
}) => {
  // Modelli predefiniti da mostrare anche se LLM Studio non è in esecuzione
  const defaultModels = [
    { id: 'deepseek-coder-6.7b', name: 'DeepSeek Coder 6.7B', description: 'Ottimizzato per codice' },
    { id: 'mistral-7b', name: 'Mistral 7B', description: 'Modello base bilanciato' },
    { id: 'codellama-7b', name: 'CodeLlama 7B', description: 'Specializzato in programmazione' },
    { id: 'llama3-8b', name: 'Llama 3 8B', description: 'Modello conversazionale recente' }
  ];

  // Combina i modelli predefiniti con quelli disponibili trovati in LLM Studio
  const allModels = [
    ...defaultModels,
    ...availableModels
      .filter(model => !defaultModels.some(dm => dm.id === model))
      .map(model => ({ id: model, name: model, description: 'Modello disponibile in LLM Studio' }))
  ];

  // Gestione del cambiamento del modello selezionato
  const handleModelChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const selectedModelId = event.currentTarget.value;
    const selectedModel = allModels.find(model => model.id === selectedModelId);
    
    onChange({
      id: selectedModelId,
      name: selectedModel?.name || selectedModelId,
      description: selectedModel?.description || ''
    });
  };

  return (
    <div className="model-picker">
      <VSCodeDropdown value={modelInfo?.id || defaultModels[0].id} onChange={handleModelChange}>
        {allModels.map(model => (
          <VSCodeOption key={model.id} value={model.id}>
            {model.name}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
      {modelInfo?.id && (
        <div className="model-description">
          {allModels.find(m => m.id === modelInfo.id)?.description || ''}
        </div>
      )}
    </div>
  );
}; 