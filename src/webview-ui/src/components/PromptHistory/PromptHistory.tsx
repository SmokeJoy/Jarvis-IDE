import React, { useState, useEffect } from 'react';
import { useExtensionMessage } from '../../hooks/useExtensionMessage';
import { useExtensionState } from '../../context/ExtensionStateContext';
import {
  PromptHistoryMessageType,
  type PromptHistoryEntry,
  type PromptHistoryMessageUnion,
} from '../../../../webview/messages/prompt-history-message';
import {
  isPromptHistoryLoadedMessage,
  isPromptHistoryUpdatedMessage,
  isPromptHistoryErrorMessage,
} from '../../../../webview/messages/prompt-history-message-guards';

export const PromptHistory = () => {
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
  const [error, setError] = useState<string>('');

  const { postMessage, onMessage } = useExtensionMessage<PromptHistoryMessageUnion>();
  const { state } = useExtensionState();

  useEffect(() => {
    postMessage({ type: PromptHistoryMessageType.REQUEST_HISTORY });

    const unsubscribe = onMessage((message: PromptHistoryMessageUnion) => {
      if (isPromptHistoryLoadedMessage(message)) {
        setHistory((msg.payload as unknown));
        setError('');
      } else if (isPromptHistoryUpdatedMessage(message)) {
        if ((msg.payload as unknown)?.newEntry) {
          setHistory((prev) => [(msg.payload as unknown).newEntry!, ...prev]);
        }
      } else if (isPromptHistoryErrorMessage(message)) {
        setError(`Errore cronologia: ${(msg.payload as unknown)?.error ?? 'Unknown error'}`);
      }
    });

    return unsubscribe;
  }, []);

  const handleSavePrompt = (promptText: string) => {
    postMessage({
      type: PromptHistoryMessageType.SAVE_PROMPT,
      payload: {
        prompt: promptText,
        agentId: state.activeAgentId,
      },
    });
  };

  return (
    <div className="prompt-history-panel">
      <h3>Cronologia Prompt</h3>
      {error && <div className="error-banner">{error}</div>}

      <div className="history-list">
        {history.map((entry) => (
          <div key={entry.id} className="history-item">
            <div className="prompt-preview">{entry.prompt.substring(0, 100)}</div>
            <div className="timestamp">{new Date(entry.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
