/**
 * @file PromptHistory.tsx
 * @description Componente React per visualizzare la cronologia dei prompt
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  VSCodeDivider, 
  VSCodeButton, 
  VSCodeTextField,
  VSCodeProgressRing, 
  VSCodeDropdown, 
  VSCodeOption
} from '@vscode/webview-ui-toolkit/react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';

/**
 * Tipo di un elemento della cronologia dei prompt
 */
type PromptHistoryItemType = 'success' | 'error' | 'pending';

/**
 * Interfaccia per un elemento della cronologia dei prompt
 */
interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  result?: string;
  type?: PromptHistoryItemType;
  tags?: string[];
}

/**
 * Namespace per i tipi di messaggi della cronologia dei prompt
 */
export namespace PromptHistoryMessageType {
  export const GET_HISTORY = 'getPromptHistory';
  export const HISTORY_RESPONSE = 'promptHistoryResponse';
  export const DELETE_ITEM = 'deletePromptHistoryItem';
  export const USE_PROMPT = 'usePromptFromHistory';
  export const CLEAR_HISTORY = 'clearPromptHistory';
  export const EXPORT_HISTORY = 'exportPromptHistory';
  export const IMPORT_HISTORY = 'importPromptHistory';
}

/**
 * Interfaccia per il messaggio di richiesta della cronologia
 */
interface GetPromptHistoryMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.GET_HISTORY;
  payload?: {
    limit?: number;
    filters?: {
      type?: PromptHistoryItemType;
      startDate?: number;
      endDate?: number;
      tags?: string[];
    };
  };
}

/**
 * Interfaccia per il messaggio di risposta con la cronologia
 */
interface PromptHistoryResponseMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.HISTORY_RESPONSE;
  payload: {
    items: PromptHistoryItem[];
    totalCount?: number;
  };
}

/**
 * Interfaccia per il messaggio di eliminazione di un prompt dalla cronologia
 */
interface DeletePromptHistoryItemMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.DELETE_ITEM;
  payload: {
    id: string;
  };
}

/**
 * Interfaccia per il messaggio di utilizzo di un prompt dalla cronologia
 */
interface UsePromptFromHistoryMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.USE_PROMPT;
  payload: {
    id: string;
  };
}

/**
 * Interfaccia per il messaggio di pulizia della cronologia
 */
interface ClearPromptHistoryMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.CLEAR_HISTORY;
}

/**
 * Interfaccia per il messaggio di esportazione della cronologia
 */
interface ExportPromptHistoryMessage extends WebviewMessageUnion {
  type: typeof PromptHistoryMessageType.EXPORT_HISTORY;
  payload?: {
    format?: 'json' | 'csv' | 'txt';
  };
}

/**
 * Union type di tutti i messaggi relativi alla cronologia dei prompt
 */
export type PromptHistoryMessageUnion = 
  | GetPromptHistoryMessage
  | PromptHistoryResponseMessage
  | DeletePromptHistoryItemMessage
  | UsePromptFromHistoryMessage
  | ClearPromptHistoryMessage
  | ExportPromptHistoryMessage;

/**
 * Type guard generico per verificare se un messaggio è relativo alla cronologia
 */
