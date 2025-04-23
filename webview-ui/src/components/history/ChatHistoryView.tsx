import React, { useEffect, useState } from 'react';
import { ChatMessage } from '../../../src/types/extension';
import styled from 'styled-components';
import { vscode } from '../../utilities/vscode';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  padding: 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const Title = styled.h2`
  margin: 0;
  color: var(--vscode-editor-foreground);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--vscode-button-hoverBackground);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
`;

const MessageWrapper = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RoleBadge = styled.span<{ isUser: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background-color: ${props => props.isUser ? 'var(--vscode-button-background)' : 'var(--vscode-badge-background)'};
  color: ${props => props.isUser ? 'var(--vscode-button-foreground)' : 'var(--vscode-badge-foreground)'};
`;

const Timestamp = styled.span`
  font-size: 0.8rem;
  color: var(--vscode-descriptionForeground);
`;

const MessageContent = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: var(--vscode-editor-inactiveSelectionBackground);
  white-space: pre-wrap;
  word-break: break-word;
`;

const ErrorMessage = styled.div`
  color: var(--vscode-errorForeground);
  padding: 1rem;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vscode-descriptionForeground);
  text-align: center;
  padding: 2rem;
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: var(--vscode-editor-foreground);
`;

const EmptyStateText = styled.p`
  margin: 0;
  line-height: 1.5;
`;

export const ChatHistoryView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carica la cronologia all'avvio
    vscode.postMessage({ type: 'loadChatHistory' });

    // Gestione messaggi
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'chatHistory':
          setMessages((msg.payload as unknown));
          setIsLoading(false);
          break;
        case 'chatHistoryCleared':
          setMessages([]);
          break;
        case 'chatHistoryError':
          setError((msg.payload as unknown));
          setIsLoading(false);
          break;
        case 'chatExport':
          // Gestione esportazione
          const blob = new Blob([(msg.payload as unknown)], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'chat-history.md';
          a.click();
          URL.revokeObjectURL(url);
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutta la cronologia?')) {
      vscode.postMessage({ type: 'clearChatHistory' });
    }
  };

  const handleExportMarkdown = () => {
    vscode.postMessage({ type: 'exportChatHistory' });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <Container>Caricamento cronologia...</Container>;
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  if (messages.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Cronologia Chat</Title>
          <ButtonGroup>
            <Button onClick={handleExportMarkdown}>
              Esporta Markdown
            </Button>
            <Button onClick={handleClearHistory}>
              Cancella Cronologia
            </Button>
          </ButtonGroup>
        </Header>
        <EmptyState>
          <EmptyStateTitle>Nessun messaggio</EmptyStateTitle>
          <EmptyStateText>
            La cronologia della chat è vuota.<br />
            Inizia una nuova conversazione per vedere i messaggi qui.
          </EmptyStateText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Cronologia Chat</Title>
        <ButtonGroup>
          <Button onClick={handleExportMarkdown}>
            Esporta Markdown
          </Button>
          <Button onClick={handleClearHistory}>
            Cancella Cronologia
          </Button>
        </ButtonGroup>
      </Header>

      <MessagesContainer>
        {messages.map((message) => (
          <MessageWrapper key={message.id} isUser={message.role === 'user'}>
            <MessageHeader>
              <RoleBadge isUser={message.role === 'user'}>
                {message.role === 'user' ? 'Utente' : 'Assistente'}
              </RoleBadge>
              <Timestamp>{formatTimestamp(message.timestamp)}</Timestamp>
            </MessageHeader>
            <MessageContent>{message.content}</MessageContent>
          </MessageWrapper>
        ))}
      </MessagesContainer>
    </Container>
  );
}; 