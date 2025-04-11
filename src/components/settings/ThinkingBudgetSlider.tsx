import React from 'react';
import { VSCodeSlider } from '@vscode/webview-ui-toolkit/react';
import { ApiConfiguration } from '../../types/api.types.js';

interface ThinkingBudgetSliderProps {
  apiConfiguration: ApiConfiguration;
  onApiConfigurationChange: (config: Partial<ApiConfiguration>) => void;
}

export const ThinkingBudgetSlider: React.FC<ThinkingBudgetSliderProps> = ({
  apiConfiguration,
  onApiConfigurationChange,
}) => {
  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    onApiConfigurationChange({
      thinkingBudgetMs: parseInt(event.currentTarget.value)
    });
  };

  return (
    <div className="thinking-budget-slider">
      <VSCodeSlider
        min={0}
        max={10000}
        value={apiConfiguration.thinkingBudgetMs}
        onChange={handleChange}
      />
    </div>
  );
}; 