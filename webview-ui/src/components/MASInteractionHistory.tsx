import React from 'react';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { useAgentState } from '../hooks/useAgentState';
import { AgentHistoryItem } from '../types/mas-memory';
import './MASInteractionHistory.css';

type Props = {
  agentId: string;
};

export const MASInteractionHistory: React.FC<Props> = ({ agentId }) => {
  const { postMessage } = useExtensionMessage();
  const [history, setHistory] = React.useState<AgentHistoryItem[]>([]);
  const agentState = useAgentState(agentId);

  React.useEffect(() => {
    postMessage({
      type: 'mas/request-history',
      payload: { agentId }
    });

    const handler = (event: MessageEvent) => {
      if (event.data.type === 'mas/history-update' && 
          event.data.payload.agentId === agentId) {
        setHistory(event.data.payload.history);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [agentId, postMessage]);

  const handleRetry = (requestId: string) => {
    postMessage({
      type: 'mas/request-retry',
      payload: { agentId, requestId }
    });
  };

  return (
    <div className="mas-interaction-history">
      <h3>Cronologia Interazioni - {agentState?.name}</h3>
      
      <div className="history-list">
        {history.map((item) => (
          <div key={item.requestId} className="history-item">
            <div className="item-header">
              <span className="provider">{item.provider}</span>
              <span className="timestamp">{new Date(item.timestamp).toLocaleString()}</span>
              <button 
                className="retry-btn"
                onClick={() => handleRetry(item.requestId)}
                disabled={!item.retryAvailable}
              >
                Riprova
              </button>
            </div>
            
            <div className="prompt-section">
              <label>Prompt:</label>
              <pre>{item.prompt}</pre>
            </div>
            
            <div className="response-section">
              <label>Risposta:</label>
              <pre>{item.response}</pre>
            </div>
            
            <div className="metrics">
              <span>Tempo: {item.executionTime}ms</span>
              <span>Tentativi: {item.retryCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};