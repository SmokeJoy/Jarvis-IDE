import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div<{ visible: boolean; position: 'top' | 'bottom' | 'left' | 'right' }>`
  position: absolute;
  background-color: var(--vscode-tooltip-background);
  color: var(--vscode-tooltip-foreground);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: var(--vscode-font-family);
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;

  ${props => {
    switch (props.position) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
        `;
      case 'bottom':
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
        `;
      case 'left':
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
        `;
      case 'right':
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
        `;
      default:
        return '';
    }
  }}

  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 4px solid transparent;

    ${props => {
      switch (props.position) {
        case 'top':
          return `
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-top-color: var(--vscode-tooltip-background);
          `;
        case 'bottom':
          return `
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-bottom-color: var(--vscode-tooltip-background);
          `;
        case 'left':
          return `
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-left-color: var(--vscode-tooltip-background);
          `;
        case 'right':
          return `
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-right-color: var(--vscode-tooltip-background);
          `;
        default:
          return '';
      }
    }}
  }
`;

interface VSCodeTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const VSCodeTooltip: React.FC<VSCodeTooltipProps> = ({
  content,
  position = 'top',
  children
}) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 100);
  };

  return (
    <TooltipContainer
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <TooltipContent visible={visible} position={position}>
        {content}
      </TooltipContent>
    </TooltipContainer>
  );
}; 