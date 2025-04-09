import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: var(--vscode-window-headerForeground);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--vscode-window-headerHoverBackground);
  }

  &:active {
    background-color: var(--vscode-window-headerActiveBackground);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface VSCodeWindowMaximizeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const VSCodeWindowMaximizeButton: React.FC<VSCodeWindowMaximizeButtonProps> = ({
  onClick,
  disabled = false,
  className
}) => {
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      □
    </Button>
  );
}; 