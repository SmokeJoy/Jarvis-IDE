import React from 'react';
import styled from 'styled-components';

const Button = styled.button<{ appearance?: 'primary' | 'secondary' }>`
  background-color: ${props => 
    props.appearance === 'primary' 
      ? 'var(--vscode-button-background)' 
      : 'var(--vscode-button-secondaryBackground)'};
  color: ${props => 
    props.appearance === 'primary' 
      ? 'var(--vscode-button-foreground)' 
      : 'var(--vscode-button-secondaryForeground)'};
  border: 1px solid ${props => 
    props.appearance === 'primary' 
      ? 'var(--vscode-button-border)' 
      : 'var(--vscode-button-secondaryBorder)'};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => 
      props.appearance === 'primary' 
        ? 'var(--vscode-button-hoverBackground)' 
        : 'var(--vscode-button-secondaryHoverBackground)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface VSCodeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  appearance?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const VSCodeButton: React.FC<VSCodeButtonProps> = ({
  onClick,
  disabled = false,
  appearance = 'primary',
  children
}) => {
  return (
    <Button onClick={onClick} disabled={disabled} appearance={appearance}>
      {children}
    </Button>
  );
}; 