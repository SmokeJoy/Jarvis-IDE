import React from 'react';
import {
  VSCodeDropdown,
  VSCodeOption,
  VSCodeCheckbox,
  VSCodeTextArea,
} from '@vscode/webview-ui-toolkit/react';

interface SettingsPanelProps {
  selectedModel: string;
  coderMode: boolean;
  useDocuments: boolean;
  contextPrompt: string;
  onModelChange: (model: string) => void;
  onCoderModeChange: (enabled: boolean) => void;
  onUseDocumentsChange: (enabled: boolean) => void;
  onContextPromptChange: (prompt: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedModel,
  coderMode,
  useDocuments,
  contextPrompt,
  onModelChange,
  onCoderModeChange,
  onUseDocumentsChange,
  onContextPromptChange,
}) => {
  const handleModelChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    onModelChange(target.value);
  };

  const handleCoderModeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onCoderModeChange(target.checked);
  };

  const handleUseDocumentsChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onUseDocumentsChange(target.checked);
  };

  const handleContextPromptChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    onContextPromptChange(target.value);
  };

  return (
    <div>
      <VSCodeDropdown value={selectedModel} onInput={handleModelChange}>
        {/* Options will be added here */}
      </VSCodeDropdown>

      <VSCodeCheckbox checked={coderMode} onInput={handleCoderModeChange}>
        Coder Mode
      </VSCodeCheckbox>

      <VSCodeCheckbox checked={useDocuments} onInput={handleUseDocumentsChange}>
        Use Documents
      </VSCodeCheckbox>

      <VSCodeTextArea value={contextPrompt} onInput={handleContextPromptChange} />
    </div>
  );
};
