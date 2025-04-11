import React, { useState } from 'react';
import { useAgentFlow } from '../../../context/AgentFlowContext';
import './styles.css';

const AgentControls: React.FC = () => {
  const { 
    loading, 
    layout, 
    setLayout, 
    showTimestamps, 
    setShowTimestamps, 
    zoomLevel, 
    setZoomLevel, 
    filters, 
    updateFilters, 
    refreshFlow, 
    flowData, 
    autoRefresh, 
    setAutoRefresh, 
    refreshInterval, 
    setRefreshInterval 
  } = useAgentFlow();
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // Gestione del cambio layout
  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLayout(e.target.value as 'leftToRight' | 'topToBottom' | 'rightToLeft' | 'bottomToTop');
  };
  
  // Gestione del cambio zoom
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseInt(e.target.value, 10));
  };
  
  // Gestione dei filtri degli agenti
  const handleAgentFilterChange = (agentId: string, checked: boolean) => {
    if (checked) {
      updateFilters({
        ...filters,
        agents: [...filters.agents, agentId]
      });
    } else {
      updateFilters({
        ...filters,
        agents: filters.agents.filter(id => id !== agentId)
      });
    }
  };
  
  // Gestione dei filtri di stato
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      updateFilters({
        ...filters,
        status: [...filters.status, status]
      });
    } else {
      updateFilters({
        ...filters,
        status: filters.status.filter(s => s !== status)
      });
    }
  };
  
  // Gestione dei filtri di tipo interazione
  const handleInteractionTypeFilterChange = (type: string, checked: boolean) => {
    if (checked) {
      updateFilters({
        ...filters,
        interactionTypes: [...filters.interactionTypes, type]
      });
    } else {
      updateFilters({
        ...filters,
        interactionTypes: filters.interactionTypes.filter(t => t !== type)
      });
    }
  };
  
  // Gestione di cerca termine
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({
      ...filters,
      searchTerm: e.target.value
    });
  };
  
  // Gestione dell'aggiornamento automatico
  const handleAutoRefreshChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(e.target.checked);
  };
  
  // Gestione dell'intervallo di aggiornamento
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value, 10));
  };
  
  // Determina i valori unici per i filtri dagli agenti e interazioni disponibili
  const getUniqueValues = () => {
    if (!flowData) return { agentIds: [], statuses: [], interactionTypes: [] };
    
    const agentIds = flowData.agents.map(agent => agent.id);
    const statuses = Array.from(new Set(flowData.agents.map(agent => agent.status)));
    const interactionTypes = Array.from(
      new Set(flowData.interactions.map(interaction => interaction.type || 'default'))
    );
    
    return { agentIds, statuses, interactionTypes };
  };
  
  const { agentIds, statuses, interactionTypes } = getUniqueValues();
  
  return (
    <div className="agentflowdebugger-controls">
      <div className="agentflowdebugger-controls-row">
        {/* Controlli principali */}
        <div className="agentflowdebugger-control-group">
          <button
            className="agentflowdebugger-refresh-button"
            onClick={refreshFlow}
            disabled={loading}
          >
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </button>
          
          <div className="agentflowdebugger-control">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={handleAutoRefreshChange}
            />
            <label htmlFor="autoRefresh">Auto Aggiornamento</label>
          </div>
          
          {autoRefresh && (
            <div className="agentflowdebugger-control">
              <label htmlFor="refreshInterval">Intervallo:</label>
              <select
                id="refreshInterval"
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
              >
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>60s</option>
              </select>
            </div>
          )}
        </div>
        
        {/* Controlli di visualizzazione */}
        <div className="agentflowdebugger-control-group">
          <div className="agentflowdebugger-control">
            <label htmlFor="layout">Layout:</label>
            <select
              id="layout"
              value={layout}
              onChange={handleLayoutChange}
            >
              <option value="leftToRight">Sinistra → Destra</option>
              <option value="topToBottom">Alto → Basso</option>
              <option value="rightToLeft">Destra → Sinistra</option>
              <option value="bottomToTop">Basso → Alto</option>
            </select>
          </div>
          
          <div className="agentflowdebugger-control">
            <input
              type="checkbox"
              id="showTimestamps"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
            />
            <label htmlFor="showTimestamps">Mostra Timestamp</label>
          </div>
          
          <div className="agentflowdebugger-control">
            <label htmlFor="zoomLevel">Zoom: {zoomLevel}%</label>
            <input
              type="range"
              id="zoomLevel"
              min="50"
              max="200"
              step="10"
              value={zoomLevel}
              onChange={handleZoomChange}
            />
          </div>
        </div>
        
        {/* Pulsante per aprire il pannello filtri */}
        <div className="agentflowdebugger-control-group">
          <button
            className="agentflowdebugger-filter-button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          >
            {isFilterPanelOpen ? 'Nascondi Filtri' : 'Mostra Filtri'}
          </button>
        </div>
      </div>
      
      {/* Pannello filtri */}
      {isFilterPanelOpen && (
        <div className="agentflowdebugger-filter-panel">
          {/* Ricerca testuale */}
          <div className="agentflowdebugger-filter-group">
            <h4>Ricerca</h4>
            <input
              type="text"
              placeholder="Cerca in agenti e interazioni..."
              value={filters.searchTerm || ''}
              onChange={handleSearchTermChange}
              className="agentflowdebugger-search-input"
            />
          </div>
          
          {/* Filtri agenti */}
          <div className="agentflowdebugger-filter-group">
            <h4>Agenti</h4>
            <div className="agentflowdebugger-filter-items">
              {agentIds.map(agentId => {
                const agent = flowData?.agents.find(a => a.id === agentId);
                return (
                  <div key={agentId} className="agentflowdebugger-filter-item">
                    <input
                      type="checkbox"
                      id={`agent-${agentId}`}
                      checked={!filters.agents.length || filters.agents.includes(agentId)}
                      onChange={(e) => handleAgentFilterChange(agentId, e.target.checked)}
                    />
                    <label htmlFor={`agent-${agentId}`}>
                      {agent ? `${agent.name} (${agent.role})` : agentId}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Filtri stati */}
          <div className="agentflowdebugger-filter-group">
            <h4>Stati</h4>
            <div className="agentflowdebugger-filter-items">
              {statuses.map(status => (
                <div key={status} className="agentflowdebugger-filter-item">
                  <input
                    type="checkbox"
                    id={`status-${status}`}
                    checked={!filters.status.length || filters.status.includes(status)}
                    onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                  />
                  <label htmlFor={`status-${status}`} className={`status-${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Filtri tipi interazione */}
          <div className="agentflowdebugger-filter-group">
            <h4>Tipi di Interazione</h4>
            <div className="agentflowdebugger-filter-items">
              {interactionTypes.map(type => (
                <div key={type} className="agentflowdebugger-filter-item">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={!filters.interactionTypes.length || filters.interactionTypes.includes(type)}
                    onChange={(e) => handleInteractionTypeFilterChange(type, e.target.checked)}
                  />
                  <label htmlFor={`type-${type}`}>
                    {type === 'default' ? 'Predefinito' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pulsanti per reset e applica filtri */}
          <div className="agentflowdebugger-filter-actions">
            <button
              className="agentflowdebugger-reset-button"
              onClick={() => updateFilters({
                agents: [],
                status: [],
                interactionTypes: [],
                searchTerm: ''
              })}
            >
              Reset Filtri
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentControls; 