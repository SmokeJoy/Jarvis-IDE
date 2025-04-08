import React, { useEffect, useState } from 'react';
import { VSCodeButton, VSCodeTextArea, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { vscode } from '../utils/vscode';
import { WebviewMessageType } from '../../src/shared/WebviewMessageType';
import { useExtensionState } from '../context/ExtensionStateContext';

const EditorContainer = styled.div`
  margin-top: 1rem;
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

const SaveIndicator = styled.span`
  font-size: 0.9rem;
  color: var(--vscode-notificationsInfoIcon-foreground);
  margin-left: 0.5rem;
  opacity: 0.8;
`;

const EXAMPLE_PROMPT = `Sei un assistente di programmazione esperto.
Aiutami a scrivere codice ben progettato, efficiente e manutenibile.
Spiega i concetti in modo chiaro e conciso.`;

export const ContextPromptEditor: React.FC = () => {
  const { state } = useExtensionState();
  const [contextPrompt, setContextPrompt] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Inizializza il valore dal contesto
    if (state.contextPrompt !== undefined) {
      setContextPrompt(state.contextPrompt);
    }
  }, [state.contextPrompt]);

  const handleSave = () => {
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_SETTING,
      key: 'contextPrompt',
      value: contextPrompt
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000); // Nascondi il messaggio dopo 2 secondi
  };

  const handleClear = () => {
    if (window.confirm('Sei sicuro di voler cancellare il prompt di contesto?')) {
      setContextPrompt('');
      vscode.postMessage({
        type: WebviewMessageType.UPDATE_SETTING,
        key: 'contextPrompt',
        value: ''
      });
    }
  };

  const handleInsertExample = () => {
    setContextPrompt(EXAMPLE_PROMPT);
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_SETTING,
      key: 'contextPrompt',
      value: EXAMPLE_PROMPT
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Prompt di Contesto</EditorTitle>
        {saved && <SaveIndicator>✓ Salvato</SaveIndicator>}
      </EditorHeader>
      
      <Description>
        Il prompt di contesto definisce istruzioni specifiche inviate all'inizio di ogni conversazione. 
        Utilizzalo per dare indicazioni più dettagliate su come l'AI dovrebbe comportarsi.
      </Description>
      
      <TextAreaContainer>
        <VSCodeTextArea 
          rows={5}
          value={contextPrompt} 
          onChange={(e: any) => setContextPrompt(e.target.value)}
          placeholder="Inserisci il prompt di contesto qui..."
          style={{ width: '100%', minHeight: '100px' }}
        />
      </TextAreaContainer>
      
      <ButtonContainer>
        <VSCodeButton onClick={handleSave}>
          Salva
        </VSCodeButton>
        <VSCodeButton onClick={handleClear} appearance="secondary">
          Cancella
        </VSCodeButton>
        <VSCodeButton onClick={handleInsertExample} appearance="secondary">
          Inserisci Esempio
        </VSCodeButton>
      </ButtonContainer>
      
      <VSCodeDivider style={{ marginTop: '1.5rem', marginBottom: '1rem' }} />
    </EditorContainer>
  );
}; 