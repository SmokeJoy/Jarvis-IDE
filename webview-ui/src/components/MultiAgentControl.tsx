/**
 * @file MultiAgentControl.tsx
 * @description Componente React per il controllo centralizzato degli agenti multipli
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  VSCodeDivider, 
  VSCodeButton, 
  VSCodeDropdown, 
  VSCodeOption, 
  VSCodeTextField,
  VSCodeProgressRing,
  VSCodeCheckbox
} from '@vscode/webview-ui-toolkit/react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { 
  MasMessageType,
  AgentMessageUnion,
  GetAgentsStatusMessage,
  SetSystemModeMessage,
  SetDefaultStyleMessage
} from '@shared/messages';
import { 
  isAgentsStatusUpdateMessage, 
  isConfigurationSavedMessage,
  isAgentMessage
} from '../types/mas-message-guards';
import { AgentStatus, CodeStyle } from '../types/mas-types';
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import './MasControlPanel.css';

/**
 * Proprietà del componente MultiAgentControl
 */
interface MultiAgentControlProps {
  initialAgents?: AgentStatus[];
  isLoading?: boolean;
}

/**
 * Componente per il controllo centralizzato dei multi-agent
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */
export const MultiAgentControl: React.FC<MultiAgentControlProps> = ({
  initialAgents = [],
  isLoading: externalIsLoading = false
}) => {
  // Stato locale
  const [agentsStatus, setAgentsStatus] = useState<AgentStatus[]>(initialAgents);
  const [isLoading, setIsLoading] = useState<boolean>(externalIsLoading);
  const [systemMode, setSystemMode] = useState<'collaborative' | 'single'>('collaborative');
  const [defaultStyle, setDefaultStyle] = useState<CodeStyle>('standard');
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Hook type-safe per la comunicazione con l'estensione
  const { postMessage } = useExtensionMessage();

  /**
   * Dispatcher di messaggi type-safe per gestire i messaggi in arrivo
   * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
   * @param message Messaggio ricevuto dall'estensione
   */
  const messageDispatcher = useCallback((message: unknown): void => {
    // Verifica se è un messaggio dell'agente prima di procedere
    if (!isAgentMessage(message)) {
      return;
    }

    // Gestione dei diversi tipi di messaggi usando i type guard
    if (isAgentsStatusUpdateMessage(message)) {
      setAgentsStatus((msg.payload as unknown));
      setIsLoading(false);
    } else if (isConfigurationSavedMessage(message)) {
      setStatusMessage({
        text: 'Configurazione salvata con successo',
        type: 'success'
      });
      
      // Resetta il messaggio dopo 3 secondi
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  }, []);

  /**
   * Richiede lo stato degli agenti
   */
  const requestAgentsStatus = useCallback((): void => {
    setIsLoading(true);
    const message: GetAgentsStatusMessage = {
      type: MasMessageType.GET_AGENTS_STATUS
    };
    postMessage<AgentMessageUnion>(message);
  }, [postMessage]);

  /**
   * Cambia la modalità del sistema
   * @param mode Nuova modalità del sistema
   */
  const changeSystemMode = useCallback((mode: 'collaborative' | 'single'): void => {
    setIsLoading(true);
    const message: SetSystemModeMessage = {
      type: MasMessageType.SET_SYSTEM_MODE,
      payload: {
        mode
      }
    };
    postMessage<AgentMessageUnion>(message);
    setSystemMode(mode);
  }, [postMessage]);

  /**
   * Imposta lo stile di codice predefinito
   * @param style Nuovo stile di codice predefinito
   */
  const setDefaultCodeStyle = useCallback((style: CodeStyle): void => {
    setIsLoading(true);
    const message: SetDefaultStyleMessage = {
      type: MasMessageType.SET_DEFAULT_STYLE,
      payload: {
        style
      }
    };
    postMessage<AgentMessageUnion>(message);
    setDefaultStyle(style);
  }, [postMessage]);

  // Inizializza e configura i listener
  useEffect(() => {
    // Richiedi lo stato degli agenti se non è già disponibile
    if (initialAgents.length === 0) {
      requestAgentsStatus();
    } else {
      setAgentsStatus(initialAgents);
    }

    // Configurazione del listener per i messaggi dall'estensione
    const handleMessage = (event: MessageEvent): void => {
      messageDispatcher(event.data);
    };

    // Aggiungi event listener
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [initialAgents, requestAgentsStatus, messageDispatcher]);

  // Conteggio degli agenti attivi
  const activeAgentsCount = agentsStatus.filter(agent => agent.isActive).length;

  return (
    <div className="multi-agent-control">
      <header className="panel-header">
        <h2>Controllo Multi-Agent</h2>
        <div className="panel-status">
          {isLoading ? (
            <span className="loading-status">
              <VSCodeProgressRing /> Caricamento...
            </span>
          ) : (
            <span className="agents-count">
              {activeAgentsCount} di {agentsStatus.length} agenti attivi
            </span>
          )}
        </div>
      </header>

      <VSCodeDivider />

      <div className="system-configuration">
        <h3>Configurazione del Sistema</h3>
        
        <div className="config-grid">
          <div className="config-item">
            <label htmlFor="system-mode">Modalità di Collaborazione:</label>
            <VSCodeDropdown
              id="system-mode"
              value={systemMode}
              onChange={(e: any) => changeSystemMode(e.target.value as 'collaborative' | 'single')}
            >
              <VSCodeOption value="collaborative">Collaborativa</VSCodeOption>
              <VSCodeOption value="single">Singolo Agente</VSCodeOption>
            </VSCodeDropdown>
          </div>

          <div className="config-item">
            <label htmlFor="default-style">Stile di Codice Predefinito:</label>
            <VSCodeDropdown
              id="default-style"
              value={defaultStyle}
              onChange={(e: any) => setDefaultCodeStyle(e.target.value as CodeStyle)}
            >
              <VSCodeOption value="standard">Standard</VSCodeOption>
              <VSCodeOption value="concise">Conciso</VSCodeOption>
              <VSCodeOption value="verbose">Dettagliato</VSCodeOption>
            </VSCodeDropdown>
          </div>
        </div>
      </div>

      <VSCodeDivider />

      <div className="agents-overview">
        <h3>Panoramica Agenti</h3>

        {isLoading ? (
          <div className="loading-container">
            <VSCodeProgressRing />
            <p>Caricamento degli agenti...</p>
          </div>
        ) : (
          <div className="agents-grid">
            {agentsStatus.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-icon">{agent.icon || '🤖'}</div>
                  <div className="agent-name">{agent.name}</div>
                  <div className={`agent-status ${agent.isActive ? 'active' : 'inactive'}`}>
                    {agent.isActive ? 'Attivo' : 'Inattivo'}
                  </div>
                </div>
                <div className="agent-description">
                  {agent.description || 'Nessuna descrizione disponibile'}
                </div>
                <div className="agent-mode">
                  Modalità: <span className="mode-value">{agent.mode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="panel-footer">
        <VSCodeButton
          appearance="secondary"
          onClick={requestAgentsStatus}
          disabled={isLoading}
        >
          Aggiorna Stato
        </VSCodeButton>
      </div>
    </div>
  );
}; 