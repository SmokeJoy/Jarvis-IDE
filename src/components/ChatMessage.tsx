import React from 'react';
import { MessagePart } from '../types/chat';
import { VSCodeButton, VSCodeBadge } from '@vscode/webview-ui-toolkit/react';

interface ChatMessageProps {
  parts: MessagePart[];
  onRetry?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ parts, onRetry }) => {
  const renderPart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case 'text':
        return <div key={index} className="message-text">{part.content}</div>;
      case 'code':
        return (
          <pre key={index} className="message-code">
            <code>{part.content}</code>
          </pre>
        );
      case 'error':
        return (
          <div key={index} className="message-error">
            <VSCodeBadge>Error</VSCodeBadge>
            <span>{part.content}</span>
            {onRetry && (
              <VSCodeButton onClick={onRetry} aria-label="Riprova">
                <span slot="start" className="codicon codicon-refresh" />
                Riprova
              </VSCodeButton>
            )}
          </div>
        );
      case 'image':
        return (
          <div key={index} className="message-image-container">
            <img 
              src={part.url} 
              alt={part.altText || 'Immagine'}
              className="message-image"
              loading="lazy"
              style={{ maxWidth: part.maxWidth || '100%' }}
            />
            {part.caption && 
              <div className="image-caption">{part.caption}</div>}
          </div>
        );
      case 'link':
        return (
          <a
            href={part.url}
            className="message-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.text || part.url}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-message" role="log" aria-live="polite">
      {parts.map(renderPart)}
    </div>
  );
};