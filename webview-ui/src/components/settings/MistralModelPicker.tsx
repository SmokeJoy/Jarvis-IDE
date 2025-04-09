import React from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { OpenAiCompatibleModelInfo } from '../../../src/types/extension';

interface MistralModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
}

export const MistralModelPicker: React.FC<MistralModelPickerProps> = ({ modelInfo, onChange }) => {
  // Definizione dei modelli Mistral disponibili
  const models = [
    { id: 'mistral-tiny', name: 'Mistral Tiny', description: 'Modello leggero ottimizzato per velocità' },
    { id: 'mistral-small', name: 'Mistral Small', description: 'Equilibrio tra prestazioni e velocità' },
    { id: 'mistral-medium', name: 'Mistral Medium', description: 'Modello generale con prestazioni elevate' },
    { id: 'mistral-large', name: 'Mistral Large', description: 'Modello avanzato per compiti complessi' },
    { id: 'mistral-large-latest', name: 'Mistral Large (Latest)', description: 'Versione più recente di Mistral Large' },
    { id: 'open-mixtral-8x7b', name: 'Open Mixtral 8x7B', description: 'Modello open source con 8 esperti da 7B parametri' },
    { id: 'open-mistral-7b', name: 'Open Mistral 7B', description: 'Versione open source da 7B parametri' }
  ];

  // Gestione del cambiamento del modello selezionato
  const handleModelChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const selectedModelId = event.currentTarget.value;
    const selectedModel = models.find(model => model.id === selectedModelId);
    
    onChange({
      id: selectedModelId,
      name: selectedModel?.name || selectedModelId,
      description: selectedModel?.description || ''
    });
  };

  return (
    <div className="model-picker">
      <VSCodeDropdown value={modelInfo?.id || models[2].id} onChange={handleModelChange}>
        {models.map(model => (
          <VSCodeOption key={model.id} value={model.id}>
            {model.name}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
      {modelInfo?.id && (
        <div className="model-description">
          {models.find(m => m.id === modelInfo.id)?.description || ''}
        </div>
      )}
    </div>
  );
}; 