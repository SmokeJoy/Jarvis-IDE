import React from 'react';
import styled from 'styled-components';

const Window = styled.div<{ variant?: 'default' | 'secondary' }>`
  background-color: ${props => 
    props.variant === 'secondary' 
      ? 'var(--vscode-window-secondaryBackground)' 
      : 'var(--vscode-window-background)'};
  border: 1px solid var(--vscode-window-border);
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  color: var(--vscode-window-foreground);
`;

const WindowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: var(--vscode-window-headerBackground);
  border-bottom: 1px solid var(--vscode-window-border);
`;

const WindowTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--vscode-window-headerForeground);
`;

const WindowContent = styled.div`
  padding: 1rem;
`;

interface VSCodeWindowProps {
  title: string;
  variant?: 'default' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export const VSCodeWindow: React.FC<VSCodeWindowProps> = ({
  title,
  variant = 'default',
  children,
  className
}) => {
  return (
    <Window variant={variant} className={className}>
      <WindowHeader>
        <WindowTitle>{title}</WindowTitle>
      </WindowHeader>
      <WindowContent>
        {children}
      </WindowContent>
    </Window>
  );
}; 