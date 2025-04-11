/**
 * @file AgentMemoryPanel.tsx
 * @description Pannello per la visualizzazione e gestione della memoria dell'agente
 * @version 3.0.0
 * Implementa il pattern Union Dispatcher Type-Safe con validazione avanzata
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Card, Input, List, Popconfirm, Space, Tag, Tooltip, Typography, message } from 'antd';
import { DeleteOutlined, ClearOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import './AgentMemoryPanel.css';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { 
  AgentMemoryMessageType,
  MemoryItem,
  AgentMemory,
  RequestMemorySnapshotMessage,
  ClearAgentMemoryMessage,
  SaveMemoryItemMessage,
  DeleteMemoryItemMessage,
  AgentMemoryMessageUnion,
  MemorySnapshotReceivedMessage,
  MemoryItemSavedMessage,
  MemoryItemDeletedMessage,
  AgentMemoryClearedMessage
} from '../types/agent-memory-message';
import {
  isAgentMemoryClearedMessage,
  isMemoryItemDeletedMessage,
  isMemoryItemSavedMessage,
  isMemorySnapshotReceivedMessage,
  isAgentMemoryMessage
} from '../types/agent-memory-message-guards';
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentMemoryPanelProps {
  agentId: string;
}

/**
 * Componente per la visualizzazione e la gestione della memoria dell'agente
 * Implementa il pattern Union Dispatcher Type-Safe per la comunicazione con l'estensione
 * @param props Proprietà del componente
 * @returns Componente React
 */
