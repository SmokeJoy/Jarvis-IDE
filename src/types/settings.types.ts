export interface JarvisSettings {
  telemetry: {
    enabled: boolean;
    level: 'basic' | 'detailed';
  };
  api: {
    defaultProvider: string;
    providers: any[]; // TODO: sostituire con il tipo corretto quando sarà disponibile
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    lineHeight: number;
  };
  features: {
    codeCompletion: boolean;
    inlineSuggestions: boolean;
    chat: boolean;
    commands: boolean;
  };
}

export interface SettingsManager {
  getSettings(): JarvisSettings;
  updateSettings(settings: Partial<JarvisSettings>): Promise<void>;
  resetSettings(): Promise<void>;
} 