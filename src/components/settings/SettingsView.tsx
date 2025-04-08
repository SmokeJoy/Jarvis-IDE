import React from 'react';
import { VSCodeCheckbox, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import type { TelemetrySetting } from '../../types/extension.js';
import type { ApiConfiguration } from '../../types/api.types.js';
import { OpenRouterModelPicker } from './OpenRouterModelPicker.js';
import { ThinkingBudgetSlider } from './ThinkingBudgetSlider.js';

interface SettingsViewProps {
  telemetrySetting: TelemetrySetting;
  apiConfiguration: ApiConfiguration;
  customInstructions: string;
  onTelemetryChange: (setting: TelemetrySetting) => void;
  onApiConfigurationChange: (config: Partial<ApiConfiguration>) => void;
  onCustomInstructionsChange: (instructions: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  telemetrySetting,
  apiConfiguration,
  customInstructions,
  onTelemetryChange,
  onApiConfigurationChange,
  onCustomInstructionsChange,
}) => {
  const handleTelemetryChange = (event: React.FormEvent<HTMLInputElement>) => {
    onTelemetryChange(event.currentTarget.checked ? 'enabled' : 'disabled');
  };

  const handleCustomInstructionsChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    onCustomInstructionsChange(event.currentTarget.value);
  };

  return (
    <div className="settings-view">
      <section>
        <h2>Model Settings</h2>
        <OpenRouterModelPicker
          apiConfiguration={apiConfiguration}
          onApiConfigurationChange={onApiConfigurationChange}
        />
        <ThinkingBudgetSlider
          apiConfiguration={apiConfiguration}
          onApiConfigurationChange={onApiConfigurationChange}
        />
      </section>

      <section>
        <h2>Telemetry</h2>
        <VSCodeCheckbox
          checked={telemetrySetting === 'enabled'}
          onChange={handleTelemetryChange}
        >
          Enable Telemetry
        </VSCodeCheckbox>
      </section>

      <section>
        <h2>Custom Instructions</h2>
        <VSCodeTextArea
          value={customInstructions}
          onChange={handleCustomInstructionsChange}
          rows={5}
        />
      </section>
    </div>
  );
}; 