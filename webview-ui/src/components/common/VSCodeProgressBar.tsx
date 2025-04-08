import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--vscode-progressBar-background);
  border-radius: 2px;
  overflow: hidden;
`;

const Bar = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: var(--vscode-progressBar-foreground);
  border-radius: 2px;
  transition: width 0.2s ease;
`;

interface VSCodeProgressBarProps {
  progress: number;
  className?: string;
}

export const VSCodeProgressBar: React.FC<VSCodeProgressBarProps> = ({
  progress,
  className
}) => {
  return (
    <Container className={className}>
      <Bar progress={Math.min(Math.max(progress, 0), 100)} />
    </Container>
  );
}; 