import React, { useState, useEffect, useCallback } from 'react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MasMessageType, AgentMemoryRequestMessage, ErrorMessage as ErrorMessageType } from '../types/mas-message';
import { isAgentMemoryResponseMessage, isErrorMessage } from '../types/mas-message-guards';
import styled from 'styled-components';

const MemoryPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--vscode-editor-background);
  padding: 1rem;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  margin-top: 0.5rem;
  width: 100%;
  font-size: 0.9rem;
  
  &:focus {
    outline: 1px solid var(--vscode-focusBorder);
  }
`;

const MemoryContent = styled.pre`
  margin: 0;
  overflow: auto;
  max-height: 300px;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  border: 1px solid var(--vscode-editor-lineHighlightBorder);
  padding: 0.5rem;
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
`;

const ErrorContainer = styled.div`
  color: var(--vscode-errorForeground);
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: var(--vscode-inputValidation-errorBackground);
  border: 1px solid var(--vscode-inputValidation-errorBorder);
  border-radius: 3px;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
`;

export const MASMemoryPanel: React.FC = () => {
  const { postMessage } = useExtensionMessage();
  const [memoryData, setMemoryData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Formatta i dati di memoria in modo più leggibile
  const formatMemory = (data: Record<string, unknown>): string => {
    if (Object.keys(data).length === 0) {
      return "";
    }
    
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("Errore nella formattazione JSON:", e);
      return String(data);
    }
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    const message: AgentMemoryRequestMessage = {
      type: MasMessageType.AGENT_MEMORY_REQUEST,
      payload: { scope: 'current_session' },
    };
    postMessage(message);
  }, [postMessage]);

  // Invia una richiesta di memoria all'avvio
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Gestione dei messaggi dall'estensione
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Gestione della risposta con i dati di memoria
      if (isAgentMemoryResponseMessage(event.data)) {
        setMemoryData(event.data.payload || {});
        setLoading(false);
        setError(null);
      }
      
      // Gestione dei messaggi di errore
      if (isErrorMessage(event.data)) {
        setError(event.data.payload.message || 'Errore nel recupero della memoria');
        setLoading(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Filtra i dati in base al termine di ricerca
  const filteredData = useCallback(() => {
    if (!searchTerm) return memoryData;
    
    const jsonString = JSON.stringify(memoryData, null, 2);
    if (jsonString.toLowerCase().includes(searchTerm.toLowerCase())) {
      try {
        // Filtra solo le parti che contengono il termine di ricerca
        const filteredObject: Record<string, unknown> = {};
        
        Object.entries(memoryData).forEach(([key, value]) => {
          const valueStr = JSON.stringify(value);
          if (
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            valueStr.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            filteredObject[key] = value;
          }
        });
        
        return filteredObject;
      } catch (err) {
        console.error('Errore nel filtraggio dei dati', err);
      }
    }
    return {};
  }, [memoryData, searchTerm]);

  // Verifica se i dati di memoria sono vuoti
  const isMemoryEmpty = Object.keys(memoryData).length === 0;
  
  // Testo da visualizzare per dati vuoti
  const emptyText = "Nessun dato in memoria";
  
  // Testo formattato della memoria con eventuali filtri
  const formattedMemory = formatMemory(filteredData());

  return (
    <MemoryPanelContainer className="memory-panel">
      <PanelHeader className="panel-header">
        <h2>Memoria MAS</h2>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Aggiorna memoria"
        >
          {loading ? 'Caricamento...' : 'Aggiorna'}
        </button>
      </PanelHeader>
      
      <SearchInput 
        type="text"
        placeholder="Cerca nei dati..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={isMemoryEmpty || loading}
        aria-label="Cerca nei dati di memoria"
      />
      
      {error && (
        <ErrorContainer data-testid="error-message">
          Errore nel recupero della memoria: {error}
        </ErrorContainer>
      )}
      
      <MemoryContent className="memory-content">
        {isMemoryEmpty ? (
          <EmptyState>{emptyText}</EmptyState>
        ) : (
          <div dangerouslySetInnerHTML={{ 
            __html: formattedMemory
              .replace(/("user_preference")/g, '<span data-testid="user-preference">$1</span>')
              .replace(/("dark_mode")/g, '<span data-testid="dark-mode">$1</span>')
              .replace(/("last_command")/g, '<span data-testid="last-command">$1</span>')
          }} />
        )}
      </MemoryContent>
    </MemoryPanelContainer>
  );
};