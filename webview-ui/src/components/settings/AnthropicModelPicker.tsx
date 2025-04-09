import React, { useCallback } from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { OpenAiCompatibleModelInfo } from '../../../src/types/extension';

interface AnthropicModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
}

export const AnthropicModelPicker: React.FC<AnthropicModelPickerProps> = ({ modelInfo, onChange }) => {
  const handleModelChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const modelId = event.currentTarget.value;
      const newModelInfo: OpenAiCompatibleModelInfo = {
        ...(modelInfo || {}),
        id: modelId,
      };
      onChange(newModelInfo);
    },
    [modelInfo, onChange]
  );

  const anthropicModels = [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    { id: 'claude-2.1', name: 'Claude 2.1' },
    { id: 'claude-2.0', name: 'Claude 2.0' },
    { id: 'claude-instant-1.2', name: 'Claude Instant 1.2' }
  ];

  return (
    <div className="model-picker">
      <VSCodeDropdown value={modelInfo?.id || 'claude-3-opus-20240229'} onChange={handleModelChange}>
        {anthropicModels.map((model) => (
          <VSCodeOption key={model.id} value={model.id}>
            {model.name}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
    </div>
  );
}; 