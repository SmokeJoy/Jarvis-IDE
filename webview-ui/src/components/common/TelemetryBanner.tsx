import React from 'react';
import { VSCodeButton, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { vscode } from "../../utils/vscode"
import { TelemetrySetting } from "../../../../src/shared/TelemetrySetting"

const Container = styled.div`
	margin: 1rem 0;
	padding: 1rem;
	background-color: var(--vscode-editor-background);
	border: 1px solid var(--vscode-button-border);
	border-radius: 4px;
`;

const Title = styled.h3`
	margin: 0 0 0.5rem 0;
	color: var(--vscode-editor-foreground);
`;

const Description = styled.p`
	margin: 0 0 1rem 0;
	color: var(--vscode-descriptionForeground);
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

interface TelemetryBannerProps {
	onAccept: () => void;
	onDeJarvis: () => void;
	onDontAskAgain: (checked: boolean) => void;
}

export const TelemetryBanner: React.FC<TelemetryBannerProps> = ({
	onAccept,
	onDeJarvis,
	onDontAskAgain
}) => {
	const handleCheckboxChange = (event: Event) => {
		const checkboxEvent = event as unknown as React.FormEvent<HTMLInputElement>;
		onDontAskAgain(checkboxEvent.currentTarget.checked);
	};

	return (
		<Container>
			<Title>Telemetria</Title>
			<Description>
				Jarvis IDE raccoglie dati di utilizzo anonimi per migliorare l'esperienza utente.
				Nessun dato personale viene mai condiviso.
			</Description>
			<ButtonContainer>
				<VSCodeButton onClick={onAccept}>
					Accetta
				</VSCodeButton>
				<VSCodeButton onClick={onDeJarvis}>
					Rifiuta
				</VSCodeButton>
				<VSCodeCheckbox onChange={handleCheckboxChange}>
					Non chiedere più
				</VSCodeCheckbox>
			</ButtonContainer>
		</Container>
	);
};
