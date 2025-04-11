/**
 * @file useAgentMemory.ts
 * @description Hook personalizzato per gestire la memoria degli agenti e le funzionalità di retry
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useExtensionMessage } from './useExtensionMessage';
import { 
  MasMessageType, 
  AgentMemorySnapshotRequestMessage,
  AgentMemorySnapshotResponseMessage,
  AgentTaskRetryRequestMessage,
  AgentTaskRetryResultMessage,
  AgentMessageUnion 
} from '../types/mas-message';
import { isMessageOfType, isAgentMemorySnapshotResponseMessage, isAgentTaskRetryResultMessage } from '../types/mas-message-guards';

/**
 * Interfaccia per il task dell'agente
 */
export interface AgentTask {
  id: string;
  description: string;
  parameters?: Record<string, any>;
  context?: any;
}

/**
 * Interfaccia per un elemento di memoria dell'agente
 */
export interface AgentMemoryItem {
  id: string;
  agentId: string;
  task: AgentTask;
  result?: any;
  status: 'completed' | 'failed' | 'in_progress';
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Interfaccia per lo stato di retry di un task
 */
export interface RetryStatus {
  inProgress: boolean;
  success?: boolean;
  result?: any;
  error?: string;
  timestamp?: number;
}

/**
 * Mappa degli stati di retry per i diversi task
 */
export interface RetryStatusMap {
  [taskId: string]: RetryStatus;
}

/**
 * Parametri opzionali per l'operazione di retry
 */
export interface RetryParams {
  context?: any;
  overrideParameters?: Record<string, any>;
  priority?: number;
}

/**
 * Opzioni per l'hook useAgentMemory
 */
export interface UseAgentMemoryOptions {
  agentId: string;
  autoLoad?: boolean;
  limit?: number;
}

/**
 * Hook personalizzato per gestire la memoria degli agenti
 * Implementa il pattern Union Dispatcher Type-Safe
 */
export const useAgentMemory = ({
  agentId,
  autoLoad = false,
  limit = 10
}: UseAgentMemoryOptions) => {
  // State per la memoria dell'agente
  const [memory, setMemory] = useState<AgentMemoryItem[]>([]);
  // State per il caricamento
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State per lo stato di retry dei task
  const [retryStatus, setRetryStatus] = useState<RetryStatusMap>({});

  // Hook per la comunicazione type-safe con l'estensione
  const { postMessage, addMessageListener, removeMessageListener } = useExtensionMessage();

  /**
   * Gestisce i messaggi in arrivo dall'estensione
   */
  const handleIncomingMessage = useCallback(
    (event: MessageEvent) => {
      const message = event.data;

      // Verifica se il messaggio è una risposta di snapshot della memoria
      if (isMessageOfType<AgentMemorySnapshotResponseMessage>(
        message,
        MasMessageType.AGENT_MEMORY_SNAPSHOT_RESPONSE
      )) {
        if (message.payload.agentId === agentId) {
          setMemory(message.payload.items);
          setIsLoading(false);
        }
      }
      
      // Verifica se il messaggio è un risultato di retry di un task
      else if (isMessageOfType<AgentTaskRetryResultMessage>(
        message,
        MasMessageType.AGENT_TASK_RETRY_RESULT
      )) {
        if (message.payload.agentId === agentId) {
          const { taskId, success, result, error } = message.payload;
          
          setRetryStatus(prev => ({
            ...prev,
            [taskId]: {
              inProgress: false,
              success,
              result,
              error,
              timestamp: Date.now()
            }
          }));
          
          // Aggiorna la memoria se il retry ha avuto successo
          if (success) {
            loadMemory();
          }
        }
      }
    },
    [agentId]
  );

  /**
   * Richiede uno snapshot della memoria dell'agente
   */
  const loadMemory = useCallback(() => {
    setIsLoading(true);
    
    // Creazione del messaggio type-safe
    const message: AgentMemorySnapshotRequestMessage = {
      type: MasMessageType.AGENT_MEMORY_SNAPSHOT_REQUEST,
      payload: {
        agentId,
        limit
      }
    };
    
    // Invio del messaggio tramite il dispatcher type-safe
    postMessage<AgentMessageUnion>(message);
  }, [agentId, limit, postMessage]);

  /**
   * Riprova un task specifico
   */
  const retryTask = useCallback(
    (taskId: string, params?: RetryParams) => {
      // Marca il task come "in corso di retry"
      setRetryStatus(prev => ({
        ...prev,
        [taskId]: {
          inProgress: true,
          timestamp: Date.now()
        }
      }));
      
      // Creazione del messaggio type-safe
      const message: AgentTaskRetryRequestMessage = {
        type: MasMessageType.AGENT_TASK_RETRY_REQUEST,
        payload: {
          agentId,
          taskId,
          context: params?.context,
          overrideParameters: params?.overrideParameters,
          priority: params?.priority
        }
      };
      
      // Invio del messaggio tramite il dispatcher type-safe
      postMessage<AgentMessageUnion>(message);
    },
    [agentId, postMessage]
  );

  /**
   * Resetta lo stato di retry per un task specifico
   */
  const resetRetryStatus = useCallback(
    (taskId: string) => {
      setRetryStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[taskId];
        return newStatus;
      });
    },
    []
  );

  // Configura il listener di messaggi e carica la memoria se autoLoad è abilitato
  useEffect(() => {
    addMessageListener(handleIncomingMessage);
    
    if (autoLoad) {
      loadMemory();
    }
    
    return () => {
      removeMessageListener(handleIncomingMessage);
    };
  }, [autoLoad, addMessageListener, removeMessageListener, handleIncomingMessage, loadMemory]);

  return {
    memory,
    isLoading,
    retryTask,
    retryStatus,
    resetRetryStatus,
    loadMemory
  };
}; 