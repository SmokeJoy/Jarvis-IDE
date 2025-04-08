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