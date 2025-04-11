import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import * as vscode from 'vscode-webview';
import type { Message } from '../types/messages.js';
import type { WebviewMessage } from '../types/webview.types.js';
import type { ApiConfiguration } from '../shared/types/api.types.js';
import type { ExtensionMessage } from '../shared/ExtensionMessage.js';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';

interface Theme {
  name: string;
  colors: {
    [key: string]: string;
  };
}

interface Session {
  id: string;
  name: string;
  messages: Message[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
}

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

export function McpView({ code, language = "typescript" }: McpViewProps) {
  return (
    <Container data-testid="mcp-container">
      <Title>MCP View</Title>
      <CodeBlock data-testid="code-block">
                    <SyntaxHighlighter
          language={language}
          style={docco}
          customStyle={{
            background: "var(--vscode-editor-background)",
            padding: "16px",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </CodeBlock>
    </Container>
  );
}

export default McpView;