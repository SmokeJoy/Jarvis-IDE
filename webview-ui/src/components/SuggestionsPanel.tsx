/**
 * @file SuggestionsPanel.tsx
 * @description Componente React per visualizzare e gestire suggerimenti di codice
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDivider, VSCodeBadge } from '@vscode/webview-ui-toolkit/react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import {
  SuggestionsMessageType,
  SuggestionsMessageUnion,
  Suggestion,
  RequestSuggestionsMessage,
  SuggestionAcceptedMessage,
  SuggestionRejectedMessage,
  SuggestionsClearedMessage
} from '../types/suggestions-message';
import {
  isSuggestionsUpdatedMessage,
  isSuggestionAcceptedMessage,
  isSuggestionRejectedMessage,
  isSuggestionsClearedMessage
} from '../types/suggestions-message-guards';

// Styled components
const SuggestionsPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
`;

const SuggestionsPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const SuggestionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vscode-descriptionForeground);
  text-align: center;
  padding: 16px;
`;

const SuggestionItem = styled.div<{ type: string }>`
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 4px;
  background-color: var(--vscode-editorWidget-background);
  border-left: 3px solid ${({ type }) => 
    type === 'code' ? 'var(--vscode-terminal-ansiBlue)' : 
    type === 'refactor' ? 'var(--vscode-terminal-ansiYellow)' :
    type === 'fix' ? 'var(--vscode-terminal-ansiRed)' :
    'var(--vscode-terminal-ansiGreen)'
  };
  
  &:hover {
    background-color: var(--vscode-list-hoverBackground);
  }
`;

const SuggestionText = styled.div`
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
`;

const SuggestionPreview = styled.pre`
  margin: 8px 0;
  padding: 8px;
  background-color: var(--vscode-textCodeBlock-background);
  border-radius: 3px;
  overflow-x: auto;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
`;

const SuggestionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SuggestionTypeTag = styled.span<{ type: string }>`
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: ${({ type }) => 
    type === 'code' ? 'var(--vscode-terminal-ansiBlue)' : 
    type === 'refactor' ? 'var(--vscode-terminal-ansiYellow)' :
    type === 'fix' ? 'var(--vscode-terminal-ansiRed)' :
    'var(--vscode-terminal-ansiGreen)'
  };
  color: var(--vscode-editor-background);
`;

const RefreshButton = styled(VSCodeButton)`
  margin-left: auto;
`;

const ConfidenceBadge = styled.span<{ confidence: number }>`
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
  background-color: ${({ confidence }) => 
    confidence > 80 ? 'var(--vscode-debugIcon-stopForeground)' : 
    confidence > 50 ? 'var(--vscode-terminal-ansiYellow)' :
    'var(--vscode-editorInfo-foreground)'
  };
  color: var(--vscode-editor-background);
`;

interface SuggestionsPanelProps {
  context?: string;
  currentFile?: string;
  selectedText?: string;
  className?: string;
}

/**
 * Componente SuggestionsPanel che visualizza e gestisce suggerimenti di codice
 */
