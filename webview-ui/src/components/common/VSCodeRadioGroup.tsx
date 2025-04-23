import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
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

const Radio = styled.input`
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--vscode-radio-border);
  border-radius: 50%;
  background-color: var(--vscode-radio-background);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &:checked {
    background-color: var(--vscode-radio-selectBackground);
    border-color: var(--vscode-radio-selectBorder);

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 4px;
      width: 6px;
      height: 6px;
      background-color: var(--vscode-radio-selectForeground);
      border-radius: 50%;
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

interface Option {
  value: string;
  label: string;
}

interface VSCodeRadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

export const VSCodeRadioGroup: React.FC<VSCodeRadioGroupProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  name = 'radio-group'
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.value);
  };

  return (
    <Container>
      {options.map(option => (
        <Label key={option.value}>
          <Radio
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={handleChange}
            disabled={disabled}
          />
          {option.label}
        </Label>
      ))}
    </Container>
  );
}; 