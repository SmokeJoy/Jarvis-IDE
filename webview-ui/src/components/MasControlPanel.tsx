import React, { useState, useEffect } from 'react';
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { CoderAgentPrompt } from './CoderAgentPrompt';
import { AgentActivityMonitor } from './AgentActivityMonitor';
import { AgentConfigurationPanel } from './AgentConfigurationPanel';
import { MasCommunicationService } from '../services/MasCommunicationService';
import { AgentStatus, TaskQueueState } from '../types/mas-types';
import { MasTaskQueueView } from './MasTaskQueueView';
import './MasControlPanel.css';

/**
 * Pannello di controllo principale per il sistema Multi-Agent di Jarvis-IDE
 */
export const MasControlPanel: React.FC = () => {
  const [agentsStatus, setAgentsStatus] = useState<AgentStatus[]>([]);
  const [taskQueue, setTaskQueue] = useState<TaskQueueState>({
    pendingTasks: [],
    completedTasks: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const masService = MasCommunicationService.getInstance();
  
  // Carica i dati iniziali e configura i listener
  useEffect(() => {
    // Gestori per gli aggiornamenti dallo stato degli agenti
    const handleAgentsStatusUpdate = (data: AgentStatus[]) => {
      setAgentsStatus(data);
      setIsLoading(false);
    };
    
    // Gestori per gli aggiornamenti della coda dei task
    const handleTaskQueueUpdate = (data: TaskQueueState) => {
      setTaskQueue(data);
      setIsLoading(false);
    };
    
    // Sottoscrizione agli eventi
    masService.subscribe('agentsStatusUpdate', handleAgentsStatusUpdate);
    masService.subscribe('taskQueueUpdate', handleTaskQueueUpdate);
    
    // Richiedi lo stato iniziale
    setIsLoading(true);
    masService.requestAgentsStatus();
    masService.requestTaskQueueStatus();
    
    // Imposta un intervallo per aggiornare lo stato periodicamente
    const intervalId = setInterval(() => {
      masService.requestAgentsStatus();
      masService.requestTaskQueueStatus();
    }, 5000); // Aggiorna ogni 5 secondi
    
    return () => {
      // Pulizia
      masService.unsubscribe('agentsStatusUpdate', handleAgentsStatusUpdate);
      masService.unsubscribe('taskQueueUpdate', handleTaskQueueUpdate);
      clearInterval(intervalId);
    };
  }, [masService]);
  
  // Trova lo stato del CoderAgent
  const coderAgent = agentsStatus.find(agent => agent.id === 'coder-agent');
  
  return (
    <div className="mas-control-panel">
      <header className="panel-header">
        <h2>Sistema Multi-Agent</h2>
        <div className="panel-status">
          {isLoading ? (
            <span className="loading-status">Caricamento...</span>
          ) : (
            <span className="agents-count">
              {agentsStatus.filter(agent => agent.isActive).length} agenti attivi
            </span>
          )}
        </div>
      </header>
      
      <VSCodeDivider />
      
      {/* Componente per inviare istruzioni al CoderAgent */}
      <CoderAgentPrompt 
        agentStatus={coderAgent}
        onInstructionSent={() => {
          // Aggiorna lo stato dopo l'invio di un'istruzione
          setTimeout(() => {
            masService.requestAgentsStatus();
            masService.requestTaskQueueStatus();
          }, 1000);
        }}
      />
      
      <VSCodeDivider />
      
      {/* Monitor di attività degli agenti */}
      <AgentActivityMonitor 
        agents={agentsStatus}
        isLoading={isLoading}
      />
      
      <VSCodeDivider />
      
      {/* Visualizzatore avanzato della coda di task */}
      <MasTaskQueueView
        initialAgents={agentsStatus}
        isLoading={isLoading}
      />
      
      <VSCodeDivider />
      
      {/* Configurazione degli agenti */}
      <AgentConfigurationPanel
        agents={agentsStatus}
        isLoading={isLoading}
      />
      
      <div className="panel-footer">
        <p className="footer-note">
          Sistema MAS di Jarvis-IDE - Versione 1.0
        </p>
      </div>
    </div>
  );
}; 