import React from 'react';
import { useAgentFlow } from '../../../context/AgentFlowContext';
import './styles.css';

/**
 * Componente che visualizza l'intestazione del debugger con informazioni sulla sessione.
 */
const AgentFlowHeader: React.FC = () => {
  const { flowData, loading, lastUpdated } = useAgentFlow();
  
  // Formatta la data dell'ultimo aggiornamento
  const formattedLastUpdated = lastUpdated 
    ? new Intl.DateTimeFormat('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).format(lastUpdated)
    : null;
  
  // Calcola il tempo trascorso dall'inizio della sessione
  const calculateDuration = () => {
    if (!flowData?.startedAt) return 'N/A';
    
    const start = new Date(flowData.startedAt).getTime();
    const end = flowData.endedAt 
      ? new Date(flowData.endedAt).getTime() 
      : Date.now();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Status badge style
  const getStatusBadgeStyle = () => {
    if (!flowData) return 'agentflowdebugger-status-unknown';
    
    switch(flowData.status) {
      case 'active':
        return 'agentflowdebugger-status-active';
      case 'completed':
        return 'agentflowdebugger-status-completed';
      case 'error':
        return 'agentflowdebugger-status-error';
      default:
        return 'agentflowdebugger-status-unknown';
    }
  };

  return (
    <div className="agentflowdebugger-header">
      <div className="agentflowdebugger-header-top">
        <h2>
          {flowData?.name || 'Debugger Flusso Agenti'}
          {flowData && (
            <span className={`agentflowdebugger-status-badge ${getStatusBadgeStyle()}`}>
              {flowData.status}
            </span>
          )}
        </h2>
        
        {lastUpdated && (
          <div className="agentflowdebugger-last-updated">
            Ultimo aggiornamento: {formattedLastUpdated}
          </div>
        )}
      </div>
      
      {flowData && (
        <div className="agentflowdebugger-header-details">
          <div className="agentflowdebugger-detail">
            <span className="agentflowdebugger-detail-label">ID:</span>
            <span className="agentflowdebugger-detail-value">{flowData.id}</span>
          </div>
          
          <div className="agentflowdebugger-detail">
            <span className="agentflowdebugger-detail-label">Inizio:</span>
            <span className="agentflowdebugger-detail-value">
              {new Date(flowData.startedAt).toLocaleString('it-IT')}
            </span>
          </div>
          
          {flowData.endedAt && (
            <div className="agentflowdebugger-detail">
              <span className="agentflowdebugger-detail-label">Fine:</span>
              <span className="agentflowdebugger-detail-value">
                {new Date(flowData.endedAt).toLocaleString('it-IT')}
              </span>
            </div>
          )}
          
          <div className="agentflowdebugger-detail">
            <span className="agentflowdebugger-detail-label">Durata:</span>
            <span className="agentflowdebugger-detail-value">{calculateDuration()}</span>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="agentflowdebugger-loading-indicator">Caricamento...</div>
      )}
    </div>
  );
};

export default AgentFlowHeader; 