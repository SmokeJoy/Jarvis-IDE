/**
 * @file AgentTogglePanel.tsx
 * @description Componente per abilitare/disabilitare agenti tramite toggle switch
 * @version 1.0.0
 * @added M9-S4
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AgentStatus } from '../types/mas-types';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MasMessageType, AgentToggleEnableMessage, AgentsStatusUpdateMessage } from '@shared/messages';
import { isAgentMessage, isAgentsStatusUpdateMessage } from '../types/mas-message-guards';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding-bottom: 0.5rem;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: var(--vscode-editor-foreground);
`;

const AgentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AgentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 3px;
  background-color: var(--vscode-input-background);
  
  &:hover {
    background-color: var(--vscode-list-hoverBackground);
  }
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AgentIcon = styled.span`
  font-size: 1.2rem;
`;

const AgentName = styled.span`
  font-size: 0.9rem;
  color: var(--vscode-editor-foreground);
`;

const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$active ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconFailed)'};
  margin-right: 0.5rem;
`;

const ToggleContainer = styled.div<{ $isLocked?: boolean }>`
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background-color: var(--vscode-checkbox-background);
  cursor: ${props => props.$isLocked ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  opacity: ${props => props.$isLocked ? 0.5 : 1};
`;

const ToggleHandle = styled.div<{ $enabled: boolean }>`
  position: absolute;
  top: 2px;
  left: ${props => props.$enabled ? '18px' : '2px'};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.$enabled 
    ? 'var(--vscode-button-background)' 
    : 'var(--vscode-disabledForeground)'};
  transition: left 0.2s, background-color 0.2s;
`;

const ToggleTrack = styled.div<{ $enabled: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  background-color: ${props => props.$enabled 
    ? 'var(--vscode-checkbox-selectBackground)' 
    : 'var(--vscode-checkbox-border)'};
  opacity: ${props => props.$enabled ? 0.7 : 0.3};
  transition: background-color 0.2s, opacity 0.2s;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--vscode-descriptionForeground);
  text-align: center;
`;

// Aggiunto componente per visualizzare un tooltip sul blocco dell'agente
const LockedBadge = styled.span`
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  background-color: var(--vscode-editorWarning-background);
  color: var(--vscode-editorWarning-foreground);
  margin-left: 0.5rem;
`;

interface AgentTogglePanelProps {
  initialAgents?: AgentStatus[];
}

/**
 * Componente che visualizza un pannello con toggle switch per abilitare/disabilitare agenti
 */
export const AgentTogglePanel: React.FC<AgentTogglePanelProps> = ({ initialAgents = [] }) => {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const { postMessage } = useExtensionMessage();

  // Richiedi lo stato degli agenti all'avvio se non fornito
  useEffect(() => {
    if (initialAgents.length === 0) {
      postMessage({
        type: MasMessageType.GET_AGENTS_STATUS
      });
    }
  }, [initialAgents, postMessage]);

  // Gestione dei messaggi dall'estensione
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      // Verifica se è un messaggio MAS
      if (!isAgentMessage(message)) {
        return;
      }
      
      // Aggiorna lo stato degli agenti se ricevi un aggiornamento
      if (isAgentsStatusUpdateMessage(message)) {
        setAgents((msg.payload as unknown));
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Funzione per attivare/disattivare un agente
  const handleToggleAgent = useCallback((agentId: string, enabled: boolean) => {
    // Trova l'agente selezionato
    const agent = agents.find(a => a.id === agentId);
    
    // Se l'agente è bloccato (locked), non fare nulla
    if (agent?.locked) {
      return;
    }
    
    // Aggiorna localmente per UI reattiva
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, enabled } : agent
    ));
    
    // Invia messaggio al MAS dispatcher
    const toggleMessage: AgentToggleEnableMessage = {
      type: MasMessageType.AGENT_TOGGLE_ENABLE,
      payload: {
        agentId,
        enabled
      }
    };
    
    postMessage<AgentToggleEnableMessage>(toggleMessage);
  }, [agents, postMessage]);

  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Gestione Agenti</PanelTitle>
      </PanelHeader>
      
      {agents.length === 0 ? (
        <EmptyState>
          <span>Nessun agente disponibile</span>
        </EmptyState>
      ) : (
        <AgentList>
          {agents.map(agent => {
            const isLocked = !!agent.locked;
            
            return (
              <AgentItem key={agent.id}>
                <AgentInfo>
                  <StatusIndicator $active={agent.isActive} />
                  <AgentIcon>{agent.name.charAt(0).toUpperCase()}</AgentIcon>
                  <AgentName>{agent.name}</AgentName>
                  {isLocked && <LockedBadge>Bloccato</LockedBadge>}
                </AgentInfo>
                
                <ToggleContainer 
                  onClick={() => !isLocked && handleToggleAgent(agent.id, !agent.enabled)}
                  role="switch"
                  aria-checked={agent.enabled}
                  aria-disabled={isLocked}
                  $isLocked={isLocked}
                  tabIndex={isLocked ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleToggleAgent(agent.id, !agent.enabled);
                    }
                  }}
                >
                  <ToggleTrack $enabled={agent.enabled} />
                  <ToggleHandle $enabled={agent.enabled} />
                </ToggleContainer>
              </AgentItem>
            );
          })}
        </AgentList>
      )}
    </PanelContainer>
  );
};

export default AgentTogglePanel; 