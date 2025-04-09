import React, { createContext, useContext, useState, useEffect } from 'react';
import { vscode } from '../vscode.js.js';

// Definizione del modello disponibile
interface AvailableModel {
  label: string;
  value: string;
  provider: string;
  coder: boolean;
}

interface Settings {
  provider: string;
  model: string;
  coder_mode: boolean;
  use_docs: boolean;
  contextPrompt: string;
  systemPrompt: string;
  systemPromptPath?: string;
  availableModels?: AvailableModel[];
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
  selectModel: (modelValue: string) => void;
  saveSystemPrompt: (content: string) => void;
  openSystemPromptFile: () => void;
  setSystemPromptPath: (path: string) => void;
}

const defaultSettings: Settings = {
  provider: 'local',
  model: 'deepseek-coder',
  coder_mode: true,
  use_docs: false,
  contextPrompt: '',
  systemPrompt: '',
  systemPromptPath: 'config/system_prompt.md',
  availableModels: [
    { label: 'DeepSeek Coder (Local)', value: 'deepseek-coder', provider: 'local', coder: true }
  ]
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSetting: () => {},
  selectModel: () => {},
  saveSystemPrompt: () => {},
  openSystemPromptFile: () => {},
  setSystemPromptPath: () => {}
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Richiedi le impostazioni all'avvio
  useEffect(() => {
    // Richiedi le impostazioni al backend
    vscode.postMessage({ type: 'getSettings' });
    
    // Richiedi il system prompt all'avvio
    vscode.postMessage({ type: 'command', command: 'jarvis.readSystemPrompt' });

    // Ascolta i messaggi dal backend
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'settings':
          setSettings(prev => ({
            ...prev,
            ...message.payload
          }));
          break;
        case 'systemPrompt':
          setSettings(prev => ({
            ...prev,
            systemPrompt: message.payload.content
          }));
          break;
        case 'systemPromptSaved':
          // Aggiorna lo stato dopo il salvataggio
          setSettings(prev => ({
            ...prev,
            systemPrompt: message.payload.content
          }));
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    vscode.postMessage({
      type: 'settingUpdated',
      payload: { key, value }
    });
  };

  // Funzione per selezionare un modello e aggiornare automaticamente provider e coder_mode
  const selectModel = (modelValue: string) => {
    const selectedModel = settings.availableModels?.find(model => model.value === modelValue);
    
    if (selectedModel) {
      // Aggiorna il modello
      updateSetting('model', modelValue);
      
      // Aggiorna il provider associato al modello
      updateSetting('provider', selectedModel.provider);
      
      // Aggiorna la modalità coder basata sul modello
      updateSetting('coder_mode', selectedModel.coder);
    }
  };

  const saveSystemPrompt = (content: string) => {
    vscode.postMessage({
      type: 'command',
      command: 'jarvis.saveSystemPrompt',
      payload: content
    });
  };

  const openSystemPromptFile = () => {
    vscode.postMessage({
      type: 'command',
      command: 'jarvis-ide.openSystemPromptFile'
    });
  };

  const setSystemPromptPath = (path: string) => {
    vscode.postMessage({
      type: 'command',
      command: 'jarvis-ide.setSystemPromptPath',
      payload: path
    });
    // Aggiorna il valore locale subito per feedback immediato all'utente
    setSettings(prev => ({
      ...prev,
      systemPromptPath: path
    }));
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSetting, 
      selectModel, 
      saveSystemPrompt,
      openSystemPromptFile,
      setSystemPromptPath
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 