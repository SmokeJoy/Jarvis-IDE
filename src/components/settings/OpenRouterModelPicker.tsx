import React from 'react';
import { VSCodeDropdown } from '@vscode/webview-ui-toolkit/react';
import { ConfigModelInfo } from '../../types/models';
import { ApiConfiguration } from '../../src/shared/types/api.types';

interface OpenRouterModelPickerProps {
  apiConfiguration: ApiConfiguration;
  onApiConfigurationChange: (config: Partial<ApiConfiguration>) => void;
}

export const OpenRouterModelPicker: React.FC<OpenRouterModelPickerProps> = ({
  apiConfiguration,
  onApiConfigurationChange,
}) => {
  const handleModelChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    onApiConfigurationChange({
      selectedModel: value,
      modelInfo: models.find((m) => m.value === value),
    });
  };

  return (
    <div className="model-picker">
      <VSCodeDropdown value={apiConfiguration.selectedModel} onChange={handleModelChange}>
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </VSCodeDropdown>
    </div>
  );
};
