import React, { useState } from 'react';
import styled from 'styled-components';
import {
  VSCodeToggle,
  VSCodeTextArea,
  VSCodeTextField,
  VSCodeDropdown,
  VSCodeButton,
  VSCodeDivider,
  VSCodeOption,
  VSCodeBadge,
  VSCodeCheckbox
} from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../webview-ui/providers/settingsProvider.js';
import { PromptEditor } from './components/PromptEditor.js';
import { SystemPromptEditor } from './components/SystemPromptEditor.js';

// VSCode API
declare const vscode: any;

const SettingsContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Warning = styled.div`
  color: #f1fa8c;
  margin-top: 5px;
  font-style: italic;
`;

const InfoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  font-size: 0.8rem;
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FormGroup = styled.div`
  margin-bottom: 10px;
`;

export const SettingsView: React.FC = () => {
  const { settings, updateSetting, selectModel, saveSystemPrompt, openSystemPromptFile, setSystemPromptPath } = useSettings();
  
  // Stati per il form di aggiunta modello
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [provider, setProvider] = useState('');
  const [coderMode, setCoderMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');

  const availableModels = settings.availableModels || [];
  const isCoderModel = settings.coder_mode;
  
  // Handler per l'aggiunta di un nuovo modello
  const handleAddModel = () => {
    if (!label || !value || !provider) {
      // Mostra errore se i campi obbligatori non sono stati inseriti
      vscode.postMessage({
        type: 'error',
        message: 'Devi inserire nome, ID modello e provider'
      });
      return;
    }
    
    const newModel = {
      label,
      value,
      provider,
      coder: coderMode,
      apiKey: apiKey || undefined,
      endpoint: endpoint || undefined
    };
    
    // Invia il comando al backend
    vscode.postMessage({
      type: 'command',
      command: 'jarvis.addCustomModel',
      payload: newModel
    });
    
    // Reset del form
    setLabel('');
    setValue('');
    setProvider('');
    setCoderMode(false);
    setApiKey('');
    setEndpoint('');
  };

  return (
    <SettingsContainer>
      <Section>
        <h2>Configurazione LLM</h2>
        <VSCodeDropdown
          id="model"
          value={settings.model}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectModel(e.target.value)}
        >
          {availableModels.map((model: string) => (
            <option key={model} value={model}>
              {model} 
            </option>
          ))}
        </VSCodeDropdown>
        
        <div>
          {isCoderModel ? (
            <InfoBadge>
              <VSCodeBadge>⚙️ Modalità Coder</VSCodeBadge>
            </InfoBadge>
          ) : (
            <InfoBadge>
              <VSCodeBadge>🧠 Modalità Reasoning</VSCodeBadge>
            </InfoBadge>
          )}
        </div>
        
        {!isCoderModel && (
          <Warning>
            ⚠️ Modello non ottimizzato per codice. Usare per compiti di reasoning, traduzione e compiti generali.
          </Warning>
        )}
      </Section>

      <VSCodeDivider />
      
      <Section>
        <h2>➕ Aggiungi Modello Personalizzato</h2>
        <FormGroup>
          <VSCodeTextField 
            placeholder="Nome visibile" 
            value={label}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} 
          />
        </FormGroup>
        <FormGroup>
          <VSCodeTextField 
            placeholder="ID modello (es. deepseek-coder)" 
            value={value}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} 
          />
        </FormGroup>
        <FormGroup>
          <VSCodeTextField 
            placeholder="Provider (es. local, openai, ollama)" 
            value={provider}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setProvider(e.target.value)} 
          />
        </FormGroup>
        <FormGroup>
          <VSCodeCheckbox 
            checked={coderMode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoderMode(e.target.checked)}
          >
            Coder Mode
          </VSCodeCheckbox>
        </FormGroup>
        <FormGroup>
          <VSCodeTextField 
            placeholder="API Key (opzionale)" 
            value={apiKey}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)} 
          />
        </FormGroup>
        <FormGroup>
          <VSCodeTextField 
            placeholder="Endpoint URL (opzionale)" 
            value={endpoint}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setEndpoint(e.target.value)} 
          />
        </FormGroup>
        <VSCodeButton onClick={handleAddModel}>Aggiungi Modello</VSCodeButton>
      </Section>

      <VSCodeDivider />

      <Section>
        <h2>Modalità e Documentazione</h2>
        <VSCodeToggle
          checked={settings.coder_mode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('coder_mode', e.target.checked)}
        >
          Modalità Coder (struttura prompt per LLM tecnico)
        </VSCodeToggle>
        <VSCodeToggle
          checked={settings.use_docs}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('use_docs', e.target.checked)}
        >
          Usa documentazione come contesto
        </VSCodeToggle>
      </Section>

      <VSCodeDivider />

      <Section>
        <h2>Provider Selezionato</h2>
        <div>
          Provider attivo: <strong>{settings.provider}</strong>
        </div>
        <div>
          Modello attivo: <strong>{settings.model}</strong>
        </div>
      </Section>

      <VSCodeDivider />

      <Section>
        <h2>Prompt di Contesto</h2>
        <PromptEditor
          value={settings.contextPrompt}
          onChange={(value) => updateSetting('contextPrompt', value)}
          description="Questo contesto viene inviato al modello per guidare il suo comportamento. È utile per specificare regole di formattazione, preferenze di stile o altri vincoli da seguire."
        />
        <div style={{ marginTop: '8px' }}>
          <VSCodeButton onClick={() => updateSetting('contextPrompt', settings.contextPrompt)}>
            Applica Prompt
          </VSCodeButton>
        </div>
      </Section>

      <VSCodeDivider />

      <Section>
        <h2>System Prompt</h2>
        <SystemPromptEditor 
          value={settings.systemPrompt}
          onChange={(value) => updateSetting('systemPrompt', value)}
          onSave={saveSystemPrompt}
          onOpenFile={openSystemPromptFile}
          filePath={settings.systemPromptPath}
          description="Il System Prompt definisce le principali istruzioni e comportamenti per il modello. Le modifiche verranno salvate nel file system_prompt.md."
        />
      </Section>
    </SettingsContainer>
  );
}; 