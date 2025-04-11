import React, { useCallback, useEffect, useState } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { WebviewMessageType, ModelSelectedMessage } from '@/types/WebviewMessageType';
import { vscode } from '@/utils/vscode';
import type { OpenAiCompatibleModelInfo } from '@/types/models';
import { fetchModels } from '@/utils/modelFetcher';

interface OpenRouterModelPickerProps {
	modelInfo?: OpenAiCompatibleModelInfo;
	onChange: (model: OpenAiCompatibleModelInfo) => void;
	apiKey?: string;
}

export const OpenRouterModelPicker: React.FC<OpenRouterModelPickerProps> = ({
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
				// Recupera i modelli da OpenRouter tramite il provider registry
				const models = await fetchModels('openrouter', apiKey);
				
				if (models && models.length > 0) {
					setAvailableModels(models);
				} else {
					// Fallback ai modelli statici se non ci sono risultati
					setAvailableModels([
						{ id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openrouter', contextLength: 128000 },
						{ id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'openrouter', contextLength: 200000 },
						{ id: 'anthropic/claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'openrouter', contextLength: 200000 },
						{ id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'openrouter', contextLength: 8192 },
						{ id: 'mistralai/mistral-large-2402', name: 'Mistral Large', provider: 'openrouter', contextLength: 32000 }
					]);
				}
			} catch (err) {
				console.error('Errore nel caricamento dei modelli OpenRouter:', err);
				setError('Impossibile caricare i modelli. Verifica la chiave API.');
				
				// Fallback ai modelli statici in caso di errore
				setAvailableModels([
					{ id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openrouter', contextLength: 128000 },
					{ id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'openrouter', contextLength: 200000 },
					{ id: 'mistralai/mistral-large-2402', name: 'Mistral Large', provider: 'openrouter', contextLength: 32000 }
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
				
				const message: ModelSelectedMessage = {
					type: 'modelSelected',
					timestamp: Date.now(),
					payload: {
						modelId: selectedModel.id,
						modelInfo: selectedModel
					}
				};
				vscode.postMessage(message);
			} else {
				// Fallback se il modello non è trovato
				const newModelInfo: OpenAiCompatibleModelInfo = {
					...(modelInfo || {}),
					id: modelId,
					provider: 'openrouter',
					contextLength: 32000
				};
				onChange(newModelInfo);
			}
		},
		[availableModels, modelInfo, onChange]
	);

	// Valore di default per il dropdown
	const defaultModelId = modelInfo?.id || 'openai/gpt-4-turbo';

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
