import React, { useState, useEffect } from 'react';
import { 
  VSCodeTextField, 
  VSCodeDropdown, 
  VSCodeOption, 
  VSCodeCheckbox, 
  VSCodeButton,
  VSCodeDivider,
  VSCodeProgressRing
} from '@vscode/webview-ui-toolkit/react';
import { MasCommunicationService } from '../services/MasCommunicationService';
import { AgentStatus, AgentMode, AgentConfig, CodeStyle, MasConfig } from '../types/mas-types';
import './AgentConfigurationPanel.css';

interface AgentConfigurationPanelProps {
  agents: AgentStatus[];
  isLoading?: boolean;
}

/**
 * Componente per configurare il comportamento degli agenti nel sistema MAS
 */
export const AgentConfigurationPanel: React.FC<AgentConfigurationPanelProps> = ({
  agents,
  isLoading = false
}) => {
  const [systemConfig, setSystemConfig] = useState<MasConfig>({
    agents: [],
    defaultStyle: 'standard',
    defaultMode: 'collaborative'
  });
  
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const masService = MasCommunicationService.getInstance();
  
  // Carica la configurazione iniziale
  useEffect(() => {
    if (agents.length > 0 && systemConfig.agents.length === 0) {
      // Converte gli AgentStatus in AgentConfig
      const agentConfigs = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        mode: agent.mode,
        isEnabled: agent.isActive,
        style: 'standard' as CodeStyle // Default style
      }));
      
      setSystemConfig({
        ...systemConfig,
        agents: agentConfigs
      });
    }
  }, [agents]);
  
  /**
   * Gestisce la modifica della modalità di un agente
   */
  const handleModeChange = (agentId: string, mode: AgentMode) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      agents: prevConfig.agents.map(agent => 
        agent.id === agentId ? { ...agent, mode } : agent
      )
    }));
  };
  
  /**
   * Gestisce la modifica dello stato attivo/inattivo di un agente
   */
  const handleEnabledChange = (agentId: string, isEnabled: boolean) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      agents: prevConfig.agents.map(agent => 
        agent.id === agentId ? { ...agent, isEnabled } : agent
      )
    }));
  };
  
  /**
   * Gestisce la modifica dello stile di codice di un agente
   */
  const handleStyleChange = (agentId: string, style: CodeStyle) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      agents: prevConfig.agents.map(agent => 
        agent.id === agentId ? { ...agent, style } : agent
      )
    }));
  };
  
  /**
   * Gestisce la modifica della modalità globale del sistema MAS
   */
  const handleSystemModeChange = (mode: 'collaborative' | 'single') => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      defaultMode: mode
    }));
  };
  
  /**
   * Gestisce la modifica dello stile di codice di default
   */
  const handleDefaultStyleChange = (style: CodeStyle) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      defaultStyle: style
    }));
  };
  
  /**
   * Salva la configurazione
   */
  const saveConfiguration = () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // In un'implementazione reale, qui invieremmo la configurazione al backend
      // Per questo MVP, simuliamo una richiesta al backend
      setTimeout(() => {
        setIsSaving(false);
        setSaveMessage({
          type: 'success',
          text: 'Configurazione salvata con successo'
        });
        
        // Applica le modifiche agli agenti
        systemConfig.agents.forEach(agentConfig => {
          // Attiva/disattiva gli agenti
          if (agentConfig.isEnabled !== findAgent(agentConfig.id)?.isActive) {
            masService.toggleAgentActive(agentConfig.id, agentConfig.isEnabled);
          }
          
          // Imposta la modalità
          masService.setAgentMode(agentConfig.id, agentConfig.mode);
          
          // Imposta lo stile di codice
          if (agentConfig.style) {
            masService.setAgentStyle(agentConfig.id, agentConfig.style);
          }
        });
        
        // Imposta la modalità globale e lo stile di default
        masService.setSystemMode(systemConfig.defaultMode);
        masService.setDefaultStyle(systemConfig.defaultStyle);
        
        // Resetta il messaggio dopo 3 secondi
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      }, 1000);
    } catch (error) {
      setIsSaving(false);
      setSaveMessage({
        type: 'error',
        text: `Errore durante il salvataggio: ${(error as Error).message}`
      });
    }
  };
  
  /**
   * Trova l'agente originale corrispondente
   */
  const findAgent = (agentId: string): AgentStatus | undefined => {
    return agents.find(agent => agent.id === agentId);
  };
  
  /**
   * Inizia la modifica di un agente
   */
  const startEditing = (agentId: string) => {
    setEditingAgentId(agentId);
  };
  
  /**
   * Annulla la modifica di un agente
   */
  const cancelEditing = () => {
    setEditingAgentId(null);
  };
  
  return (
    <div className="agent-configuration-panel">
      <div className="config-header">
        <h3>Configurazione Agenti</h3>
        {isLoading && <VSCodeProgressRing className="loading-indicator" />}
      </div>
      
      {/* Configurazione globale del sistema MAS */}
      <div className="system-config-section">
        <h4>Configurazione Sistema</h4>
        <div className="config-grid">
          <div className="config-item">
            <label>Modalità operativa:</label>
            <VSCodeDropdown
              value={systemConfig.defaultMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                handleSystemModeChange(e.target.value as 'collaborative' | 'single')}
            >
              <VSCodeOption value="collaborative">Collaborativa</VSCodeOption>
              <VSCodeOption value="single">Singolo agente</VSCodeOption>
            </VSCodeDropdown>
          </div>
          
          <div className="config-item">
            <label>Stile di codice predefinito:</label>
            <VSCodeDropdown
              value={systemConfig.defaultStyle}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                handleDefaultStyleChange(e.target.value as CodeStyle)}
            >
              <VSCodeOption value="standard">Standard</VSCodeOption>
              <VSCodeOption value="concise">Conciso</VSCodeOption>
              <VSCodeOption value="verbose">Dettagliato</VSCodeOption>
            </VSCodeDropdown>
          </div>
        </div>
      </div>
      
      <VSCodeDivider />
      
      {/* Configurazione dei singoli agenti */}
      <div className="agents-config-section">
        <h4>Agenti disponibili</h4>
        
        {systemConfig.agents.length === 0 ? (
          <div className="no-agents-message">
            Nessun agente disponibile per la configurazione
          </div>
        ) : (
          <div className="agents-list">
            {systemConfig.agents.map(agent => (
              <div key={agent.id} className="agent-config-card">
                <div className="agent-config-header">
                  <span className="agent-name">{agent.name}</span>
                  <VSCodeCheckbox
                    checked={agent.isEnabled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleEnabledChange(agent.id, e.target.checked)}
                  >
                    Attivo
                  </VSCodeCheckbox>
                </div>
                
                {editingAgentId === agent.id ? (
                  <>
                    <div className="agent-config-details">
                      <div className="config-row">
                        <label>Modalità:</label>
                        <VSCodeDropdown
                          value={agent.mode}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                            handleModeChange(agent.id, e.target.value as AgentMode)}
                        >
                          <VSCodeOption value="autonomous">Autonomo</VSCodeOption>
                          <VSCodeOption value="supervised">Supervisionato</VSCodeOption>
                          <VSCodeOption value="inactive">Inattivo</VSCodeOption>
                        </VSCodeDropdown>
                      </div>
                      
                      <div className="config-row">
                        <label>Stile di codice:</label>
                        <VSCodeDropdown
                          value={agent.style}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                            handleStyleChange(agent.id, e.target.value as CodeStyle)}
                        >
                          <VSCodeOption value="standard">Standard</VSCodeOption>
                          <VSCodeOption value="concise">Conciso</VSCodeOption>
                          <VSCodeOption value="verbose">Dettagliato</VSCodeOption>
                        </VSCodeDropdown>
                      </div>
                    </div>
                    
                    <div className="agent-config-actions">
                      <VSCodeButton appearance="secondary" onClick={cancelEditing}>
                        Annulla
                      </VSCodeButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="agent-config-summary">
                      <div className="config-summary-item">
                        <strong>Modalità:</strong> 
                        <span className={`mode-badge ${agent.mode}`}>
                          {agent.mode === 'autonomous' && 'Autonomo'}
                          {agent.mode === 'supervised' && 'Supervisionato'}
                          {agent.mode === 'inactive' && 'Inattivo'}
                        </span>
                      </div>
                      
                      <div className="config-summary-item">
                        <strong>Stile:</strong> 
                        <span>
                          {agent.style === 'standard' && 'Standard'}
                          {agent.style === 'concise' && 'Conciso'}
                          {agent.style === 'verbose' && 'Dettagliato'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="agent-config-actions">
                      <VSCodeButton appearance="secondary" onClick={() => startEditing(agent.id)}>
                        Modifica
                      </VSCodeButton>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="config-actions">
        <VSCodeButton 
          disabled={isSaving || systemConfig.agents.length === 0} 
          onClick={saveConfiguration}
        >
          {isSaving ? 'Salvataggio in corso...' : 'Salva configurazione'}
        </VSCodeButton>
        
        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}
      </div>
      
      <div className="config-info">
        <p>La configurazione degli agenti determina come il sistema MAS gestisce le istruzioni e produce codice. Gli agenti possono operare in modo autonomo, supervisionato o essere disattivati.</p>
      </div>
    </div>
  );
}; 