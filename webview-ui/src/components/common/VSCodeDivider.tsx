import React from 'react';
import styled from 'styled-components';

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--vscode-panel-border);
  margin: 1rem 0;
  width: 100%;
`;

interface VSCodeDividerProps {
  className?: string;
}

export const VSCodeDivider: React.FC<VSCodeDividerProps> = ({ className }) => {
  return <Divider className={className} />;
}; 