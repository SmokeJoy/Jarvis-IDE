import React from 'react';
import styled from 'styled-components';

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  color: var(--vscode-editor-foreground);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxInput = styled.input`
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--vscode-checkbox-border);
  border-radius: 3px;
  background-color: var(--vscode-checkbox-background);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &:checked {
    background-color: var(--vscode-checkbox-selectBackground);
    border-color: var(--vscode-checkbox-selectBorder);

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid var(--vscode-checkbox-selectForeground);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

interface VSCodeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const VSCodeCheckbox: React.FC<VSCodeCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  children
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <CheckboxContainer>
      <CheckboxInput
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      {children}
    </CheckboxContainer>
  );
}; 