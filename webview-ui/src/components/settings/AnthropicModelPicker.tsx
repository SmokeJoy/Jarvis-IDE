import React, { useCallback, useEffect, useState } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import type { OpenAiCompatibleModelInfo } from '../../types/models';
import { fetchModels } from '../../utils/modelFetcher';

interface AnthropicModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (model: OpenAiCompatibleModelInfo) => void;
  apiKey?: string;
}

export const AnthropicModelPicker: React.FC<AnthropicModelPickerProps> = ({ 
  modelInfo, 
  onChange,
  apiKey 
}) => {
  // Stato locale per i modelli disponibili
  const [availableModels, setAvailableModels] = useState<OpenAiCompatibleModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carica i modelli dal provider registry
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Recupera i modelli da Anthropic tramite il provider registry
        const models = await fetchModels('anthropic', apiKey);
        
        if (models && models.length > 0) {
          setAvailableModels(models);
        } else {
          // Fallback ai modelli statici se non ci sono risultati
          setAvailableModels([
            { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', contextLength: 200000 },
            { id: 'claude-instant-1.2', name: 'Claude Instant 1.2', provider: 'anthropic', contextLength: 200000 }
          ]);
        }
      } catch (err) {
        console.error('Errore nel caricamento dei modelli Anthropic:', err);
        setError('Impossibile caricare i modelli. Verifica la chiave API.');
        
        // Fallback ai modelli statici in caso di errore
        setAvailableModels([
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextLength: 200000 },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextLength: 200000 },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextLength: 200000 },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', contextLength: 200000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModels();
  }, [apiKey]);

  // Gestisce il cambio di modello
  const handleModelChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const modelId = event.currentTarget.value;
      const selectedModel = availableModels.find(model => model.id === modelId);
      
      if (selectedModel) {
        onChange(selectedModel);
      } else {
        // Fallback se il modello non è trovato
        const newModelInfo: OpenAiCompatibleModelInfo = {
          ...(modelInfo || {}),
          id: modelId,
          provider: 'anthropic',
          contextLength: 200000
        };
        onChange(newModelInfo);
      }
    },
    [availableModels, modelInfo, onChange]
  );

  // Valore di default per il dropdown
  const defaultModelId = modelInfo?.id || 'claude-3-7-sonnet-20250219';

  return (
    <div className="model-picker">
      {isLoading ? (
        <div className="loading-indicator">Caricamento modelli...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <VSCodeDropdown value={defaultModelId} onChange={handleModelChange}>
          {availableModels.map((model) => (
            <VSCodeOption key={model.id} value={model.id}>
              {model.name}
            </VSCodeOption>
          ))}
        </VSCodeDropdown>
      )}
    </div>
  );
}; 