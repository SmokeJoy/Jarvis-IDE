import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  VSCodeButton, 
  VSCodeDivider 
} from '@vscode/webview-ui-toolkit/react';
import { vscode } from '../../utils/vscode';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
`;

const TextareaContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vscode-editor-foreground);
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 2px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const StatusMessage = styled.div<{ isSuccess: boolean }>`
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: ${props => props.isSuccess 
    ? 'var(--vscode-terminal-ansiGreen)' 
    : 'var(--vscode-errorForeground)'};
  color: var(--vscode-editor-background);
  opacity: 0.9;
  margin-right: auto;
`;

const FilePath = styled.div`
  font-size: 0.8rem;
  font-style: italic;
  color: var(--vscode-descriptionForeground);
  margin-top: 0.5rem;
`;

interface SystemPromptEditorProps {
  onClose?: () => void;
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [statusMessage, setStatusMessage] = useState<{text: string, isSuccess: boolean} | null>(null);
  const [loading, setLoading] = useState(true);

  // Carica il contenuto del system prompt all'avvio
  useEffect(() => {
    setLoading(true);
    vscode.postMessage({
      type: 'getSystemPrompt'
    });
    
    // Ascolta i messaggi in arrivo
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'systemPromptLoaded') {
        console.log('System prompt caricato');
        setContent(message.content);
        setOriginalContent(message.content);
        setFilePath(message.filePath || '');
        setLoading(false);
      }
      
      if (message.type === 'systemPromptSaved') {
        showStatusMessage('System prompt salvato con successo', true);
        setOriginalContent(content);
      }
      
      if (message.type === 'error' && message.message.includes('system prompt')) {
        showStatusMessage(`Errore: ${message.message}`, false);
        setLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Mostra un messaggio di stato temporaneo
  const showStatusMessage = (text: string, isSuccess: boolean) => {
    setStatusMessage({ text, isSuccess });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  // Handler per la modifica del testo
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Handler per il salvataggio
  const handleSave = () => {
    vscode.postMessage({
      type: 'saveSystemPrompt',
      content
    });
  };

  // Handler per ripristinare le modifiche
  const handleReset = () => {
    setContent(originalContent);
    showStatusMessage('Modifiche annullate', true);
  };

  // Handler per aprire il file in VS Code
  const handleOpenInVSCode = () => {
    vscode.postMessage({
      type: 'openSystemPromptFile'
    });
  };

  // Controllo se ci sono modifiche non salvate
  const hasChanges = content !== originalContent;

  return (
    <EditorContainer>
      <Title>Editor System Prompt</Title>
      <Description>
        Il system prompt definisce il comportamento base di Jarvis. Modifica questo testo per personalizzare 
        come l'assistente risponde alle tue richieste, quali sono le sue competenze principali e come interagisce con te.
      </Description>
      
      {filePath && <FilePath>File: {filePath}</FilePath>}
      
      <VSCodeDivider />
      
      <TextareaContainer>
        {loading ? (
          <div>Caricamento system prompt...</div>
        ) : (
          <Textarea 
            value={content}
            onChange={handleContentChange}
            placeholder="# System Prompt per Jarvis IDE
            
Sei Jarvis, un assistente AI per sviluppatori integrato in VS Code.
Il tuo scopo è aiutare a scrivere, migliorare e comprendere il codice."
          />
        )}
      </TextareaContainer>
      
      <Actions>
        {statusMessage && (
          <StatusMessage isSuccess={statusMessage.isSuccess}>
            {statusMessage.text}
          </StatusMessage>
        )}
        <VSCodeButton 
          appearance="secondary" 
          onClick={handleOpenInVSCode}
        >
          Apri in VS Code
        </VSCodeButton>
        <VSCodeButton 
          appearance="secondary" 
          onClick={handleReset} 
          disabled={!hasChanges}
        >
          Annulla Modifiche
        </VSCodeButton>
        <VSCodeButton 
          onClick={handleSave} 
          disabled={!hasChanges || loading}
        >
          Salva
        </VSCodeButton>
        {onClose && (
          <VSCodeButton 
            appearance="secondary" 
            onClick={onClose}
          >
            Chiudi
          </VSCodeButton>
        )}
      </Actions>
    </EditorContainer>
  );
}; 