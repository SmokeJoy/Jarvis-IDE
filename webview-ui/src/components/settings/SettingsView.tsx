import React, { useCallback } from 'react';
import { VSCodeButton, VSCodeCheckbox, VSCodeTextArea, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { ModelSelector } from '../ModelSelector';
import { SystemPromptEditor } from '../SystemPromptEditor';
import { ContextPromptEditor } from '../ContextPromptEditor';
import { CoderModeToggle } from '../CoderModeToggle';
import { AgentStatusPanel } from '../AgentStatusPanel';

interface SettingsViewProps {
	onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
	const { state, setApiConfiguration, setTelemetrySetting, setCustomInstructions } = useExtensionState();

	const handleTelemetryChange = useCallback((event: Event) => {
		const checkboxEvent = event as unknown as React.FormEvent<HTMLInputElement>;
		setTelemetrySetting(checkboxEvent.currentTarget.checked ? 'enabled' : 'disabled');
	}, [setTelemetrySetting]);

	const handleCustomInstructionsChange = useCallback((event: Event) => {
		const textareaEvent = event as unknown as React.FormEvent<HTMLTextAreaElement>;
		setCustomInstructions(textareaEvent.currentTarget.value);
	}, [setCustomInstructions]);

	const handleSave = useCallback(() => {
		vscode.postMessage({
			type: 'saveSettings',
			payload: {
				apiConfiguration: state.apiConfiguration,
				telemetryEnabled: state.telemetrySetting.enabled,
				customInstructions: state.customInstructions
			}
		});
	}, [state]);

	const handleReset = useCallback(() => {
		vscode.postMessage({
			type: 'resetSettings'
		});
	}, []);

	const handleExport = useCallback(() => {
		vscode.postMessage({
			type: 'exportSettings'
		});
	}, []);

	const handleImport = useCallback(() => {
		vscode.postMessage({
			type: 'importSettings'
		});
	}, []);

	return (
		<div className="settings-container">
			<h2>Impostazioni</h2>
			
			<div className="settings-section">
				<h3>Modello LLM</h3>
				<ModelSelector />
			</div>

			<div className="settings-section">
				<ContextPromptEditor />
			</div>
			
			<div className="settings-section">
				<CoderModeToggle />
			</div>

			<div className="settings-section">
				<AgentStatusPanel />
			</div>

			<SystemPromptEditor />

			<div className="settings-section">
				<h3>Configurazione API</h3>
				{/* Aggiungo qui eventuali configurazioni aggiuntive delle API */}
			</div>

			<div className="settings-section">
				<h3>Telemetria</h3>
				<VSCodeCheckbox
					checked={state.telemetrySetting.enabled}
					onChange={handleTelemetryChange}
				>
					Abilita telemetria
				</VSCodeCheckbox>
			</div>

			<div className="settings-section">
				<h3>Istruzioni Personalizzate</h3>
				<VSCodeTextArea
					value={state.customInstructions}
					onChange={handleCustomInstructionsChange}
					placeholder="Inserisci le tue istruzioni personalizzate..."
				/>
			</div>

			<div className="settings-actions">
				<div className="settings-actions-left">
					<VSCodeButton onClick={handleImport}>
						Importa
					</VSCodeButton>
					<VSCodeButton onClick={handleExport}>
						Esporta
					</VSCodeButton>
				</div>
				<div className="settings-actions-right">
					<VSCodeButton onClick={handleReset}>
						Ripristina Default
					</VSCodeButton>
					<VSCodeButton onClick={handleSave}>
						Salva
					</VSCodeButton>
					<VSCodeButton onClick={onClose}>
						Chiudi
					</VSCodeButton>
				</div>
			</div>
		</div>
	);
};
