import React from 'react';
import styled from 'styled-components';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const TextArea = styled.textarea`
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  padding: 12px;
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 14px;
  width: 100%;
  min-height: 200px;
  resize: vertical;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const Description = styled.p`
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  margin: 0;
  line-height: 1.4;
`;

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  label = 'Prompt di contesto (contextPrompt)',
  placeholder = '// Inserisci qui le istruzioni di contesto per il modello...',
  description = 'Questo contesto viene inviato al modello come parte della richiesta. Può contenere istruzioni specifiche sul comportamento, formattazione o altre indicazioni.',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <EditorContainer>
      <Label htmlFor="contextPrompt">{label}</Label>
      {description && <Description>{description}</Description>}
      <TextArea
        id="contextPrompt"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </EditorContainer>
  );
};
