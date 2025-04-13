import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Settings } from '../shared/types';

/**
 * Interfaccia per le impostazioni dell'applicazione
 */
interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  enableNotifications: boolean;
  language: string;
  systemPrompt: string;
  availableModels: string[];
}

/**
 * Interfaccia per il contesto delle impostazioni
 */
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

/**
 * Interfaccia per il messaggio di aggiornamento impostazioni
 */
interface SettingsUpdateMessage {
  type: 'updateSettings';
  payload: Partial<Settings>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    fontSize: 14,
    enableNotifications: true,
    language: 'en',
    systemPrompt: '',
    availableModels: [],
  });

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    window.vscode?.postMessage({
      type: 'updateSetting',
      ...newSettings,
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
