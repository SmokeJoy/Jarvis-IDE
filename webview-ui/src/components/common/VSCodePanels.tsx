import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => 
    props.active 
      ? 'var(--vscode-tab-activeBorder)' 
      : 'transparent'};
  color: ${props => 
    props.active 
      ? 'var(--vscode-tab-activeForeground)' 
      : 'var(--vscode-tab-inactiveForeground)'};
  font-family: var(--vscode-font-family);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--vscode-tab-activeForeground);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Panel = styled.div`
  padding: 1rem;
`;

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface VSCodePanelsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export const VSCodePanels: React.FC<VSCodePanelsProps> = ({
  tabs,
  defaultTab,
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <Container className={className}>
      <TabList>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map(tab => (
        <Panel key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
          {tab.content}
        </Panel>
      ))}
    </Container>
  );
}; 