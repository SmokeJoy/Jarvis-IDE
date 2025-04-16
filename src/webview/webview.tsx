import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
// import * as vscode from 'vscode-webview'; // Import globale non usato direttamente
import type { VSCodeAPI } from 'vscode-webview'; // Correct import for the type
// import { useAuth } from '../../hooks/useAuth'; // Commented out - path issue?
// import { useSettings } from '../../hooks/useSettings'; // Commented out - path issue?
// Adjusted paths for shared types - assuming relative to src root or similar
import type { BaseMessage, MessageRole, MessagePart } from '../shared/types/common'; // Added MessagePart
import type { ApiConfiguration } from '../shared/types/global';
import {
  type WebviewMessage, // Keep type import for the interface
  WebviewMessageType, // Regular import for the enum
} from '../shared/types/webview.types';
import { type ChatMessage, createChatMessage, ContentType } from '../shared/types/chat.types';
// import { VSCodeAPI } from '../../src/types/vscode-webview.d'; // Removed incorrect import path
import { McpView } from './McpView';

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

// Local type definitions for messages coming FROM the extension
// These might need alignment with actual ExtensionMessage types
interface ResponseMessage {
  type: 'response';
  response: ChatMessage; // Assuming response contains a ChatMessage
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

type LocalWebviewMessage = ResponseMessage | ChunkMessage | ErrorMessage | McpConnectionMessage;

export function Webview({ config }: WebviewProps) {
  // Changed state to use ChatMessage[]
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mcpConnected, setMcpConnected] = useState(false);
  // const { user } = useAuth(); // Commented out
  // const { settings } = useSettings(); // Commented out
  const vscodeRef = useRef<VSCodeAPI | null>(null); // Use the correctly imported type

  useEffect(() => {
    // Initialize vscodeRef
    if (typeof acquireVsCodeApi === 'function') {
      vscodeRef.current = acquireVsCodeApi();
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as LocalWebviewMessage;
      switch (message.type) {
        case 'response':
          // Ensure the response is a valid ChatMessage before adding
          if (message.response && typeof message.response === 'object' && message.response.role && message.response.content) {
             setMessages((prev) => [...prev, message.response]);
          } else {
             console.error('Invalid response message structure:', message.response);
             // Optionally add an error message to chat
             setMessages((prev) => [...prev, createChatMessage({ role: 'system', content: 'Received invalid response structure', timestamp: Date.now()})]);
          }
          setIsLoading(false);
          break;
        case 'chunk':
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            // Now operates on ChatMessage
            if (lastMessage && lastMessage.role === 'assistant') {
              // Content is string | ContentBlock[]
              let currentContent = lastMessage.content;
              let newContent: string | MessagePart[];

              if (typeof currentContent === 'string') {
                 newContent = currentContent + message.chunk;
              } else if (Array.isArray(currentContent)) {
                 // Add to the last text block or create a new one
                 const lastPart = currentContent[currentContent.length - 1];
                 if (lastPart?.type === ContentType.Text) { // Use ContentType enum
                    newContent = [
                       ...currentContent.slice(0, -1),
                       { ...lastPart, text: lastPart.text + message.chunk }
                    ];
                 } else {
                    newContent = [...currentContent, { type: ContentType.Text, text: message.chunk }];
                 }
              } else {
                 // Should not happen based on ChatMessage type, but handle defensively
                 newContent = [{ type: ContentType.Text, text: message.chunk }];
              }

              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: newContent, streaming: true }, // Keep streaming flag?
              ];
            }
            // Create new assistant message if needed
            return [
              ...prev,
              createChatMessage({ role: 'assistant', content: [{ type: ContentType.Text, text: message.chunk }], timestamp: Date.now(), streaming: true }),
            ];
          });
          break;
        case 'error':
          console.error(message.error);
          // Add error as a system message in chat
          setMessages((prev) => [...prev, createChatMessage({ role: 'system', content: `Error: ${message.error}`, timestamp: Date.now()})]);
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

    // Post ready message?
    // vscodeRef.current?.postMessage({ type: WebviewMessageType.READY });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || !vscodeRef.current) return;

    // userMessage is now ChatMessage, matching the state type
    const userMessage: ChatMessage = createChatMessage({ role: 'user', content: [{ type: ContentType.Text, text: input }], timestamp: Date.now() });

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages); // Update state with the new array
    setInput('');
    setIsLoading(true);

    vscodeRef.current.postMessage({
      type: WebviewMessageType.SEND_PROMPT,
      // Send the current chat history along with the prompt
      payload: { prompt: input, messages: currentMessages },
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
          {/* Now iterating over ChatMessage[] */} 
          {messages.map((message, index) => (
            <MessageItem key={message.id || index} role={message.role}> {/* Use message.id as key */} 
              {/* Accessing content from ChatMessage */} 
              {typeof message.content === 'string'
                 ? message.content
                 : Array.isArray(message.content)
                    ? message.content.map((part: MessagePart, i: number) => (
                       <span key={i}>{part.type === ContentType.Text ? part.text : '[Image]'}</span>
                    ))
                    : '[Invalid Content]'}
            </MessageItem>
          ))}
          {isLoading && <div>Loading...</div>}
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
      {mcpConnected && <McpView code="" />} {/* Pass necessary props to McpView */}
    </Container>
  );
}
