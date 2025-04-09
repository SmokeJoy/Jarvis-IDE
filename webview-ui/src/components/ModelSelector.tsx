import React, { useState, useEffect } from 'react';
import { VSCodeDropdown, VSCodeOption, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { useExtensionState } from '../context/ExtensionStateContext';
import { ConfigModelInfo } from '../types/models';
import { WebviewMessageType } from '../../src/shared/WebviewMessageType';
import { vscode } from '../utils/vscode';

const SelectorContainer = styled.div`
  margin: 1rem 0;
`;

const SelectorLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const ModelTag = styled.span`
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  background-color: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
`;

const CoderTag = styled(ModelTag)`
  background-color: var(--vscode-activityBarBadge-background);
  color: var(--vscode-activityBarBadge-foreground);
`;

interface ModelSelectorProps {
  // Componente senza props specifici
}

export const ModelSelector: React.FC<ModelSelectorProps> = () => {
  const { state, setSelectedModel } = useExtensionState();
  const [showOnlyCoderModels, setShowOnlyCoderModels] = useState(false);
  
  useEffect(() => {
    // Richiedi le impostazioni all'estensione
    vscode.postMessage({
      type: WebviewMessageType.GET_SETTINGS
    });
  }, []);
  
  const handleModelChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const newModelId = target.value;
    
    setSelectedModel(newModelId);
    
    // Invio un messaggio all'estensione per aggiornare il modello
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_MODEL,
      value: newModelId
    });
  };
  
  // Filtra i modelli in base alla selezione
  let filteredModels = state.availableModels || [];
  if (showOnlyCoderModels) {
    filteredModels = filteredModels.filter(model => model.coder);
  }
  
  // Ordina per provider e poi per nome
  const sortedModels = [...filteredModels].sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    return a.label.localeCompare(b.label);
  });
  
  return (
    <SelectorContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <SelectorLabel>Modello LLM:</SelectorLabel>
        <div>
          <VSCodeCheckbox 
            checked={showOnlyCoderModels} 
            onChange={() => setShowOnlyCoderModels(!showOnlyCoderModels)}
          />
          <span style={{ marginLeft: '4px' }}>Solo modelli per codice</span>
        </div>
      </div>
      
      <VSCodeDropdown value={state.selectedModel} onChange={handleModelChange}>
        {sortedModels.map((model) => (
          <VSCodeOption key={model.value} value={model.value}>
            {model.label} ({model.provider})
            {model.coder ? 
              <CoderTag>Coder</CoderTag> : 
              <ModelTag>Generico</ModelTag>}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
      
      {state.selectedModel && sortedModels.find(m => m.value === state.selectedModel)?.description && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
          {sortedModels.find(m => m.value === state.selectedModel)?.description}
        </div>
      )}
    </SelectorContainer>
  );
}; 