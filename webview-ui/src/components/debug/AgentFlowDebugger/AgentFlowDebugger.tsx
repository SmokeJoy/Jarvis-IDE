/**
 * @file AgentFlowDebugger.tsx
 * @description Componente per visualizzare e debuggare il flusso di esecuzione degli agenti
 */

import React, { useState, useCallback } from 'react';
import { AgentFlowProvider } from '../../../context/AgentFlowContext';
import AgentFlowHeader from './AgentFlowHeader';
import AgentFlowStats from './AgentFlowStats';
import AgentFlowControls from './AgentFlowControls';
import AgentFlowDiagram from './AgentFlowDiagram';
import AgentFlowTimeline from './AgentFlowTimeline';
import { AgentFlowSummary } from './AgentFlowSummary';
import './styles.css';

interface AgentFlowDebuggerProps {
  sessionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showHeader?: boolean;
  showStats?: boolean;
  showTimeline?: boolean;
  showSummary?: boolean;
}

/**
 * Componente principale per il debugging del flusso degli agenti.
 * Integra tutti i sottocomponenti e gestisce lo stato dei filtri.
 */
const AgentFlowDebugger: React.FC<AgentFlowDebuggerProps> = ({
  sessionId,
  autoRefresh = true,
  refreshInterval = 5000,
  showHeader = true,
  showStats = true,
  showTimeline = true,
  showSummary = true
}) => {
  // Stato per i filtri del diagramma
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    interactionType: [] as string[],
    timeRange: null as [number, number] | null,
    zoom: 100
  });

  // Gestione dei cambiamenti nei filtri
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  return (
    <AgentFlowProvider sessionId={sessionId} autoRefresh={autoRefresh} refreshInterval={refreshInterval}>
      <div className="agentflowdebugger-container">
        {showHeader && <AgentFlowHeader />}
        
        <div className="agentflowdebugger-row">
          {showStats && (
            <div className="agentflowdebugger-column">
              <AgentFlowStats />
            </div>
          )}
          
          {showSummary && (
            <div className="agentflowdebugger-column">
              <AgentFlowSummary />
            </div>
          )}
        </div>
        
        <AgentFlowControls onFilterChange={handleFilterChange} />
        
        <AgentFlowDiagram filters={filters} />
        
        {showTimeline && <AgentFlowTimeline filters={filters} />}
      </div>
    </AgentFlowProvider>
  );
};

export default AgentFlowDebugger;
