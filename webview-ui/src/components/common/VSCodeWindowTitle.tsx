import React from 'react';
import styled from 'styled-components';

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

interface VSCodeWindowTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const VSCodeWindowTitle: React.FC<VSCodeWindowTitleProps> = ({
  children,
  className
}) => {
  return (
    <Title className={className}>
      {children}
    </Title>
  );
}; 