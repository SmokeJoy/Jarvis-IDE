import React, { useMemo } from 'react';
import { useAgentFlowContext } from '../../../context/AgentFlowContext';
import './styles.css';

/**
 * Componente che mostra un riepilogo statistico del flusso degli agenti
 * Include conteggi di agenti per stato, interazioni per tipo e tempo di esecuzione
 */
export const AgentFlowSummary: React.FC = () => {
  const { flowData, isLoading } = useAgentFlowContext();

  const statistics = useMemo(() => {
    if (!flowData || !flowData.agents || !flowData.interactions) {
      return null;
    }

    // Conteggio agenti per stato
    const agentsByStatus = flowData.agents.reduce((acc, agent) => {
      const status = agent.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Conteggio interazioni per tipo
    const interactionsByType = flowData.interactions.reduce((acc, interaction) => {
      const type = interaction.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcolo tempo di esecuzione in secondi
    const executionTimeInSeconds = flowData.executionTime 
      ? Math.round(flowData.executionTime / 1000 * 10) / 10
      : null;

    return {
      totalAgents: flowData.agents.length,
      agentsByStatus,
      totalInteractions: flowData.interactions.length,
      interactionsByType,
      executionTimeInSeconds
    };
  }, [flowData]);

  if (isLoading) {
    return (
      <div className="agentflowdebugger-summary-container">
        <h3>Riepilogo</h3>
        <div className="agentflowdebugger-summary-loading">Caricamento...</div>
      </div>
    );
  }

  if (!flowData || !statistics) {
    return (
      <div className="agentflowdebugger-summary-container">
        <h3>Riepilogo</h3>
        <div className="agentflowdebugger-summary-empty">Nessun dato disponibile</div>
      </div>
    );
  }

  return (
    <div className="agentflowdebugger-summary-container">
      <h3>Riepilogo</h3>
      
      <div className="agentflowdebugger-summary-section">
        <h4>Agenti</h4>
        <div className="agentflowdebugger-summary-row">
          <span className="agentflowdebugger-summary-label">Totale Agenti:</span>
          <span className="agentflowdebugger-summary-value">{statistics.totalAgents}</span>
        </div>
        
        {Object.entries(statistics.agentsByStatus).map(([status, count]) => (
          <div key={status} className="agentflowdebugger-summary-row">
            <span className="agentflowdebugger-summary-label">
              {status === 'active' ? 'Attivi' : 
               status === 'completed' ? 'Completati' : 
               status === 'error' ? 'In errore' : 
               status}:
            </span>
            <span className="agentflowdebugger-summary-value">{count}</span>
          </div>
        ))}
      </div>
      
      <div className="agentflowdebugger-summary-section">
        <h4>Interazioni</h4>
        <div className="agentflowdebugger-summary-row">
          <span className="agentflowdebugger-summary-label">Totale Interazioni:</span>
          <span className="agentflowdebugger-summary-value">{statistics.totalInteractions}</span>
        </div>
        
        {Object.entries(statistics.interactionsByType).map(([type, count]) => (
          <div key={type} className="agentflowdebugger-summary-row">
            <span className="agentflowdebugger-summary-label">
              {type === 'message' ? 'Messaggi' : 
               type === 'request' ? 'Richieste' : 
               type === 'response' ? 'Risposte' : 
               type}:
            </span>
            <span className="agentflowdebugger-summary-value">{count}</span>
          </div>
        ))}
      </div>
      
      {statistics.executionTimeInSeconds !== null && (
        <div className="agentflowdebugger-summary-section">
          <h4>Performance</h4>
          <div className="agentflowdebugger-summary-row">
            <span className="agentflowdebugger-summary-label">Tempo di esecuzione:</span>
            <span className="agentflowdebugger-summary-value">
              {statistics.executionTimeInSeconds}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 