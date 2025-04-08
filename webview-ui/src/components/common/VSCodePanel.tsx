import React from 'react';
import styled from 'styled-components';

const Panel = styled.div<{ variant?: 'default' | 'secondary' }>`
  background-color: ${props => 
    props.variant === 'secondary' 
      ? 'var(--vscode-panel-secondaryBackground)' 
      : 'var(--vscode-panel-background)'};
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 1rem;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  color: var(--vscode-panel-foreground);
`;

interface VSCodePanelProps {
  variant?: 'default' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export const VSCodePanel: React.FC<VSCodePanelProps> = ({
  variant = 'default',
  children,
  className
}) => {
  return (
    <Panel variant={variant} className={className}>
      {children}
    </Panel>
  );
}; 