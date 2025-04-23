import React, { useState, useEffect } from 'react';
import { useExtensionMessage, useExtensionState } from '@hooks/';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';

type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
};

export const ChatView = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { postMessage } = useExtensionMessage();
  const { state } = useExtensionState();

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    postMessage({ type: 'SEND_PROMPT', payload: { prompt: input } });
    setInput('');
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'ASSISTANT_RESPONSE') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: (msg.payload as unknown).response,
          role: 'assistant',
          timestamp: Date.now(),
        }]);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Scrivendo...</div>}
      </div>

      <div className="input-area">
        <VSCodeTextArea
          value={input}
          onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && handleSend()}
          rows={3}
          resize="vertical"
        />
        <VSCodeButton onClick={handleSend}>
          Invia (Ctrl+Invio)
        </VSCodeButton>
      </div>
    </div>
  );
};