import React from 'react';
import styled from 'styled-components';

const Link = styled.a`
  color: var(--vscode-textLink-foreground);
  text-decoration: none;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--vscode-textLink-activeForeground);
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface VSCodeLinkProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const VSCodeLink: React.FC<VSCodeLinkProps> = ({
  href,
  onClick,
  disabled = false,
  children
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={href || '#'}
      onClick={handleClick}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {children}
    </Link>
  );
}; 