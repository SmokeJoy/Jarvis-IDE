import React, { useEffect, useState } from 'react';
import { Switch } from '../components/ui/switch.js';
import { Textarea } from '../components/ui/textarea.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.js';
import { getVsCodeApi } from '../vscode.js';
import { WebviewMessage } from '../../shared/WebviewMessage.js';
import { SystemPromptEditor } from '../components/SystemPromptEditor.js';

interface Settings {
  use_docs: boolean;
  coder_mode: boolean;
  contextPrompt: string;
  selectedModel: string;
  multi_agent: boolean;
  availableModels?: string[];
}

interface SettingsLoadedMessage extends WebviewMessage {
  type: 'settingsLoaded';
  settings: Settings;
}

interface SettingUpdatedMessage extends WebviewMessage {
  type: 'settingUpdated';
  key: keyof Settings;
  value: boolean | string;
}

const vscode = getVsCodeApi();

export const SettingsPage: React.FC = () => {
  const [useDocs, setUseDocs] = useState(false);
  const [coderMode, setCoderMode] = useState(true);
  const [multiAgent, setMultiAgent] = useState(false);
  const [contextPrompt, setContextPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Richiedi le impostazioni al caricamento della pagina
    vscode.postMessage({ type: 'getSettings' });

    // Configura il listener per i messaggi dal backend
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as SettingsLoadedMessage | SettingUpdatedMessage;
      
      if (message.type === 'settingsLoaded') {
        setUseDocs(message.settings.use_docs);
        setCoderMode(message.settings.coder_mode);
        setContextPrompt(message.settings.contextPrompt || '');
        setSelectedModel(message.settings.selectedModel || '');
        setMultiAgent(message.settings.multi_agent || false);
        
        if (message.settings.availableModels) {
          setAvailableModels(message.settings.availableModels);
        }
      }
      
      if (message.type === 'settingUpdated') {
        // Aggiorna l'impostazione specifica che è stata confermata
        switch (message.key) {
          case 'use_docs':
            setUseDocs(message.value as boolean);
            break;
          case 'coder_mode':
            setCoderMode(message.value as boolean);
            break;
          case 'contextPrompt':
            setContextPrompt(message.value as string);
            break;
          case 'selectedModel':
            setSelectedModel(message.value as string);
            break;
          case 'multi_agent':
            setMultiAgent(message.value as boolean);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Pulisci il listener al disaccoppiamento del componente
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSettingChange = (key: keyof Settings, value: boolean | string) => {
    // Invia l'aggiornamento al backend
    vscode.postMessage({
      type: 'updateSetting',
      key,
      value
    } as SettingUpdatedMessage);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    
    // Invia tutte le impostazioni al backend
    vscode.postMessage({
      type: 'saveAllSettings',
      settings: {
        use_docs: useDocs,
        coder_mode: coderMode,
        contextPrompt,
        selectedModel,
        multi_agent: multiAgent
      }
    });
    
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleReset = () => {
    setIsResetting(true);
    
    // Richiedi il reset delle impostazioni
    vscode.postMessage({
      type: 'resetAllSettings'
    });
    
    setTimeout(() => setIsResetting(false), 1000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Impostazioni Jarvis IDE</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4 bg-slate-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Configurazione Base</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Inietta Documentazione</div>
              <div className="text-sm text-gray-400">Includi automaticamente la documentazione pertinente</div>
            </div>
            <Switch 
              checked={useDocs} 
              onCheckedChange={(checked) => handleSettingChange('use_docs', checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modalità Coder</div>
              <div className="text-sm text-gray-400">Ottimizza per sviluppo software</div>
            </div>
            <Switch 
              checked={coderMode} 
              onCheckedChange={(checked) => handleSettingChange('coder_mode', checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modalità Multi-Agente</div>
              <div className="text-sm text-gray-400">Abilita interazione tra più agenti AI</div>
            </div>
            <Switch 
              checked={multiAgent} 
              onCheckedChange={(checked) => handleSettingChange('multi_agent', checked)} 
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-4 bg-slate-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Modello AI</h2>
          
          <div>
            <label className="font-medium">Modello Selezionato</label>
            <div className="text-sm text-gray-400 mb-2">Scegli il modello per le interazioni AI</div>
            <Select 
              value={selectedModel} 
              onValueChange={(value) => handleSettingChange('selectedModel', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona un modello" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="font-medium">Prompt di Contesto</label>
            <div className="text-sm text-gray-400 mb-2">Istruzioni aggiuntive per ogni interazione</div>
            <Textarea
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              onBlur={() => handleSettingChange('contextPrompt', contextPrompt)}
              placeholder="Inserisci istruzioni di contesto aggiuntive..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>
      
      <SystemPromptEditor />
      
      <div className="flex gap-2 justify-end mt-2">
        <button 
          className={`px-4 py-2 rounded-md text-white ${isResetting ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting ? 'Ripristino...' : 'Ripristina Predefiniti'}
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-white ${isSaving ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          onClick={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? 'Salvato!' : 'Salva Tutte le Impostazioni'}
        </button>
      </div>
    </div>
  );
}; 