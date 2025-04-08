import React from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { OpenAiCompatibleModelInfo } from '../../../src/types/extension';

interface GeminiModelPickerProps {
  modelInfo?: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
}

export const GeminiModelPicker: React.FC<GeminiModelPickerProps> = ({ modelInfo, onChange }) => {
  const models = [
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
  ];

  return (
    <div className="model-picker">
      <VSCodeDropdown value={modelInfo?.id || models[0].id} onChange={e => {
        onChange({ id: e.currentTarget.value });
      }}>
        {models.map(model => (
          <VSCodeOption key={model.id} value={model.id}>{model.name}</VSCodeOption>
        ))}
      </VSCodeDropdown>
    </div>
  );
}; 