import React, { useState, useEffect } from 'react';
import { useExtensionMessage } from '../../hooks/useExtensionMessage';
import { useExtensionState } from '../../context/ExtensionStateContext';
import {
  type MultiAgentMessage,
  MultiAgentMessageType,
} from '../../../../webview/messages/multi-agent-message';
import {
  isAgentStatusUpdateMessage,
} from '../../../../webview/messages/multi-agent-message-guards';

export const MultiAgentControl = () => {
  const [agents, setAgents] = useState<Array<{ id: string; name: string; active: boolean }>>([]);
  const [error, setError] = useState<string>('');

  const { postMessage, onMessage } = useExtensionMessage<MultiAgentMessage>();
  const { state } = useExtensionState();

  useEffect(() => {
    postMessage({ type: MultiAgentMessageType.REQUEST_AGENT_STATUS });

    const unsubscribe = onMessage((message: MultiAgentMessage) => {
      if (isAgentStatusUpdateMessage(message)) {
        setAgents((msg.payload as unknown).agents);
        setError('');
      } else if (isAgentErrorMessage(message)) {
        setError(`Errore agente ${(msg.payload as unknown).agentId}: ${(msg.payload as unknown).error}`);
      }
    });

    return unsubscribe;
  }, []);

  const handleToggleAgent = (agentId: string, activate: boolean) => {
    postMessage({
      type: MultiAgentMessageType.TOGGLE_AGENT,
      payload: { agentId, activate },
    });
  };

  return (
    <div className="multi-agent-panel">
      <h3>Controllo Agenti</h3>
      {error && <div className="error-banner">{error}</div>}

      <div className="agent-list">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-item">
            <span className="agent-name">{agent.name}</span>
            <span className="agent-status">{agent.active ? 'Attivo' : 'Inattivo'}</span>
            <button
              onClick={() => handleToggleAgent(agent.id, !agent.active)}
              className={agent.active ? 'btn-deactivate' : 'btn-activate'}
            >
              {agent.active ? 'Disattiva' : 'Attiva'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
