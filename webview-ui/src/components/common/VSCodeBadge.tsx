import React from 'react';
import styled from 'styled-components';

const Badge = styled.span<{ variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' }>`
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
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
        `;
      case 'secondary':
        return `
          background-color: var(--vscode-badge-secondaryBackground);
          color: var(--vscode-badge-secondaryForeground);
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
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
        `;
    }
  }}
`;

interface VSCodeBadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export const VSCodeBadge: React.FC<VSCodeBadgeProps> = ({
  variant = 'primary',
  children
}) => {
  return <Badge variant={variant}>{children}</Badge>;
}; 