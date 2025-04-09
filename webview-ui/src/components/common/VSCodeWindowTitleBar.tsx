import React from 'react';
import styled from 'styled-components';

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: var(--vscode-window-headerBackground);
  border-bottom: 1px solid var(--vscode-window-border);
  user-select: none;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--vscode-window-headerForeground);
  font-family: var(--vscode-font-family);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

interface VSCodeWindowTitleBarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const VSCodeWindowTitleBar: React.FC<VSCodeWindowTitleBarProps> = ({
  title,
  children,
  className
}) => {
  return (
    <TitleBar className={className}>
      <Title>{title}</Title>
      {children && <Actions>{children}</Actions>}
    </TitleBar>
  );
}; 