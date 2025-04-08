import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  VSCodeButton, 
  VSCodeCheckbox,
  VSCodeDivider,
  VSCodeTextArea,
  VSCodeDropdown,
  VSCodeOption
} from '@vscode/webview-ui-toolkit/react';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { vscode } from '../../utils/vscode';

const SettingsPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const SettingTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const SettingDescription = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--vscode-descriptionForeground);
`;

const ContextPromptContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
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
`;

interface SettingsPanelProps {
  onOpenSystemPrompt?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onOpenSystemPrompt }) => {
  // Stato delle impostazioni
  const [useDocuments, setUseDocuments] = useState(false);
  const [coderMode, setCoderMode] = useState(true);
  const [contextPrompt, setContextPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{text: string, isSuccess: boolean} | null>(null);

  // Carica impostazioni all'avvio
  useEffect(() => {
    // Richiedi le impostazioni correnti al backend
    vscode.postMessage({
      type: 'getSettings'
    });
    
    // Ascolta i messaggi in arrivo
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'settingsLoaded') {
        console.log('Impostazioni caricate:', message.settings);
        setUseDocuments(message.settings.use_docs || false);
        setCoderMode(message.settings.coder_mode || true);
        setContextPrompt(message.settings.contextPrompt || '');
        setSelectedModel(message.settings.selectedModel || '');
        
        // Aggiorna i modelli disponibili
        if (message.settings.availableModels) {
          setAvailableModels(message.settings.availableModels);
        }
      }
      
      if (message.type === 'settingUpdated') {
        showStatusMessage(`Impostazione "${message.key}" aggiornata con successo`, true);
      }
      
      if (message.type === 'error') {
        showStatusMessage(`Errore: ${message.message}`, false);
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

  // Gestori di eventi per le modifiche
  const handleUseDocumentsChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.checked;
    setUseDocuments(newValue);
    updateSetting('use_docs', newValue);
  };

  const handleCoderModeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.checked;
    setCoderMode(newValue);
    updateSetting('coder_mode', newValue);
  };
  
  const handleContextPromptChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const newValue = target.value;
    setContextPrompt(newValue);
  };
  
  const handleContextPromptSave = () => {
    updateSetting('contextPrompt', contextPrompt);
  };
  
  const handleModelChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newValue = target.value;
    setSelectedModel(newValue);
    updateSetting('selectedModel', newValue);
  };
  
  // Funzione per aggiornare un'impostazione
  const updateSetting = (key: string, value: any) => {
    vscode.postMessage({
      type: 'updateSetting',
      key,
      value
    });
  };
  
  // Gestori per azioni di salvataggio/reset
  const handleSaveAll = () => {
    vscode.postMessage({
      type: 'saveAllSettings',
      settings: {
        use_docs: useDocuments,
        coder_mode: coderMode,
        contextPrompt,
        selectedModel
      }
    });
    showStatusMessage('Tutte le impostazioni salvate con successo', true);
  };
  
  const handleResetAll = () => {
    vscode.postMessage({
      type: 'resetAllSettings'
    });
    showStatusMessage('Impostazioni ripristinate ai valori predefiniti', true);
  };

  return (
    <SettingsPanelContainer>
      <SettingTitle>Impostazioni Jarvis IDE</SettingTitle>
      <VSCodeDivider />
      
      {/* Impostazioni modalità */}
      <SettingGroup>
        <SettingTitle>Modalità di funzionamento</SettingTitle>
        
        <SettingRow>
          <div>
            <SettingTitle>Modalità Sviluppatore</SettingTitle>
            <SettingDescription>
              Ottimizza Jarvis per compiti di programmazione e sviluppo software
            </SettingDescription>
          </div>
          <VSCodeCheckbox 
            checked={coderMode}
            onChange={handleCoderModeChange}
          />
        </SettingRow>
        
        <SettingRow>
          <div>
            <SettingTitle>Usa Documentazione</SettingTitle>
            <SettingDescription>
              Cerca e incorpora automaticamente documentazione dai file di progetto
            </SettingDescription>
          </div>
          <VSCodeCheckbox 
            checked={useDocuments}
            onChange={handleUseDocumentsChange}
          />
        </SettingRow>
      </SettingGroup>
      
      <VSCodeDivider />
      
      {/* Selezione modello */}
      <SettingGroup>
        <SettingTitle>Modello AI</SettingTitle>
        <SettingDescription>
          Seleziona il modello AI da utilizzare per le risposte
        </SettingDescription>
        
        <VSCodeDropdown value={selectedModel} onChange={handleModelChange}>
          {availableModels.length === 0 ? (
            <VSCodeOption>Nessun modello disponibile</VSCodeOption>
          ) : (
            availableModels.map(model => (
              <VSCodeOption key={model} value={model}>
                {model}
              </VSCodeOption>
            ))
          )}
        </VSCodeDropdown>
      </SettingGroup>
      
      <VSCodeDivider />
      
      {/* Context Prompt */}
      <SettingGroup>
        <SettingTitle>Prompt Contestuale</SettingTitle>
        <SettingDescription>
          Informazioni di contesto da aggiungere a ogni interazione
        </SettingDescription>
        
        <ContextPromptContainer>
          <VSCodeTextArea
            value={contextPrompt}
            onChange={handleContextPromptChange}
            placeholder="Inserisci informazioni contestuali da includere in ogni richiesta a Jarvis..."
            rows={5}
          />
          <VSCodeButton appearance="secondary" onClick={handleContextPromptSave}>
            Salva Prompt Contestuale
          </VSCodeButton>
        </ContextPromptContainer>
      </SettingGroup>
      
      <VSCodeDivider />
      
      {/* System Prompt Button */}
      <SettingGroup>
        <SettingTitle>System Prompt</SettingTitle>
        <SettingDescription>
          Modifica il prompt di sistema che definisce il comportamento base di Jarvis
        </SettingDescription>
        
        <VSCodeButton onClick={onOpenSystemPrompt}>
          Apri Editor System Prompt
        </VSCodeButton>
      </SettingGroup>
      
      <VSCodeDivider />
      
      {/* Actions */}
      <Actions>
        {statusMessage && (
          <StatusMessage isSuccess={statusMessage.isSuccess}>
            {statusMessage.text}
          </StatusMessage>
        )}
        <VSCodeButton appearance="secondary" onClick={handleResetAll}>
          Ripristina Default
        </VSCodeButton>
        <VSCodeButton onClick={handleSaveAll}>
          Salva Tutte le Impostazioni
        </VSCodeButton>
      </Actions>
    </SettingsPanelContainer>
  );
}; 