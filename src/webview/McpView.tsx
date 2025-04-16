import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import * as vscode from 'vscode-webview'; // Not used directly
// import { Message } from '../types/messages'; // Commented out - path/export issue
// import { WebviewMessage } from '../types/webview.types'; // Commented out - path/export issue
// import { ApiConfiguration } from '../shared/types/api.types'; // Adjusted path
// import { ExtensionMessage } from '../shared/ExtensionMessage'; // Adjusted path
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
// import { useChat } from '../hooks/useChat'; // Commented out - path issue
// import { useSettings } from '../hooks/useSettings'; // Commented out - path issue

// Commented out unused interfaces
/*
interface Theme {
  name: string;
  colors: {
    [key: string]: string;
  };
}

interface Session {
  id: string;
  name: string;
  messages: Message[]; // Message type commented out
}

interface Agent {
  id: string;
  name: string;
  description: string;
}
*/

interface McpViewProps {
  code: string;
  language?: string;
}

const Container = styled.div`
  padding: 16px;
`;

const Title = styled.h2`
  color: var(--vscode-foreground);
  margin-bottom: 16px;
`;

const CodeBlock = styled.div`
  margin: 16px 0;
  background: var(--vscode-editor-background);
  border-radius: 4px;
  overflow: hidden;
`;

export function McpView({ code, language = 'typescript' }: McpViewProps) {
  // Removed unused state/hooks related to commented imports
  // const { settings } = useSettings();
  // const { sessions, currentSession, selectSession, createSession, deleteSession } = useChat();

  return (
    <Container data-testid="mcp-container">
      <Title>MCP View</Title>
      <CodeBlock data-testid="code-block">
        <SyntaxHighlighter
          language={language}
          style={docco}
          customStyle={{
            background: 'var(--vscode-editor-background)',
            padding: '16px',
          }}
          // Removed potentially problematic props if they rely on removed types
          // {...props} // Assuming this might have caused spread error
        >
          {code}
        </SyntaxHighlighter>
      </CodeBlock>
      {/* Removed UI elements related to sessions/agents if they caused errors */}
    </Container>
  );
}

export default McpView;