function isPromptHistoryMessage(message: unknown): message is PromptHistoryMessageUnion {
  return (
    message !== null &&
    typeof message === 'object' && 
    'type' in (message as any) && 
    typeof (message as any).type === 'string' &&
    Object.values(PromptHistoryMessageType).includes((message as any).type as string)
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo PromptHistoryResponseMessage
 */
function isPromptHistoryResponseMessage(message: unknown): message is PromptHistoryResponseMessage {
  if (!isPromptHistoryMessage(message)) {
    return false;
  }
  
  return (
    message.type === PromptHistoryMessageType.HISTORY_RESPONSE &&
    'payload' in message &&
    message.payload !== null &&
    typeof message.payload === 'object' &&
    'items' in message.payload &&
    Array.isArray(message.payload.items)
  );
}

/**
 * Type guard per verificare se un messaggio è di tipo DeletePromptHistoryItemMessage
 */
function isDeletePromptHistoryItemMessage(message: unknown): message is DeletePromptHistoryItemMessage {
  if (!isPromptHistoryMessage(message)) {
    return false;
  }
  
  return (
    message.type === PromptHistoryMessageType.DELETE_ITEM &&
    'payload' in message &&
    message.payload !== null &&
    typeof message.payload === 'object' &&
    'id' in message.payload &&
    typeof message.payload.id === 'string'
  );
}

/**
 * Proprietà del componente PromptHistory
 */
interface PromptHistoryProps {
  onSelectPrompt?: (prompt: string) => void;
}

/**
 * Componente per visualizzare la cronologia dei prompt
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */
export const PromptHistory: React.FC<PromptHistoryProps> = ({
  onSelectPrompt
}) => {
  // Stato locale
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hook type-safe per la comunicazione con l'estensione
  const { postMessage } = useExtensionMessage();

  /**
   * Dispatcher di messaggi type-safe per gestire i messaggi in arrivo
   * Utilizza il pattern Union Dispatcher Type-Safe con validazione
   */
  const messageDispatcher = useCallback((message: unknown): void => {
    // Prima verifica che sia un messaggio relativo alla cronologia
    if (!isPromptHistoryMessage(message)) {
      return;
    }

    // Poi gestisce i tipi specifici di messaggi utilizzando i type guards
    if (isPromptHistoryResponseMessage(message)) {
      setHistoryItems(message.payload.items);
      setIsLoading(false);
      setError(null);
    } else if (isDeletePromptHistoryItemMessage(message)) {
      // Potremmo ricevere una conferma di eliminazione, aggiorniamo lo stato di conseguenza
      setHistoryItems(prev => prev.filter(item => item.id !== message.payload.id));
      
      // Deseleziona l'elemento se era selezionato
      if (selectedItem === message.payload.id) {
        setSelectedItem(null);
      }
    }
  }, [selectedItem]);

  /**
   * Richiede la cronologia dei prompt all'estensione
   */
  const requestHistory = useCallback((): void => {
    setIsLoading(true);
    setError(null);
    
    try {
      const message: GetPromptHistoryMessage = {
        type: PromptHistoryMessageType.GET_HISTORY,
        payload: {
          limit: 100 // Limita a 100 elementi per prestazioni
        }
      };
      postMessage<PromptHistoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante la richiesta della cronologia prompt');
      setIsLoading(false);
      console.error('Errore durante la richiesta della cronologia:', err);
    }
  }, [postMessage]);

  /**
   * Elimina un elemento dalla cronologia
   */
  const deleteHistoryItem = useCallback((id: string): void => {
    try {
      const message: DeletePromptHistoryItemMessage = {
        type: PromptHistoryMessageType.DELETE_ITEM,
        payload: {
          id
        }
      };
      postMessage<PromptHistoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante l\'eliminazione dell\'elemento');
      console.error('Errore durante l\'eliminazione:', err);
    }
  }, [postMessage, setError]);

  /**
   * Utilizza un prompt dalla cronologia
   */
  const usePromptFromHistory = useCallback((id: string): void => {
    try {
      const message: UsePromptFromHistoryMessage = {
        type: PromptHistoryMessageType.USE_PROMPT,
        payload: {
          id
        }
      };
      postMessage<PromptHistoryMessageUnion>(message);
      
      // Se c'è una callback di selezione, trova l'elemento e passa il prompt
      if (onSelectPrompt) {
        const item = historyItems.find(item => item.id === id);
        if (item) {
          onSelectPrompt(item.prompt);
        }
      }
    } catch (err) {
      setError('Errore durante l\'utilizzo del prompt');
      console.error('Errore durante l\'utilizzo del prompt:', err);
    }
  }, [postMessage, onSelectPrompt, historyItems, setError]);

  /**
   * Pulisce tutta la cronologia dei prompt
   */
  const clearHistory = useCallback((): void => {
    try {
      const message: ClearPromptHistoryMessage = {
        type: PromptHistoryMessageType.CLEAR_HISTORY
      };
      postMessage<PromptHistoryMessageUnion>(message);
      
      // Aggiorniamo lo stato locale immediatamente per una UI reattiva
      setHistoryItems([]);
    } catch (err) {
      setError('Errore durante la pulizia della cronologia');
      console.error('Errore durante la pulizia della cronologia:', err);
    }
  }, [postMessage, setError]);

  /**
   * Esporta la cronologia dei prompt
   */
  const exportHistory = useCallback((format: 'json' | 'csv' | 'txt' = 'json'): void => {
    try {
      const message: ExportPromptHistoryMessage = {
        type: PromptHistoryMessageType.EXPORT_HISTORY,
        payload: {
          format
        }
      };
      postMessage<PromptHistoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante l\'esportazione della cronologia');
      console.error('Errore durante l\'esportazione della cronologia:', err);
    }
  }, [postMessage, setError]);

  // Filtra e ordina gli elementi della cronologia
  const filteredAndSortedItems = useMemo(() => {
    // Prima filtra
    let filtered = historyItems;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = historyItems.filter(item => 
        item.prompt.toLowerCase().includes(query) || 
        (item.tags?.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Poi ordina
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.timestamp - a.timestamp; // Più recente prima
      } else if (sortBy === 'type') {
        const typeOrder = { success: 0, pending: 1, error: 2 };
        const aType = a.type || 'pending';
        const bType = b.type || 'pending';
        return typeOrder[aType] - typeOrder[bType];
      }
      return 0;
    });
  }, [historyItems, searchQuery, sortBy]);

  // Imposta il listener per i messaggi e richiede i dati iniziali
  useEffect(() => {
    // Listener per i messaggi dall'estensione
    const handleMessage = (event: MessageEvent): void => {
      messageDispatcher(event.data);
    };
    
    // Aggiungi il listener
    window.addEventListener('message', handleMessage);
    
    // Richiedi la cronologia iniziale
    requestHistory();
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [requestHistory, messageDispatcher]);

  /**
   * Formatta una data come stringa locale
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Deseleziona l'elemento attualmente selezionato
   */
  const handleClearSelection = (): void => {
    setSelectedItem(null);
  };

  return (
    <div className="prompt-history-panel">
      <header className="panel-header">
        <h2>Cronologia Prompt</h2>
        <div className="panel-controls">
          <VSCodeTextField
            placeholder="Cerca prompt..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
          <VSCodeDropdown
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
          >
            <VSCodeOption value="date">Data</VSCodeOption>
            <VSCodeOption value="type">Tipo</VSCodeOption>
          </VSCodeDropdown>
          <VSCodeButton
            appearance="secondary"
            onClick={requestHistory}
          >
            Aggiorna
          </VSCodeButton>
        </div>
      </header>
      
      <VSCodeDivider />
      
      {isLoading ? (
        <div className="loading-container">
          <VSCodeProgressRing />
          <span>Caricamento cronologia...</span>
        </div>
      ) : error ? (
        <div className="error-container">
          <span className="error-message">{error}</span>
          <VSCodeButton onClick={() => setError(null)}>Chiudi</VSCodeButton>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="empty-history">
          <span>Nessun prompt trovato nella cronologia.</span>
        </div>
      ) : (
        <div className="history-items">
          {filteredAndSortedItems.map(item => (
            <div 
              key={item.id} 
              className={`history-item ${item.type || 'pending'} ${selectedItem === item.id ? 'selected' : ''}`}
            >
              <div className="item-header">
                <span className="item-timestamp">{formatDate(item.timestamp)}</span>
                <div className="item-actions">
                  <VSCodeButton
                    appearance="icon"
                    title="Usa questo prompt"
                    onClick={() => usePromptFromHistory(item.id)}
                  >
                    ↺
                  </VSCodeButton>
                  <VSCodeButton
                    appearance="icon"
                    title="Elimina questo prompt"
                    onClick={() => deleteHistoryItem(item.id)}
                  >
                    ×
                  </VSCodeButton>
                </div>
              </div>
              <div className="item-content" onClick={() => usePromptFromHistory(item.id)}>
                <p className="item-prompt">{item.prompt}</p>
                {item.result && (
                  <p className="item-result">{item.result}</p>
                )}
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="item-tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="item-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <VSCodeDivider />
      
      <footer className="panel-footer">
        <div className="footer-stats">
          <span>{filteredAndSortedItems.length} di {historyItems.length} prompt visualizzati</span>
        </div>
        <div className="footer-actions">
          {selectedItem && (
            <VSCodeButton
              appearance="secondary"
              onClick={handleClearSelection}
            >
              Deseleziona
            </VSCodeButton>
          )}
          <VSCodeButton
            appearance="secondary"
            disabled={historyItems.length === 0}
            onClick={clearHistory}
          >
            Pulisci Cronologia
          </VSCodeButton>
        </div>
      </footer>
    </div>
  );
}; 