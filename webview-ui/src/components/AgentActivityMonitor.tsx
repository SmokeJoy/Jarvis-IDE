import React, { useState, useEffect } from 'react';
import { VSCodeButton, VSCodeDivider, VSCodeBadge, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
import { MasCommunicationService } from '../services/MasCommunicationService';
import { AgentStatus, AgentMode } from '../types/mas-types';
import './AgentActivityMonitor.css';

interface AgentActivityMonitorProps {
  agents: AgentStatus[];
  isLoading?: boolean;
}

/**
 * Componente che visualizza in tempo reale lo stato degli agenti nel sistema MAS
 */
export const AgentActivityMonitor: React.FC<AgentActivityMonitorProps> = ({ 
  agents, 
  isLoading = false 
}) => {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  
  /**
   * Traduce la modalità dell'agente in italiano
   */
  const getAgentModeLabel = (mode: AgentMode): string => {
    switch(mode) {
      case 'autonomous': return 'Autonomo';
      case 'supervised': return 'Supervisionato';
      case 'inactive': return 'Inattivo';
      default: return 'Sconosciuto';
    }
  };
  
  /**
   * Formatta il tempo relativo (es. "2s fa", "5m fa")
   */
  const formatRelativeTime = (timestamp?: Date | string): string => {
    if (!timestamp) return 'mai';
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Secondi
    if (diffMs < 60000) {
      const seconds = Math.floor(diffMs / 1000);
      return `${seconds}s fa`;
    }
    
    // Minuti
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes}m fa`;
    }
    
    // Ore
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours}h fa`;
    }
    
    // Giorni
    const days = Math.floor(diffMs / 86400000);
    return `${days}g fa`;
  };
  
  /**
   * Determina il colore di stato dell'agente
   */
  const getAgentStatusColor = (agent: AgentStatus): string => {
    if (agent.warnings.length > 0) return 'error';
    if (!agent.isActive) return 'inactive';
    if (agent.mode === 'supervised') return 'warning';
    return 'success';
  };
  
  /**
   * Determina l'etichetta dello stato dell'agente
   */
  const getAgentStatusLabel = (agent: AgentStatus): string => {
    if (agent.warnings.length > 0) return 'Errore';
    if (!agent.isActive) return 'Inattivo';
    if (agent.currentTask) return 'Occupato';
    if (agent.mode === 'supervised') return 'In attesa';
    return 'Attivo';
  };
  
  /**
   * Gestisce il toggle dell'espansione dei dettagli di un agente
   */
  const toggleAgentExpand = (agentId: string) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
    } else {
      setExpandedAgentId(agentId);
    }
  };
  
  /**
   * Attiva o disattiva un agente
   */
  const toggleAgentActive = (agentId: string, isActive: boolean) => {
    const masService = MasCommunicationService.getInstance();
    masService.toggleAgentActive(agentId, !isActive);
  };
  
  return (
    <div className="agent-activity-monitor">
      <div className="monitor-header">
        <h3>Monitoraggio Agenti</h3>
        {isLoading && <VSCodeProgressRing className="loading-indicator" />}
        <VSCodeBadge className="agents-counter">
          {agents.filter(agent => agent.isActive).length}/{agents.length} attivi
        </VSCodeBadge>
      </div>
      
      {agents.length === 0 ? (
        <div className="no-agents-message">
          Nessun agente disponibile nel sistema MAS
        </div>
      ) : (
        <div className="agents-table-container">
          <table className="agents-table">
            <thead>
              <tr>
                <th className="agent-col">🧠 Agente</th>
                <th className="status-col">⚙️ Stato</th>
                <th className="mode-col">📡 Modalità</th>
                <th className="activity-col">⏱️ Ultima attività</th>
                <th className="actions-col">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <React.Fragment key={agent.id}>
                  <tr 
                    className={`agent-row ${getAgentStatusColor(agent)}`}
                    onMouseEnter={() => setHoveredAgentId(agent.id)}
                    onMouseLeave={() => setHoveredAgentId(null)}
                  >
                    <td className="agent-name">
                      {agent.name}
                      {hoveredAgentId === agent.id && agent.currentTask && (
                        <div className="agent-tooltip">
                          <strong>Task attuale:</strong> {agent.currentTask}
                        </div>
                      )}
                    </td>
                    <td className={`agent-status ${getAgentStatusColor(agent)}`}>
                      <div className="status-indicator"></div>
                      {getAgentStatusLabel(agent)}
                    </td>
                    <td className="agent-mode">
                      {getAgentModeLabel(agent.mode)}
                    </td>
                    <td className="agent-last-activity">
                      {formatRelativeTime(agent.lastActivity)}
                    </td>
                    <td className="agent-actions">
                      <VSCodeButton
                        appearance="icon"
                        title={expandedAgentId === agent.id ? "Nascondi dettagli" : "Mostra dettagli"}
                        onClick={() => toggleAgentExpand(agent.id)}
                      >
                        {expandedAgentId === agent.id ? '↑' : '↓'}
                      </VSCodeButton>
                      <VSCodeButton
                        appearance="icon"
                        title={agent.isActive ? "Disattiva agente" : "Attiva agente"}
                        onClick={() => toggleAgentActive(agent.id, agent.isActive)}
                      >
                        {agent.isActive ? '⏹️' : '▶️'}
                      </VSCodeButton>
                    </td>
                  </tr>
                  
                  {expandedAgentId === agent.id && (
                    <tr className="agent-details-row">
                      <td colSpan={5}>
                        <div className="agent-details">
                          {agent.currentTask && (
                            <div className="detail-section">
                              <strong>Task corrente:</strong>
                              <div className="detail-value">{agent.currentTask}</div>
                            </div>
                          )}
                          
                          {agent.dependencies.length > 0 && (
                            <div className="detail-section">
                              <strong>Dipendenze:</strong>
                              <div className="dependencies-list">
                                {agent.dependencies.map((dep, index) => (
                                  <div key={index} className="dependency-item">
                                    {dep}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {agent.warnings.length > 0 && (
                            <div className="detail-section warnings">
                              <strong>Avvisi:</strong>
                              <div className="warnings-list">
                                {agent.warnings.map((warning, index) => (
                                  <div key={index} className="warning-item">
                                    ⚠️ {warning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}; 