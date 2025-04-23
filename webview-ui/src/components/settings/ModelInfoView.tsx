import React from 'react';
import { VSCodeTextField, VSCodeCheckbox, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import type { OpenAiCompatibleModelInfo } from '../../../src/shared/types';
import './ModelInfoView.css';

interface ModelInfoViewProps {
  modelInfo: OpenAiCompatibleModelInfo;
  onChange: (modelInfo: OpenAiCompatibleModelInfo) => void;
}

export const ModelInfoView: React.FC<ModelInfoViewProps> = ({
  modelInfo,
  onChange
}) => {
  const handleInputChange = (field: keyof OpenAiCompatibleModelInfo) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({
      ...modelInfo,
      [field]: event.target.value
    });
  };

  const handleCheckboxChange = (field: keyof OpenAiCompatibleModelInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...modelInfo,
      [field]: event.target.checked
    });
  };

  return (
    <div className="model-info-container">
      <VSCodeTextField
        value={modelInfo.id}
        placeholder="Model ID"
        onChange={handleInputChange('id')}
      />
      <VSCodeTextField
        value={modelInfo.name}
        placeholder="Model Name"
        onChange={handleInputChange('name')}
      />
      <VSCodeTextField
        value={modelInfo.context_length?.toString()}
        type="number"
        placeholder="Context Length"
        onChange={handleInputChange('context_length')}
      />
      <VSCodeTextField
        value={modelInfo.temperature?.toString()}
        type="number"
        placeholder="Temperature"
        onChange={handleInputChange('temperature')}
      />
      <VSCodeTextField
        value={modelInfo.maxTokens?.toString()}
        type="number"
        placeholder="Max Tokens"
        onChange={handleInputChange('maxTokens')}
      />
      <VSCodeCheckbox
        checked={modelInfo.supportsPromptCache}
        onChange={handleCheckboxChange('supportsPromptCache')}
      >
        Supports Prompt Cache
      </VSCodeCheckbox>
      <VSCodeCheckbox
        checked={modelInfo.supportsFunctionCalling}
        onChange={handleCheckboxChange('supportsFunctionCalling')}
      >
        Supports Function Calling
      </VSCodeCheckbox>
      <VSCodeCheckbox
        checked={modelInfo.supportsVision}
        onChange={handleCheckboxChange('supportsVision')}
      >
        Supports Vision
      </VSCodeCheckbox>
      <VSCodeTextField
        value={modelInfo.contextWindow?.toString()}
        type="number"
        placeholder="Context Window"
        onChange={handleInputChange('contextWindow')}
      />
      <VSCodeTextArea
        value={modelInfo.description}
        placeholder="Model Description"
        onChange={handleInputChange('description')}
      />
    </div>
  );
};

export default ModelInfoView; 