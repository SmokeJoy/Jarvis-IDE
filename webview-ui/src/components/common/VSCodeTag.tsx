import React from 'react';
import styled from 'styled-components';

const Tag = styled.span<{ variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: var(--vscode-font-family);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: var(--vscode-tag-background);
          color: var(--vscode-tag-foreground);
        `;
      case 'secondary':
        return `
          background-color: var(--vscode-tag-secondaryBackground);
          color: var(--vscode-tag-secondaryForeground);
        `;
      case 'success':
        return `
          background-color: var(--vscode-testing-iconPassed);
          color: var(--vscode-editor-foreground);
        `;
      case 'warning':
        return `
          background-color: var(--vscode-testing-iconQueued);
          color: var(--vscode-editor-foreground);
        `;
      case 'error':
        return `
          background-color: var(--vscode-testing-iconFailed);
          color: var(--vscode-editor-foreground);
        `;
      default:
        return `
          background-color: var(--vscode-tag-background);
          color: var(--vscode-tag-foreground);
        `;
    }
  }}
`;

interface VSCodeTagProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export const VSCodeTag: React.FC<VSCodeTagProps> = ({
  variant = 'primary',
  children
}) => {
  return <Tag variant={variant}>{children}</Tag>;
}; 