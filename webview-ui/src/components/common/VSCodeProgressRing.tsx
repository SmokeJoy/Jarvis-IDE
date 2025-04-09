import React from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

const Ring = styled.div<{ size?: number; thickness?: number }>`
  position: relative;
  width: ${props => props.size || 16}px;
  height: ${props => props.size || 16}px;
  border: ${props => props.thickness || 2}px solid var(--vscode-progressBar-background);
  border-radius: 50%;
  border-top-color: var(--vscode-progressBar-foreground);
  animation: ${rotate} 1s linear infinite;
`;

interface VSCodeProgressRingProps {
  size?: number;
  thickness?: number;
}

export const VSCodeProgressRing: React.FC<VSCodeProgressRingProps> = ({
  size,
  thickness
}) => {
  return (
    <Container>
      <Ring size={size} thickness={thickness} />
    </Container>
  );
}; 