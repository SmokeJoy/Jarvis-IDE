import React, { useEffect, useState } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { OpenAiCompatibleModelInfo } from '../../../src/types/extension';
import { vscode } from '../../utils/vscode';

interface OllamaModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
  availableModels?: string[];
}

export const OllamaModelPicker: React.FC<OllamaModelPickerProps> = ({ 
  modelInfo, 
  onChange,
  availableModels = [] 
}) => {
  // Modelli predefiniti da mostrare anche se Ollama non è in esecuzione
  const defaultModels = [
    { id: 'llama3', name: 'Llama 3 (8B)', description: 'Modello conversazionale generale' },
    { id: 'mistral', name: 'Mistral (7B)', description: 'Ottimo bilanciamento prestazioni/dimensioni' },
    { id: 'codellama', name: 'CodeLlama (7B)', description: 'Specializzato per programmazione' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder (6.7B)', description: 'Ottimizzato per codice' },
    { id: 'llava', name: 'LLaVA (Vision)', description: 'Modello multimodale con supporto immagini' },
    { id: 'phi3', name: 'Phi-3 (3.8B)', description: 'Modello compatto ad alte prestazioni' },
    { id: 'mixtral', name: 'Mixtral (8x7B)', description: 'Modello MoE con 8 esperti' }
  ];

  // Combina i modelli predefiniti con quelli disponibili trovati in Ollama
  const allModels = [
    ...defaultModels,
    ...availableModels
      .filter(model => !defaultModels.some(dm => dm.id === model))
      .map(model => ({ id: model, name: model, description: 'Modello disponibile in Ollama' }))
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

  // Raggruppa i modelli per tipo
  const groupedModels = {
    general: allModels.filter(m => 
      ['llama3', 'mistral', 'phi3', 'mixtral', 'vicuna', 'gemma'].some(id => m.id.includes(id))),
    code: allModels.filter(m => 
      ['codellama', 'deepseek-coder', 'wizard-coder', 'starcoder'].some(id => m.id.includes(id))),
    vision: allModels.filter(m => 
      ['llava', 'bakllava', 'moondream'].some(id => m.id.includes(id))),
    other: allModels.filter(m => 
      !['llama3', 'mistral', 'phi3', 'mixtral', 'vicuna', 'gemma', 
        'codellama', 'deepseek-coder', 'wizard-coder', 'starcoder',
        'llava', 'bakllava', 'moondream'].some(id => m.id.includes(id)))
  };

  return (
    <div className="model-picker">
      <VSCodeDropdown value={modelInfo?.id || defaultModels[0].id} onChange={handleModelChange}>
        {groupedModels.general.length > 0 && (
          <optgroup label="Modelli Generali">
            {groupedModels.general.map(model => (
              <VSCodeOption key={model.id} value={model.id}>
                {model.name}
              </VSCodeOption>
            ))}
          </optgroup>
        )}
        
        {groupedModels.code.length > 0 && (
          <optgroup label="Modelli per Codice">
            {groupedModels.code.map(model => (
              <VSCodeOption key={model.id} value={model.id}>
                {model.name}
              </VSCodeOption>
            ))}
          </optgroup>
        )}
        
        {groupedModels.vision.length > 0 && (
          <optgroup label="Modelli Vision">
            {groupedModels.vision.map(model => (
              <VSCodeOption key={model.id} value={model.id}>
                {model.name}
              </VSCodeOption>
            ))}
          </optgroup>
        )}
        
        {groupedModels.other.length > 0 && (
          <optgroup label="Altri Modelli">
            {groupedModels.other.map(model => (
              <VSCodeOption key={model.id} value={model.id}>
                {model.name}
              </VSCodeOption>
            ))}
          </optgroup>
        )}
      </VSCodeDropdown>
      
      {modelInfo?.id && (
        <div className="model-description">
          {allModels.find(m => m.id === modelInfo.id)?.description || ''}
        </div>
      )}
    </div>
  );
}; 