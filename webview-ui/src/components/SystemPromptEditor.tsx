import React, { useEffect, useState } from 'react';
import { VSCodeButton, VSCodeTextArea, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { vscode } from '../utils/vscode';
import { WebviewMessageType } from '../../src/shared/WebviewMessageType';

const EditorContainer = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const EditorTitle = styled.h3`
  margin: 0;
  padding: 0;
`;

const TextAreaContainer = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

export const SystemPromptEditor: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Richiedi il system prompt all'avvio
    vscode.postMessage({
      type: WebviewMessageType.GET_SYSTEM_PROMPT
    });

    // Ascolta i messaggi dal backend
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'systemPromptLoaded') {
        setSystemPrompt(message.content);
        setLoading(false);
      } else if (message.type === 'systemPromptSaved') {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Nascondi il messaggio dopo 2 secondi
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const handleSave = () => {
    vscode.postMessage({
      type: WebviewMessageType.SAVE_SYSTEM_PROMPT,
      content: systemPrompt
    });
  };

  const handleReset = () => {
    if (window.confirm('Sei sicuro di voler ripristinare il system prompt predefinito?')) {
      vscode.postMessage({
        type: WebviewMessageType.RESET_SYSTEM_PROMPT
      });
    }
  };

  const handleOpen = () => {
    vscode.postMessage({
      type: WebviewMessageType.OPEN_SYSTEM_PROMPT_FILE
    });
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>System Prompt</EditorTitle>
      </EditorHeader>
      
      <Description>
        Il system prompt definisce il comportamento di base dell'assistente AI. 
        Modificalo per personalizzare il comportamento di Jarvis-IDE.
      </Description>
      
      <TextAreaContainer>
        <VSCodeTextArea 
          rows={12}
          value={systemPrompt} 
          onChange={(e: any) => setSystemPrompt(e.target.value)}
          placeholder="Caricamento in corso..."
          style={{ width: '100%', minHeight: '200px' }}
          disabled={loading}
        />
      </TextAreaContainer>
      
      <ButtonContainer>
        <VSCodeButton onClick={handleSave} disabled={loading}>
          {saved ? '✓ Salvato!' : 'Salva'}
        </VSCodeButton>
        <VSCodeButton onClick={handleReset} disabled={loading} appearance="secondary">
          Ripristina
        </VSCodeButton>
        <VSCodeButton onClick={handleOpen} disabled={loading} appearance="secondary">
          Apri in Editor
        </VSCodeButton>
      </ButtonContainer>
      
      <VSCodeDivider style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} />
    </EditorContainer>
  );
}; 