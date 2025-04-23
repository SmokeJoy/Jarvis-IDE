import type { Settings, AvailableModel } from '@shared/types/settings.types';
import { createContext, useState, useCallback, ReactNode } from 'react';

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
  selectModel: (modelValue: string) => void;
  saveSystemPrompt: (content: string) => void;
  openSystemPromptFile: () => void;
  setSystemPromptPath: (path: string) => void;
}

const defaultSettings: Settings = {
  apiConfiguration: {
    provider: 'local',
    apiKey: '',
    modelId: 'deepseek-coder',
    baseUrl: '',
    temperature: 0.7,
    maxTokens: 4096
  },
  telemetrySetting: {
    id: 'default',
    enabled: true,
    lastUpdated: Date.now()
  },
  customInstructions: '',
  planActSeparateModelsSetting: false,
  use_docs: false,
  coder_mode: true,
  multi_agent: false,
  contextPrompt: '',
  selectedModel: 'deepseek-coder',
  systemPromptPath: 'config/system_prompt.md',
  availableModels: [
    { label: 'DeepSeek Coder (Local)', value: 'deepseek-coder', provider: 'local', coder: true }
  ],
  code_style: 'standard'
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