export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  context,
  currentFile,
  selectedText,
  className
}) => {
  // State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook per la comunicazione type-safe con l'estensione
  const { postMessage } = useExtensionMessage();

  /**
   * Gestione messaggi in arrivo dall'estensione
   */
  const handleExtensionMessage = useCallback((event: MessageEvent) => {
    const message = event.data;
    
    if (isSuggestionsUpdatedMessage(message)) {
      setSuggestions(message.payload.suggestions);
      setIsLoading(false);
      setError(null);
    } else if (isSuggestionAcceptedMessage(message)) {
      // Aggiorna lo stato locale quando un suggerimento viene accettato
      setSuggestions(prev => prev.filter(s => s.id !== message.payload.suggestionId));
    } else if (isSuggestionRejectedMessage(message)) {
      // Aggiorna lo stato locale quando un suggerimento viene rifiutato
      setSuggestions(prev => prev.filter(s => s.id !== message.payload.suggestionId));
    } else if (isSuggestionsClearedMessage(message)) {
      // Pulisci i suggerimenti quando richiesto
      setSuggestions([]);
    }
  }, []);

  // Configurazione del listener per i messaggi
  useEffect(() => {
    window.addEventListener('message', handleExtensionMessage);
    
    return () => {
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, [handleExtensionMessage]);

  // Richiedi suggerimenti all'avvio o quando cambiano le props
  useEffect(() => {
    requestSuggestions();
  }, [context, currentFile, selectedText]);

  /**
   * Richiede suggerimenti all'estensione
   */
  const requestSuggestions = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Crea messaggio tipizzato per la richiesta di suggerimenti
    const requestMessage: RequestSuggestionsMessage = {
      type: SuggestionsMessageType.REQUEST_SUGGESTIONS,
      payload: {
        context,
        currentFile,
        selectedText
      }
    };
    
    // Invia il messaggio in modo type-safe
    postMessage<SuggestionsMessageUnion>(requestMessage);
  }, [postMessage, context, currentFile, selectedText]);

  /**
   * Gestisce l'accettazione di un suggerimento
   */
  const handleAcceptSuggestion = useCallback((suggestionId: string, applyMode: 'immediate' | 'preview' = 'preview') => {
    // Crea messaggio tipizzato per l'accettazione di un suggerimento
    const acceptMessage: SuggestionAcceptedMessage = {
      type: SuggestionsMessageType.SUGGESTION_ACCEPTED,
      payload: {
        suggestionId,
        applyMode
      }
    };
    
    // Invia il messaggio in modo type-safe
    postMessage<SuggestionsMessageUnion>(acceptMessage);
  }, [postMessage]);

  /**
   * Gestisce il rifiuto di un suggerimento
   */
  const handleRejectSuggestion = useCallback((suggestionId: string, reason?: string) => {
    // Crea messaggio tipizzato per il rifiuto di un suggerimento
    const rejectMessage: SuggestionRejectedMessage = {
      type: SuggestionsMessageType.SUGGESTION_REJECTED,
      payload: {
        suggestionId,
        reason
      }
    };
    
    // Invia il messaggio in modo type-safe
    postMessage<SuggestionsMessageUnion>(rejectMessage);
  }, [postMessage]);

  /**
   * Gestisce la pulizia di tutti i suggerimenti
   */
  const handleClearSuggestions = useCallback(() => {
    // Crea messaggio tipizzato per la pulizia dei suggerimenti
    const clearMessage: SuggestionsClearedMessage = {
      type: SuggestionsMessageType.SUGGESTIONS_CLEARED
    };
    
    // Invia il messaggio in modo type-safe
    postMessage<SuggestionsMessageUnion>(clearMessage);
    
    // Aggiorna lo stato locale
    setSuggestions([]);
  }, [postMessage]);

  /**
   * Renderizza un singolo suggerimento
   */
  const renderSuggestion = (suggestion: Suggestion) => (
    <SuggestionItem key={suggestion.id} type={suggestion.type}>
      <SuggestionHeader>
        <SuggestionTypeTag type={suggestion.type}>
          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
        </SuggestionTypeTag>
        {suggestion.confidence !== undefined && (
          <ConfidenceBadge confidence={suggestion.confidence}>
            {suggestion.confidence}%
          </ConfidenceBadge>
        )}
      </SuggestionHeader>
      
      <SuggestionText>{suggestion.text}</SuggestionText>
      
      {suggestion.preview && (
        <SuggestionPreview>{suggestion.preview}</SuggestionPreview>
      )}
      
      <SuggestionActions>
        <VSCodeButton appearance="secondary" onClick={() => handleRejectSuggestion(suggestion.id)}>
          Ignora
        </VSCodeButton>
        <VSCodeButton 
          appearance="primary" 
          onClick={() => handleAcceptSuggestion(suggestion.id, 'preview')}
        >
          Anteprima
        </VSCodeButton>
        <VSCodeButton onClick={() => handleAcceptSuggestion(suggestion.id, 'immediate')}>
          Applica
        </VSCodeButton>
      </SuggestionActions>
    </SuggestionItem>
  );

  return (
    <SuggestionsPanelContainer className={className}>
      <SuggestionsPanelHeader>
        <h3>Suggerimenti</h3>
        <div>
          {suggestions.length > 0 && (
            <VSCodeBadge>{suggestions.length}</VSCodeBadge>
          )}
          <RefreshButton appearance="icon" onClick={requestSuggestions}>
            <span className="codicon codicon-refresh"></span>
          </RefreshButton>
          {suggestions.length > 0 && (
            <VSCodeButton appearance="icon" onClick={handleClearSuggestions}>
              <span className="codicon codicon-clear-all"></span>
            </VSCodeButton>
          )}
        </div>
      </SuggestionsPanelHeader>
      
      <SuggestionsList>
        {isLoading ? (
          <EmptyState>
            <span className="codicon codicon-loading codicon-modifier-spin"></span>
            <p>Caricamento suggerimenti...</p>
          </EmptyState>
        ) : error ? (
          <EmptyState>
            <span className="codicon codicon-error"></span>
            <p>{error}</p>
            <VSCodeButton onClick={requestSuggestions}>Riprova</VSCodeButton>
          </EmptyState>
        ) : suggestions.length > 0 ? (
          suggestions.map(renderSuggestion)
        ) : (
          <EmptyState>
            <span className="codicon codicon-lightbulb"></span>
            <p>Nessun suggerimento disponibile per il contesto attuale</p>
            <VSCodeButton onClick={requestSuggestions}>Aggiorna</VSCodeButton>
          </EmptyState>
        )}
      </SuggestionsList>
    </SuggestionsPanelContainer>
  );
}; 