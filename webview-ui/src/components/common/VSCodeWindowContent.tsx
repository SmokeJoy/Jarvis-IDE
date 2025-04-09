import React from 'react';
import styled from 'styled-components';

const Content = styled.div`
  padding: 1rem;
  color: var(--vscode-window-foreground);
  font-family: var(--vscode-font-family);
  font-size: 14px;
  line-height: 1.5;
`;

interface VSCodeWindowContentProps {
  children: React.ReactNode;
  className?: string;
}

export const VSCodeWindowContent: React.FC<VSCodeWindowContentProps> = ({
  children,
  className
}) => {
  return (
    <Content className={className}>
      {children}
    </Content>
  );
}; 