const AgentMemoryPanel: React.FC<AgentMemoryPanelProps> = ({ agentId }) => {
  // Stato
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemoryContent, setNewMemoryContent] = useState<string>('');
  const [newMemoryTags, setNewMemoryTags] = useState<string>('');
  const [filterText, setFilterText] = useState<string>('');

  // Hook di comunicazione con l'estensione
  const { postMessage } = useExtensionMessage();

  /**
   * Dispatcher di messaggi type-safe per gestire i messaggi dalla estensione
   * Implementa il pattern Union Dispatcher Type-Safe
   * @param message Messaggio ricevuto dall'estensione
   */
  const messageDispatcher = useCallback((message: unknown): void => {
    // Verifico prima se è un messaggio di memoria dell'agente usando il type guard appropriato
    if (!isAgentMemoryMessage(message)) {
      return;
    }

    // Gestione dei messaggi in base al tipo utilizzando i type guards specifici
    if (isMemorySnapshotReceivedMessage(message)) {
      setMemoryItems(message.payload.memories);
      setLoading(false);
    } else if (isMemoryItemSavedMessage(message)) {
      // Aggiornamento della lista di memoria con il nuovo elemento
      setMemoryItems(prevItems => {
        // Verifica se l'elemento esiste già
        const existingIndex = prevItems.findIndex(item => item.id === message.payload.item.id);
        
        if (existingIndex >= 0) {
          // Aggiornamento dell'elemento esistente
          const updatedItems = [...prevItems];
          updatedItems[existingIndex] = message.payload.item;
          return updatedItems;
        } else {
          // Aggiunta del nuovo elemento
          return [...prevItems, message.payload.item];
        }
      });
      
      // Reset del form
      setNewMemoryContent('');
      setNewMemoryTags('');
      message.success('Elemento di memoria salvato con successo');
    } else if (isMemoryItemDeletedMessage(message)) {
      // Rimozione dell'elemento dalla lista
      setMemoryItems(prevItems => prevItems.filter(item => item.id !== message.payload.itemId));
      message.success('Elemento di memoria eliminato con successo');
    } else if (isAgentMemoryClearedMessage(message)) {
      // Pulizia completa della memoria
      setMemoryItems([]);
      message.success('Memoria dell\'agente pulita con successo');
    }
  }, []);

  // Gestione messaggi dall'estensione
  useEffect(() => {
    // Listener per i messaggi dall'estensione
    const handleMessage = (event: MessageEvent): void => {
      messageDispatcher(event.data);
    };

    // Aggiunta del listener
    window.addEventListener('message', handleMessage);

    // Richiesta iniziale dello snapshot della memoria
    requestMemorySnapshot();

    // Pulizia alla disattivazione
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [agentId, messageDispatcher]); // Esegui solo quando cambiano l'agentId o messageDispatcher

  /**
   * Richiede uno snapshot della memoria dell'agente
   */
  const requestMemorySnapshot = useCallback((): void => {
    setLoading(true);
    setError(null);
    
    try {
      const message: RequestMemorySnapshotMessage = {
        type: AgentMemoryMessageType.REQUEST_MEMORY_SNAPSHOT,
        payload: {
          agentId
        }
      };
      postMessage<AgentMemoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante la richiesta dello snapshot della memoria');
      setLoading(false);
      console.error('Errore durante la richiesta dello snapshot della memoria:', err);
    }
  }, [agentId, postMessage]);

  /**
   * Salva un nuovo elemento di memoria
   */
  const saveMemoryItem = useCallback((): void => {
    if (!newMemoryContent.trim()) {
      message.warning('Inserisci un contenuto per l\'elemento di memoria');
      return;
    }

    // Estrazione dei tag dal testo
    const tags = newMemoryTags
      ? newMemoryTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      : [];

    try {
      const message: SaveMemoryItemMessage = {
        type: AgentMemoryMessageType.SAVE_MEMORY_ITEM,
        payload: {
          agentId,
          content: newMemoryContent,
          tags
        }
      };
      postMessage<AgentMemoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante il salvataggio dell\'elemento di memoria');
      console.error('Errore durante il salvataggio dell\'elemento di memoria:', err);
    }
  }, [agentId, newMemoryContent, newMemoryTags, postMessage]);

  /**
   * Elimina un elemento di memoria
   * @param itemId ID dell'elemento da eliminare
   */
  const deleteMemoryItem = useCallback((itemId: string): void => {
    try {
      const message: DeleteMemoryItemMessage = {
        type: AgentMemoryMessageType.DELETE_MEMORY_ITEM,
        payload: {
          agentId,
          itemId
        }
      };
      postMessage<AgentMemoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante l\'eliminazione dell\'elemento di memoria');
      console.error('Errore durante l\'eliminazione dell\'elemento di memoria:', err);
    }
  }, [agentId, postMessage]);

  /**
   * Pulisce tutta la memoria dell'agente
   */
  const clearAgentMemory = useCallback((): void => {
    try {
      const message: ClearAgentMemoryMessage = {
        type: AgentMemoryMessageType.CLEAR_AGENT_MEMORY,
        payload: {
          agentId
        }
      };
      postMessage<AgentMemoryMessageUnion>(message);
    } catch (err) {
      setError('Errore durante la pulizia della memoria dell\'agente');
      console.error('Errore durante la pulizia della memoria dell\'agente:', err);
    }
  }, [agentId, postMessage]);

  // Filtra gli elementi di memoria in base al testo di ricerca
  const filteredMemoryItems = useMemo(() => {
    if (!filterText) {
      return memoryItems;
    }
    
    const lowerCaseFilter = filterText.toLowerCase();
    return memoryItems.filter(item => 
      item.content.toLowerCase().includes(lowerCaseFilter) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerCaseFilter))
    );
  }, [memoryItems, filterText]);

  return (
    <div className="agent-memory-panel">
      <header className="memory-panel-header">
        <Title level={4}>Memoria dell'Agente</Title>
        <div className="search-container">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Cerca nella memoria..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            allowClear
          />
        </div>
      </header>

      <div className="memory-add-form">
        <TextArea
          placeholder="Aggiungi un nuovo elemento alla memoria..."
          value={newMemoryContent}
          onChange={(e) => setNewMemoryContent(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <div className="memory-form-footer">
          <Input
            placeholder="Tag (separati da virgole)"
            value={newMemoryTags}
            onChange={(e) => setNewMemoryTags(e.target.value)}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveMemoryItem}
            disabled={!newMemoryContent.trim()}
          >
            Salva
          </Button>
        </div>
      </div>

      <div className="memory-list-container">
        {loading ? (
          <div className="loading-container">
            <span>Caricamento memoria dell'agente...</span>
          </div>
        ) : filteredMemoryItems.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={filteredMemoryItems}
            renderItem={(item) => (
              <Card className="memory-item" key={item.id}>
                <div className="memory-content">
                  <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'altro' }}>
                    {item.content}
                  </Paragraph>
                </div>
                <div className="memory-meta">
                  <div className="memory-tags">
                    {item.tags?.map(tag => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </div>
                  <div className="memory-actions">
                    <Space>
                      <Text type="secondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                      <Tooltip title="Elimina elemento">
                        <Popconfirm
                          title="Sei sicuro di voler eliminare questo elemento?"
                          onConfirm={() => deleteMemoryItem(item.id)}
                          okText="Sì"
                          cancelText="No"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                          />
                        </Popconfirm>
                      </Tooltip>
                    </Space>
                  </div>
                </div>
              </Card>
            )}
          />
        ) : (
          <div className="empty-memory">
            <p>Nessun elemento di memoria trovato.</p>
          </div>
        )}
      </div>

      <div className="memory-panel-footer">
        <div className="memory-stats">
          <Text type="secondary">
            {filteredMemoryItems.length} elementi {filterText ? 'filtrati' : 'totali'}
          </Text>
        </div>
        <Popconfirm
          title="Sei sicuro di voler cancellare tutta la memoria?"
          onConfirm={clearAgentMemory}
          okText="Sì"
          cancelText="No"
        >
          <Button
            danger
            icon={<ClearOutlined />}
            disabled={memoryItems.length === 0}
          >
            Pulisci Memoria
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
};

export default AgentMemoryPanel; 