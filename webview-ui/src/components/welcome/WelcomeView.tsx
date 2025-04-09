import React, { useCallback } from 'react';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import { WebviewMessage } from '../../types/extension';

interface WelcomeViewProps {
	customInstructions: string;
	setCustomInstructions: (instructions: string) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
	customInstructions,
	setCustomInstructions
}) => {
	const handleCustomInstructionsChange = useCallback((event: FormEvent<HTMLTextAreaElement>) => {
		const target = event.target as HTMLTextAreaElement;
		setCustomInstructions(target.value);
	}, [setCustomInstructions]);

	const handleStart = useCallback(() => {
		const message: WebviewMessage = {
			type: 'startChat',
			customInstructions
		};
		window.postMessage(message, '*');
	}, [customInstructions]);

	return (
		<div className="welcome-view">
			<h1>Benvenuto in Jarvis IDE</h1>
			<p>
				Jarvis IDE è un assistente AI che ti aiuta a scrivere codice più velocemente e in modo più efficiente.
				Prima di iniziare, puoi personalizzare le istruzioni per l'assistente.
			</p>
			<VSCodeTextArea
				value={customInstructions}
				onChange={handleCustomInstructionsChange}
				placeholder="Inserisci le tue istruzioni personalizzate qui..."
			/>
			<VSCodeButton onClick={handleStart}>
				Inizia a chattare
			</VSCodeButton>
		</div>
	);
};

export default WelcomeView
