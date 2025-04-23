import React, { useState, useEffect, useCallback } from 'react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MasMessageType, AgentRetryRequestMessage, AgentRetryResultMessage } from '@shared/messages';
import { isAgentRetryResultMessage } from '../types/mas-message-guards';

interface RetryPanelProps {
  agentId?: string;
}

export const RetryPanel: React.FC<RetryPanelProps> = ({ agentId = 'default' }) => {
  const { postMessage } = useExtensionMessage();
  const [retryHistory, setRetryHistory] = useState<Array<{timestamp: number; status: string; message: string}>>([]);
  const [pending, setPending] = useState(false);

  const handleRetry = useCallback(() => {
    setPending(true);
    const message: AgentRetryRequestMessage = {
      type: MasMessageType.AGENT_RETRY_REQUEST,
      payload: { agentId },
    };
    postMessage(message);
  }, [postMessage, agentId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (isAgentRetryResultMessage(event.data)) {
        // Verifichiamo che il messaggio sia per l'agente corretto
        if ((msg.payload as unknown).agentId === agentId) {
          setRetryHistory(prev => [...prev, {
            timestamp: Date.now(),
            status: (msg.payload as unknown).success ? 'Successo' : 'Fallito',
            message: (msg.payload as unknown).message || ''
          }]);
          setPending(false);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [agentId]);

  return (
    <div className="retry-panel">
      <div className="panel-header">
        <h2>Stato Retry</h2>
        <button 
          onClick={handleRetry}
          disabled={pending}
          aria-label="Riprova operazione"
        >
          {pending ? 'In corso...' : 'Riprova'}
        </button>
      </div>
      <ul className="retry-history">
        {retryHistory.map((entry, index) => (
          <li key={index}>
            {new Date(entry.timestamp).toLocaleTimeString()} - {entry.status} 
            {entry.message && `: ${entry.message}`}
          </li>
        ))}
      </ul>
    </div>
  );
};