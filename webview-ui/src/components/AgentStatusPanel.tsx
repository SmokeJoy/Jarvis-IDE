import React from 'react';
import styled from 'styled-components';
import { useExtensionState } from '../context/ExtensionStateContext';
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react';

const Panel = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
  border-radius: 4px;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const PanelTitle = styled.h3`
  margin: 0;
  padding: 0;
`;

const AgentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 3px;
  background: var(--vscode-editor-inactiveSelectionBackground);
`;

const AgentName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AgentIcon = styled.span`
  font-size: 1.2rem;
`;

const AgentLabel = styled.span`
  font-weight: 500;
`;

const StatusIndicator = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.active ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconFailed)'};
`;

const StatusDot = styled.span<{ active: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconFailed)'};
`;

const StatusText = styled.span``;

const AgentDetails = styled.div`
  margin-top: 0.3rem;
  font-size: 0.85rem;
  padding-left: 1.7rem;
  opacity: 0.8;
`;

// Aggiungo un tipo per rappresentare lo stato operativo dell'agente
type AgentOperationalMode = 'autonomous' | 'semi-autonomous' | 'supervised';

interface AgentStatus {
  name: string;
  icon: string;
  active: boolean;
  mode: AgentOperationalMode;
  description: string;
  warningMessage?: string;
  dependsOn?: string[];
}

export const AgentStatusPanel: React.FC = () => {
  const { state } = useExtensionState();

  const coderMode = state.coder_mode ?? false;
  const multiAgent = state.multi_agent ?? false;
  const codeStyle = state.code_style ?? 'standard';
  const selectedModel = state.selectedModel ?? '';
  
  // Determina se il modello selezionato è un modello per codice
  const isCoderModel = selectedModel.toLowerCase().includes('gpt-4') || 
                      selectedModel.toLowerCase().includes('claude') ||
                      selectedModel.toLowerCase().includes('code') || 
                      selectedModel.toLowerCase().includes('starcoder') ||
                      selectedModel.toLowerCase().includes('mistral') ||
                      selectedModel.toLowerCase().includes('llama');

  // Definisco gli agenti con i loro stati e modalità operative
  const agents: AgentStatus[] = [
    {
      name: 'SupervisorAgent',
      icon: '🧪',
      active: coderMode || multiAgent,
      mode: 'autonomous',
      description: 'Coordina gli altri agenti e gestisce il flusso di lavoro complessivo',
    },
    {
      name: 'CoderAgent',
      icon: '🧠',
      active: coderMode,
      mode: 'supervised', // Modalità supervisionata - agisce solo su input del Supervisore
      description: 'Sviluppa codice su istruzioni esplicite del SupervisorAgent',
      warningMessage: !coderMode ? undefined : 'Opera solo su istruzioni del Supervisore',
      dependsOn: ['SupervisorAgent']
    },
    {
      name: 'MultiAgent',
      icon: '🤝',
      active: multiAgent,
      mode: 'semi-autonomous',
      description: 'Collaborazione tra agenti specializzati (pianificazione, coding, testing)',
      warningMessage: !coderMode ? 'Richiede CoderAgent attivo per funzionare' : undefined,
      dependsOn: ['CoderAgent']
    },
    {
      name: 'StyleAgent',
      icon: '🎨',
      active: true,
      mode: 'semi-autonomous',
      description: codeStyle === 'standard' ? 'Genera codice bilanciato tra leggibilità e concisione' :
                   codeStyle === 'concise' ? 'Genera codice compatto e minimale' :
                   'Genera codice ben commentato e documentato',
      warningMessage: !coderMode ? 'Limitato quando CoderAgent è inattivo' : undefined,
      dependsOn: ['CoderAgent']
    },
    {
      name: 'DocAgent',
      icon: '🔍',
      active: state.use_docs ?? false,
      mode: 'semi-autonomous',
      description: 'Utilizza la documentazione del progetto per risposte contestuali'
    }
  ];

  // Componente che visualizza un badge per la modalità operativa dell'agente
  const OperationModeBadge: React.FC<{ mode: AgentOperationalMode }> = ({ mode }) => {
    let color = '';
    let text = '';
    
    switch(mode) {
      case 'autonomous':
        color = 'var(--vscode-debugTokenExpression-name)';
        text = 'Autonomo';
        break;
      case 'semi-autonomous':
        color = 'var(--vscode-debugTokenExpression-value)';
        text = 'Semi-autonomo';
        break;
      case 'supervised':
        color = 'var(--vscode-debugIcon-breakpointCurrentStackframeForeground)';
        text = 'Supervisionato';
        break;
    }
    
    return (
      <span style={{ 
        fontSize: '0.65rem', 
        padding: '1px 5px', 
        borderRadius: '3px', 
        backgroundColor: color,
        color: 'var(--vscode-editor-background)',
        marginLeft: '0.5rem'
      }}>
        {text}
      </span>
    );
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Sistema Multi-Agente</PanelTitle>
        <StatusIndicator active={coderMode || multiAgent}>
          <StatusDot active={coderMode || multiAgent} />
          <StatusText>{coderMode || multiAgent ? 'Sistema attivo' : 'Sistema inattivo'}</StatusText>
        </StatusIndicator>
      </PanelHeader>
      
      <VSCodeDivider style={{ margin: '0.5rem 0 1rem 0' }} />
      
      <AgentsList>
        {agents.map((agent, index) => (
          <React.Fragment key={agent.name}>
            <StatusRow>
              <AgentName>
                <AgentIcon>{agent.icon}</AgentIcon>
                <AgentLabel>
                  {agent.name}
                  <OperationModeBadge mode={agent.mode} />
                </AgentLabel>
              </AgentName>
              <StatusIndicator active={agent.active}>
                <StatusDot active={agent.active} />
                <StatusText>
                  {agent.name === 'StyleAgent' ? `Stile: ${codeStyle}` : 
                   agent.active ? 'Attivo' : 'Inattivo'}
                </StatusText>
              </StatusIndicator>
            </StatusRow>
            
            <AgentDetails>
              {agent.description}
              {agent.warningMessage && (
                <div style={{ color: 'var(--vscode-errorForeground)', marginTop: '0.2rem' }}>
                  ⚠️ {agent.warningMessage}
                </div>
              )}
              {agent.dependsOn && agent.dependsOn.length > 0 && (
                <div style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>
                  Dipende da: {agent.dependsOn.join(', ')}
                </div>
              )}
            </AgentDetails>
            
            {index < agents.length - 1 && (
              <div style={{ margin: '0.3rem 0' }}></div>
            )}
          </React.Fragment>
        ))}
      </AgentsList>
    </Panel>
  );
}; 