import React from 'react';
import { RetryPromptButton } from '../RetryPromptButton';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { ChatMessage, MessagePart } from '../../types/webview';
import { AgentBadge } from "./AgentBadge";

type ChatMessageProps = {
  message: ChatMessage;
};

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const renderContentPart = (part: MessagePart, index: number) => {
    if (part.type === 'text') {
      return <span key={index}>{part.content}</span>;
    }
    
    if (part.type === 'code') {
      return (
        <div className="code-block" key={index}>
          <div className="code-header">
            <span className="language-tag">{part.language}</span>
            <VSCodeTooltip>
              <VSCodeButton 
                className="copy-button"
                onClick={() => handleCopyCode(part.content)}
                appearance="icon"
                aria-label={t('chat.copyCode')}
              >
                📋
              </VSCodeButton>
              <span slot="tooltip">{t('chat.copyCode')}</span>
            </VSCodeTooltip>
          </div>
          <pre><code>{part.content}</code></pre>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`message ${message.role} ${message.agentId ? 'has-agent' : ''}`}>  
      <div className="message-header">
        <span className="role-label">
          {message.role === 'user' ? 'Tu' : 'Jarvis'}
        </span>
        {message.agentId && (
          <>
            <AgentBadge agentId={message.agentId} eventType={message.eventType} />
            {message.threadId && (
              <span className="thread-id-label">🧵 {message.threadId}</span>
            )}
          </>
        )}
        <span className="timestamp">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="message-content">
        {message.parts.map(renderContentPart)}
      </div>
      {message.role === 'system' && message.content.includes('⚠️') && (
        <RetryPromptButton originalMessageId={message.id} />
      )}
    </div>
  );
};