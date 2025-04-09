import React from 'react';
import styled from 'styled-components';

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--vscode-window-headerBackground);
  border-top: 1px solid var(--vscode-window-border);
`;

interface VSCodeWindowActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const VSCodeWindowActions: React.FC<VSCodeWindowActionsProps> = ({
  children,
  className
}) => {
  return (
    <Actions className={className}>
      {children}
    </Actions>
  );
}; 