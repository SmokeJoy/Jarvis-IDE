import React from 'react'
import { ModelInfo } from '../../types/extension'

interface OpenAiModelPickerProps {
	openAiModels: ModelInfo[]
	selectedModelId: string
	onSelect: (modelId: string) => void
}

export const OpenAiModelPicker: React.FC<OpenAiModelPickerProps> = ({
	openAiModels,
	selectedModelId,
	onSelect,
}) => {
	return (
		<div style={{ marginTop: '1rem' }}>
			<h3>OpenAI Models</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
				{openAiModels.map((model) => (
					<button
						key={model.name}
						style={{
							padding: '0.5rem',
							border: '1px solid var(--vscode-button-border)',
							borderRadius: '4px',
							background: model.name === selectedModelId ? 'var(--vscode-button-background)' : 'transparent',
							color: model.name === selectedModelId ? 'var(--vscode-button-foreground)' : 'var(--vscode-foreground)',
							cursor: 'pointer',
						}}
						onClick={() => onSelect(model.name)}
					>
						{model.name}
					</button>
				))}
			</div>
		</div>
	)
}
