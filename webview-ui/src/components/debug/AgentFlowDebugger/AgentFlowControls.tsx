import React, { useState, useCallback } from 'react';
import { useAgentFlow } from '../../../context/AgentFlowContext';

interface AgentFlowControlsProps {
  onFilterChange: (filters: {
    search: string;
    status: string[];
    interactionType: string[];
    timeRange: [number, number] | null;
    zoom: number;
  }) => void;
}

/**
 * Componente che permette di filtrare e controllare la visualizzazione del flusso di agenti
 */
const AgentFlowControls: React.FC<AgentFlowControlsProps> = ({ onFilterChange }) => {
  const { flowData, refreshData } = useAgentFlow();
  
  // Stati per i filtri
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedInteractionTypes, setSelectedInteractionTypes] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(100);

  // Raccogli tutti i possibili stati e tipi di interazione
  const availableStatuses = !flowData?.agents ? [] : 
    Array.from(new Set(flowData.agents.map((agent: any) => agent.status)));
  
  const availableInteractionTypes = !flowData?.interactions ? [] : 
    Array.from(new Set(flowData.interactions.map((interaction: any) => interaction.type || 'unknown')));

  // Funzione per aggiornare i filtri
  const updateFilters = useCallback(() => {
    onFilterChange({
      search,
      status: selectedStatuses,
      interactionType: selectedInteractionTypes,
      timeRange: null, // Non implementato in questa versione
      zoom,
    });
  }, [search, selectedStatuses, selectedInteractionTypes, zoom, onFilterChange]);

  // Handler per i cambiamenti
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    updateFilters();
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      const newStatuses = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];
      
      setTimeout(updateFilters, 0);
      return newStatuses;
    });
  };

  const handleInteractionTypeToggle = (type: string) => {
    setSelectedInteractionTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];
      
      setTimeout(updateFilters, 0);
      return newTypes;
    });
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
    updateFilters();
  };

  return (
    <div className="agentflowdebugger-controls">
      <div className="agentflowdebugger-controls-row">
        <div className="agentflowdebugger-controls-search">
          <label htmlFor="agent-search">Cerca:</label>
          <input
            id="agent-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cerca per nome o ID..."
          />
        </div>
        
        <button 
          onClick={refreshData}
          className="agentflowdebugger-controls-refresh"
        >
          Aggiorna
        </button>
      </div>
      
      <div className="agentflowdebugger-controls-row">
        <div className="agentflowdebugger-controls-filters">
          <div className="agentflowdebugger-controls-filter-group">
            <span>Stato:</span>
            <div className="agentflowdebugger-controls-filter-options">
              {availableStatuses.map(status => (
                <label key={status} className="agentflowdebugger-controls-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          
          <div className="agentflowdebugger-controls-filter-group">
            <span>Tipo di interazione:</span>
            <div className="agentflowdebugger-controls-filter-options">
              {availableInteractionTypes.map(type => (
                <label key={type} className="agentflowdebugger-controls-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedInteractionTypes.includes(type)}
                    onChange={() => handleInteractionTypeToggle(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="agentflowdebugger-controls-row">
        <div className="agentflowdebugger-controls-zoom">
          <label htmlFor="zoom-control">Zoom: {zoom}%</label>
          <input
            id="zoom-control"
            type="range"
            min="50"
            max="150"
            value={zoom}
            onChange={handleZoomChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentFlowControls; 