/**
 * @file AgentPanel.tsx
 * @description Componente React principale per la gestione degli agenti nel sistema MAS
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { CoderAgentPrompt } from './CoderAgentPrompt';
import { AgentActivityMonitor } from './AgentActivityMonitor';
import { AgentConfigurationPanel } from './AgentConfigurationPanel';
import { MasTaskQueueView } from './MasTaskQueueView';
import { AgentStatus, TaskQueueState } from '../types/mas-types';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { 
  MasMessageType,
  GetAgentsStatusMessage,
  GetTaskQueueStatusMessage,
  AgentMessageUnion,
  AgentsStatusUpdateMessage,
  TaskQueueUpdateMessage
} from '@shared/messages';
import { 
  isAgentsStatusUpdateMessage, 
  isTaskQueueUpdateMessage,
  isAgentMessage
} from '../types/mas-message-guards';
import { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import './MasControlPanel.css';

/**
 * Componente principale per la gestione del sistema Multi-Agent di Jarvis-IDE
 * Utilizza il pattern Union Dispatcher Type-Safe per la comunicazione con l'estensione
 */
export const AgentPanel: React.FC = () => {
  // Stato locale
  const [agentsStatus, setAgentsStatus] = useState<AgentStatus[]>([]);
  const [taskQueue, setTaskQueue] = useState<TaskQueueState>({
    pendingTasks: [],
    completedTasks: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Hook type-safe per la comunicazione con l'estensione
  const { postMessage } = useExtensionMessage();
  
  /**
   * Dispatcher di messaggi type-safe per gestire i messaggi in arrivo
   * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
   * @param message Messaggio ricevuto dall'estensione
   */
  const messageDispatcher = useCallback((message: unknown): void => {
    // Verifica se è un messaggio dell'agente prima di elaborarlo ulteriormente
    if (!isAgentMessage(message)) {
      return;
    }
    
    // Implementazione del pattern Union Dispatcher Type-Safe
    if (isAgentsStatusUpdateMessage(message)) {
      setAgentsStatus((msg.payload as unknown));
      setIsLoading(false);
    }
    else if (isTaskQueueUpdateMessage(message)) {
      setTaskQueue((msg.payload as unknown));
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Richiede lo stato attuale di tutti gli agenti
   */
  const requestAgentsStatus = useCallback((): void => {
    const message: GetAgentsStatusMessage = {
      type: MasMessageType.GET_AGENTS_STATUS
    };
    postMessage<AgentMessageUnion>(message);
  }, [postMessage]);
  
  /**
   * Richiede lo stato attuale della coda dei task
   */
  const requestTaskQueueStatus = useCallback((): void => {
    const message: GetTaskQueueStatusMessage = {
      type: MasMessageType.GET_TASK_QUEUE_STATUS
    };
    postMessage<AgentMessageUnion>(message);
  }, [postMessage]);
  
  // Carica i dati iniziali e configura i listener
  useEffect(() => {
    // Inizializza lo stato
    setIsLoading(true);
    
    // Richiedi lo stato iniziale
    requestAgentsStatus();
    requestTaskQueueStatus();
    
    // Imposta un intervallo per aggiornare lo stato periodicamente
    const intervalId = setInterval(() => {
      requestAgentsStatus();
      requestTaskQueueStatus();
    }, 5000); // Aggiorna ogni 5 secondi
    
    // Configurazione del listener per i messaggi dall'estensione
    const handleMessage = (event: MessageEvent): void => {
      const message = event.data;
      messageDispatcher(message);
    };
    
    // Aggiungi event listener
    window.addEventListener('message', handleMessage);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('message', handleMessage);
    };
  }, [requestAgentsStatus, requestTaskQueueStatus, messageDispatcher]);
  
  // Trova lo stato del CoderAgent
  const coderAgent = agentsStatus.find(agent => agent.id === 'coder-agent');
  
  /**
   * Handler per l'aggiornamento dello stato dopo l'invio di un'istruzione
   */
  const handleInstructionSent = useCallback((): void => {
    // Aggiorna lo stato dopo l'invio di un'istruzione
    setTimeout(() => {
      requestAgentsStatus();
      requestTaskQueueStatus();
    }, 1000);
  }, [requestAgentsStatus, requestTaskQueueStatus]);
  
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
        onInstructionSent={handleInstructionSent}
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
          Sistema MAS di Jarvis-IDE - Versione 3.0
        </p>
      </div>
    </div>
  );
}; 