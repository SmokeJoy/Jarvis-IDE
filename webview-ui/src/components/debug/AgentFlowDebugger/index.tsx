import React from 'react';
import { AgentFlowProvider } from '../../../context/AgentFlowContext';
import AgentControls from './AgentControls';
import AgentFlowDiagram from './AgentFlowDiagram';
import AgentFlowStats from './AgentFlowStats';
import './styles.css';

export interface AgentFlowDebuggerProps {
  sessionId?: string;
  apiEndpoint?: string;
  initialFlowData?: any;
  darkMode?: boolean;
  autoRefresh?: boolean;
  title?: string;
}

/**
 * Componente principale per il debugging dei flussi di agenti.
 * Fornisce un'interfaccia visiva per visualizzare e analizzare 
 * le interazioni tra agenti in un sistema multi-agente.
 */
const AgentFlowDebugger: React.FC<AgentFlowDebuggerProps> = ({
  sessionId,
  apiEndpoint,
  initialFlowData,
  darkMode = false,
  autoRefresh = false,
  title = 'Visualizzatore Flusso Agenti'
}) => {
  return (
    <AgentFlowProvider
      sessionId={sessionId}
      apiEndpoint={apiEndpoint}
      initialData={initialFlowData}
      autoRefresh={autoRefresh}
    >
      <div className={`agentflowdebugger-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="agentflowdebugger-header">
          <h2>{title}</h2>
          {sessionId && (
            <div className="agentflowdebugger-session-info">
              ID Sessione: <code>{sessionId}</code>
            </div>
          )}
        </div>
        
        <AgentControls />
        
        <AgentFlowStats />
        
        <div className="agentflowdebugger-diagram-section">
          <AgentFlowDiagram />
        </div>
      </div>
    </AgentFlowProvider>
  );
};

export default AgentFlowDebugger; 