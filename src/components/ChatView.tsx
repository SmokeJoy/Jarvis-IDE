import React, { useLayoutEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { AgentFlowDebugger } from './AgentFlowDebugger';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import './ChatView.css';
import { useLiveChatMessageReducer } from '../hooks/useLiveChatMessageReducer';

export const ChatView: React.FC = () => {
  const { state, dispatch } = useLiveChatMessageReducer();

  const containerRef = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const animationFrame = requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      });
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [state.messages]);

  return (
    <div 
      ref={containerRef}
      className="chat-container"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {state.messages.map((message, index) => (
        <ChatMessage
          key={index}
          parts={message.parts}
          onRetry={() => dispatch({ type: 'RETRY_MESSAGE', payload: { id: message.id, agentId: message.agentId } })}
        />
      ))}
      {state.isTyping && <TypingIndicator />}
      <AgentFlowDebugger />
    </div>
  );
};