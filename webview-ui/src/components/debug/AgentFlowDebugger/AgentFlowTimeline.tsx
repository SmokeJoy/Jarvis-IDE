import React, { useMemo } from 'react';
import { useAgentFlow } from '../../../context/AgentFlowContext';
import './styles.css';

interface AgentFlowTimelineProps {
  filters: {
    search: string;
    status: string[];
    interactionType: string[];
    timeRange: [number, number] | null;
    zoom: number;
  };
}

/**
 * Componente che visualizza una timeline cronologica delle interazioni tra agenti.
 */
const AgentFlowTimeline: React.FC<AgentFlowTimelineProps> = ({ filters }) => {
  const { flowData, loading } = useAgentFlow();

  // Filtra e ordina le interazioni in base ai filtri e al timestamp
  const timelineEvents = useMemo(() => {
    if (!flowData || !flowData.interactions || !flowData.agents) return [];

    // Prima filtra le interazioni in base ai filtri applicati
    const filteredInteractions = flowData.interactions.filter(interaction => {
      // Filtra per tipo di interazione
      const matchesType = filters.interactionType.length === 0 ||
        filters.interactionType.includes(interaction.type);

      // Filtra per ricerca nel contenuto o etichetta
      const matchesSearch = !filters.search ||
        (interaction.content && interaction.content.toLowerCase().includes(filters.search.toLowerCase())) ||
        (interaction.label && interaction.label.toLowerCase().includes(filters.search.toLowerCase()));

      // Filtra per range temporale se specificato
      const matchesTimeRange = !filters.timeRange ||
        (new Date(interaction.timestamp).getTime() >= filters.timeRange[0] &&
         new Date(interaction.timestamp).getTime() <= filters.timeRange[1]);

      // Verifica se gli agenti coinvolti corrispondono ai filtri di stato
      const sourceAgent = flowData.agents.find(agent => agent.id === interaction.sourceId);
      const targetAgent = flowData.agents.find(agent => agent.id === interaction.targetId);

      const matchesAgentStatus = filters.status.length === 0 ||
        (sourceAgent && filters.status.includes(sourceAgent.status)) ||
        (targetAgent && filters.status.includes(targetAgent.status));

      return matchesType && matchesSearch && matchesTimeRange && matchesAgentStatus;
    });

    // Ordina le interazioni per timestamp
    return [...filteredInteractions].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [flowData, filters]);

  const formatTime = (timestamp: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  };

  // Calcola il tempo relativo tra due interazioni
  const calculateRelativeTime = (currentTime: string, previousTime: string | null) => {
    if (!previousTime) return null;

    const currentMs = new Date(currentTime).getTime();
    const previousMs = new Date(previousTime).getTime();
    const diffMs = currentMs - previousMs;

    if (diffMs < 1000) {
      return `+${diffMs}ms`;
    } else if (diffMs < 60000) {
      return `+${Math.floor(diffMs / 1000)}s`;
    } else {
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      return `+${minutes}m ${seconds}s`;
    }
  };

  // Ottieni il colore in base al tipo di interazione
  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return '#2196f3';
      case 'response':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'data':
        return '#673ab7';
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <div className="agentflowdebugger-timeline-container">
        <h3>Cronologia</h3>
        <div className="agentflowdebugger-timeline-loading">
          Caricamento cronologia...
        </div>
      </div>
    );
  }

  if (!flowData || !timelineEvents.length) {
    return (
      <div className="agentflowdebugger-timeline-container">
        <h3>Cronologia</h3>
        <div className="agentflowdebugger-timeline-empty">
          Nessuna interazione disponibile o conforme ai filtri.
        </div>
      </div>
    );
  }

  return (
    <div className="agentflowdebugger-timeline-container">
      <h3>Cronologia</h3>
      
      <div className="agentflowdebugger-timeline">
        {timelineEvents.map((interaction, index) => {
          const sourceAgent = flowData.agents.find(agent => agent.id === interaction.sourceId);
          const targetAgent = flowData.agents.find(agent => agent.id === interaction.targetId);
          const previousTimestamp = index > 0 ? timelineEvents[index - 1].timestamp : null;
          const relativeTime = calculateRelativeTime(interaction.timestamp, previousTimestamp);
          
          return (
            <div 
              key={interaction.id} 
              className="agentflowdebugger-timeline-item"
            >
              <div className="agentflowdebugger-timeline-time">
                <div className="agentflowdebugger-timeline-absolute-time">
                  {formatTime(interaction.timestamp)}
                </div>
                {relativeTime && (
                  <div className="agentflowdebugger-timeline-relative-time">
                    {relativeTime}
                  </div>
                )}
              </div>
              
              <div 
                className="agentflowdebugger-timeline-type-indicator"
                style={{ backgroundColor: getInteractionTypeColor(interaction.type) }}
              />
              
              <div className="agentflowdebugger-timeline-content">
                <div className="agentflowdebugger-timeline-header">
                  <span className="agentflowdebugger-timeline-agents">
                    <span className="agentflowdebugger-timeline-agent source">
                      {sourceAgent?.name || interaction.sourceId}
                    </span>
                    {" → "}
                    <span className="agentflowdebugger-timeline-agent target">
                      {targetAgent?.name || interaction.targetId}
                    </span>
                  </span>
                  
                  <span className="agentflowdebugger-timeline-type">
                    {interaction.type}
                  </span>
                </div>
                
                <div className="agentflowdebugger-timeline-label">
                  {interaction.label}
                </div>
                
                {interaction.content && (
                  <div className="agentflowdebugger-timeline-message">
                    <pre>{interaction.content}</pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentFlowTimeline; 