import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import * as vscode from 'vscode-webview';
import { BaseMessage, MessageRole } from '../shared/types/message';
import { ApiConfiguration } from '../shared/types/global';
import { McpView } from './McpView';
import { createSafeMessage } from "../shared/types/message";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
`;

const Header = styled.header`
  padding: 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageItem = styled.div<{ role: MessageRole }>`
  padding: 12px;
  border-radius: 8px;
  background: ${(props) =>
    props.role === 'user'
      ? 'var(--vscode-input-background)'
      : props.role === 'assistant'
        ? 'var(--vscode-editor-selectionBackground)'
        : props.role === 'system'
          ? 'var(--vscode-editorInfo-background)'
          : 'var(--vscode-editorWarning-background)'};
  color: var(--vscode-editor-foreground);
`;

const Footer = styled.footer`
  padding: 16px;
  border-top: 1px solid var(--vscode-panel-border);
`;

const Input = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  resize: none;
  min-height: 80px;
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  margin-top: 8px;
  border: none;
  border-radius: 4px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  &:hover {
    background: var(--vscode-button-hoverBackground);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface WebviewProps {
  config: ApiConfiguration;
}

interface ResponseMessage {
  type: 'response';
  response: BaseMessage;
}

interface ChunkMessage {
  type: 'chunk';
  chunk: string;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

interface McpConnectionMessage {
  type: 'mcpConnected' | 'mcpDisconnected';
}

type WebviewMessage = ResponseMessage | ChunkMessage | ErrorMessage | McpConnectionMessage;

export function Webview({ config }: WebviewProps) {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mcpConnected, setMcpConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WebviewMessage;
      switch (message.type) {
        case 'response':
          setMessages((prev) => [...prev, message.response]);
          setIsLoading(false);
          break;
        case 'chunk':
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content:
                    typeof lastMessage.content === 'string'
                      ? lastMessage.content + message.chunk
                      : [...lastMessage.content, { type: 'text', text: message.chunk }],
                },
              ];
            }
            return [
              ...prev,
              createSafeMessage({role: 'assistant', content: message.chunk, timestamp: Date.now()}),
            ];
          });
          break;
        case 'error':
          console.error(message.error);
          setIsLoading(false);
          break;
        case 'mcpConnected':
          setMcpConnected(true);
          break;
        case 'mcpDisconnected':
          setMcpConnected(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: BaseMessage = createSafeMessage({role: 'user', content: input, timestamp: Date.now()});

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      type: 'chat',
      messages: [...messages, userMessage],
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Container>
      <Header>
        <Title>Jarvis IDE</Title>
      </Header>
      <Content>
        <MessageList>
          {messages.map((message, index) => (
            <MessageItem key={index} role={message.role}>
              {typeof message.content === 'string'
                ? message.content
                : message.content.map((part, i) => (
                    <span key={i}>{part.type === 'text' ? part.text : '[Image]'}</span>
                  ))}
            </MessageItem>
          ))}
        </MessageList>
      </Content>
      <Footer>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button onClick={handleSubmit} disabled={!input.trim() || isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </Footer>
      {mcpConnected && <McpView code="" />}
    </Container>
  );
}
