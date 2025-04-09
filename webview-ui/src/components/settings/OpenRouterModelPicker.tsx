import React, { useCallback, useEffect, useState } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { WebviewMessageType } from '@/shared/WebviewMessageType';
import { vscode } from '@/utils/vscode';
import { ConfigModelInfo } from '@/types/models';

interface OpenRouterModelPickerProps {
	// Componente senza props specifici
}

export const OpenRouterModelPicker: React.FC<OpenRouterModelPickerProps> = () => {
	const { state, setApiConfiguration, setAvailableModels, setSelectedModel } = useExtensionState();
	
	useEffect(() => {
		// Richiedi le impostazioni all'estensione
		vscode.postMessage({
			type: WebviewMessageType.GET_SETTINGS
		});
	}, []);

	// Ascolta i messaggi dall'estensione
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			if (message.type === 'settings' && message.payload) {
				const { availableModels = [], model = '' } = message.payload;
				setAvailableModels(availableModels);
				setSelectedModel(model);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [setAvailableModels, setSelectedModel]);

	const handleModelChange = useCallback((event: Event) => {
		const selectEvent = event as unknown as React.FormEvent<HTMLSelectElement>;
		const selectedValue = selectEvent.currentTarget.value;
		setSelectedModel(selectedValue);
		
		// Trova il modello selezionato
		const modelInfo = state.availableModels?.find(m => m.value === selectedValue);
		if (modelInfo) {
			// Aggiorna la configurazione API
			setApiConfiguration({
				...state.apiConfiguration,
				provider: modelInfo.provider,
				model: modelInfo.value
			});
			
			// Invia l'aggiornamento delle impostazioni all'estensione
			vscode.postMessage({
				type: WebviewMessageType.UPDATE_SETTING,
				payload: {
					key: 'provider',
					value: modelInfo.provider
				}
			});
			
			vscode.postMessage({
				type: WebviewMessageType.UPDATE_SETTING,
				payload: {
					key: 'model',
					value: modelInfo.value
				}
			});
			
			vscode.postMessage({
				type: WebviewMessageType.UPDATE_SETTING,
				payload: {
					key: 'coder_mode',
					value: modelInfo.coder
				}
			});
		}
	}, [state.availableModels, state.apiConfiguration, setApiConfiguration, setSelectedModel]);

	return (
		<div className="model-picker-container">
			<label htmlFor="model-selector">Seleziona Modello LLM:</label>
			<VSCodeDropdown id="model-selector" value={state.selectedModel} onChange={handleModelChange}>
				{state.availableModels?.map((model) => (
					<VSCodeOption key={model.value} value={model.value}>
						{model.label}
					</VSCodeOption>
				))}
			</VSCodeDropdown>
		</div>
	);
};
