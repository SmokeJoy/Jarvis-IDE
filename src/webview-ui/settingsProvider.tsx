/**
 * Interfaccia per le impostazioni dell'applicazione
 */
interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  enableNotifications: boolean;
  language: string;
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

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    fontSize: 14,
    enableNotifications: true,
    language: 'en'
  });

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    vscode.postMessage({
      type: 'updateSettings',
      payload: newSettings
    } as SettingsUpdateMessage);
  }, []);

  // ... existing code ...
}; 