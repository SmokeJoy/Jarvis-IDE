import React from 'react';
import styled from 'styled-components';

const Input = styled.input`
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  width: 100%;

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

interface VSCodeTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}

export const VSCodeTextField: React.FC<VSCodeTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text'
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}; 