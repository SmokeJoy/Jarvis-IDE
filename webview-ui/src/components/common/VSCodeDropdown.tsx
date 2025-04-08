import React from 'react';
import styled from 'styled-components';

const Select = styled.select`
  background-color: var(--vscode-dropdown-background);
  color: var(--vscode-dropdown-foreground);
  border: 1px solid var(--vscode-dropdown-border);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  cursor: pointer;
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface VSCodeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const VSCodeDropdown: React.FC<VSCodeDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  children
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <Select value={value} onChange={handleChange} disabled={disabled}>
      {children}
    </Select>
  );
}; 