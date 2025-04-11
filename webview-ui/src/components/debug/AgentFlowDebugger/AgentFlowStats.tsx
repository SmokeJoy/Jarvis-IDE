import React, { useMemo } from 'react';
import { useAgentFlow } from '../../../context/AgentFlowContext';
import './styles.css';

/**
 * Componente che visualizza le statistiche del flusso degli agenti.
 */
const AgentFlowStats: React.FC = () => {
  const { flowData, loading } = useAgentFlow();
  
  // Calcola le statistiche in base ai dati disponibili
  const stats = useMemo(() => {
    if (!flowData || !flowData.agents || !flowData.interactions) {
      return {
        totalAgents: 0,
        agentsByStatus: {},
        totalInteractions: 0,
        interactionsByType: {},
        averageInteractionsPerAgent: 0,
        mostActiveAgent: null
      };
    }
    
    // Conteggio degli agenti per stato
    const agentsByStatus = flowData.agents.reduce((acc: Record<string, number>, agent) => {
      const status = agent.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Conteggio delle interazioni per tipo
    const interactionsByType = flowData.interactions.reduce((acc: Record<string, number>, interaction) => {
      const type = interaction.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Conteggio interazioni per agente
    const interactionsByAgent = flowData.interactions.reduce((acc: Record<string, number>, interaction) => {
      // Contiamo sia l'agente sorgente che target
      acc[interaction.sourceId] = (acc[interaction.sourceId] || 0) + 1;
      acc[interaction.targetId] = (acc[interaction.targetId] || 0) + 1;
      return acc;
    }, {});
    
    // Trova l'agente più attivo
    let mostActiveAgentId = null;
    let maxInteractions = 0;
    
    for (const [agentId, count] of Object.entries(interactionsByAgent)) {
      if (count > maxInteractions) {
        mostActiveAgentId = agentId;
        maxInteractions = count;
      }
    }
    
    const mostActiveAgent = mostActiveAgentId 
      ? flowData.agents.find(agent => agent.id === mostActiveAgentId) 
      : null;
    
    return {
      totalAgents: flowData.agents.length,
      agentsByStatus,
      totalInteractions: flowData.interactions.length,
      interactionsByType,
      averageInteractionsPerAgent: flowData.agents.length 
        ? Math.round((flowData.interactions.length / flowData.agents.length) * 10) / 10 
        : 0,
      mostActiveAgent
    };
  }, [flowData]);
  
  if (loading) {
    return (
      <div className="agentflowdebugger-stats-container">
        <h3>Statistiche</h3>
        <div className="agentflowdebugger-stats-loading">Caricamento statistiche...</div>
      </div>
    );
  }
  
  if (!flowData) {
    return (
      <div className="agentflowdebugger-stats-container">
        <h3>Statistiche</h3>
        <div className="agentflowdebugger-stats-empty">Nessun dato disponibile</div>
      </div>
    );
  }
  
  // Colori per i diversi stati degli agenti
  const statusColors: Record<string, string> = {
    active: '#03a9f4',
    waiting: '#ff9800',
    completed: '#4caf50',
    error: '#f44336',
    unknown: '#9e9e9e'
  };
  
  // Colori per i tipi di interazione
  const typeColors: Record<string, string> = {
    request: '#2196f3',
    response: '#4caf50',
    error: '#f44336',
    data: '#673ab7',
    unknown: '#9e9e9e'
  };

  return (
    <div className="agentflowdebugger-stats-container">
      <h3>Statistiche</h3>
      
      <div className="agentflowdebugger-stats">
        <div className="agentflowdebugger-stat-box">
          <h4>Totale Agenti</h4>
          <div className="agentflowdebugger-stat-value">{stats.totalAgents}</div>
          <div className="agentflowdebugger-stat-breakdown">
            {Object.entries(stats.agentsByStatus).map(([status, count]) => (
              <div key={status} className="agentflowdebugger-stat-item">
                <span 
                  className="agentflowdebugger-stat-color-dot" 
                  style={{ backgroundColor: statusColors[status] || statusColors.unknown }}
                />
                <span className="agentflowdebugger-stat-label">{status}</span>
                <span className="agentflowdebugger-stat-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="agentflowdebugger-stat-box">
          <h4>Totale Interazioni</h4>
          <div className="agentflowdebugger-stat-value">{stats.totalInteractions}</div>
          <div className="agentflowdebugger-stat-breakdown">
            {Object.entries(stats.interactionsByType).map(([type, count]) => (
              <div key={type} className="agentflowdebugger-stat-item">
                <span 
                  className="agentflowdebugger-stat-color-dot" 
                  style={{ backgroundColor: typeColors[type] || typeColors.unknown }}
                />
                <span className="agentflowdebugger-stat-label">{type}</span>
                <span className="agentflowdebugger-stat-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="agentflowdebugger-stat-box">
          <h4>Media Interazioni</h4>
          <div className="agentflowdebugger-stat-value">{stats.averageInteractionsPerAgent}</div>
          <div className="agentflowdebugger-stat-description">
            Interazioni medie per agente
          </div>
        </div>
        
        <div className="agentflowdebugger-stat-box">
          <h4>Agente Più Attivo</h4>
          <div className="agentflowdebugger-stat-value">
            {stats.mostActiveAgent ? stats.mostActiveAgent.name : 'N/A'}
          </div>
          {stats.mostActiveAgent && (
            <div className="agentflowdebugger-stat-description">
              Tipo: {stats.mostActiveAgent.type}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentFlowStats; 