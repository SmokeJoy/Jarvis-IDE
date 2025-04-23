import React from 'react';
import styled from 'styled-components';

const TextArea = styled.textarea`
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  width: 100%;
  min-height: 100px;
  resize: vertical;

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

interface VSCodeTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string | undefined;
  disabled: boolean | undefined;
  rows: number | undefined;
}

export const VSCodeTextArea: React.FC<VSCodeTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 5
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <TextArea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
    />
  );
}; 