/**
 * @file settings.types.ts
 * @description Definizioni per le impostazioni
 */

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface AutoApprovalSettings {
  enabled: boolean;
  confidenceThreshold: number;
  maxTokens: number;
}

export interface BrowserSettings {
  enabled: boolean;
  maxPages: number;
  timeout: number;
}

export interface JarvisSettings {
  apiKeys: string[];
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  history: unknown[];
  recentFiles: string[];
  recentFolders: string[];
  useTelemetry: boolean;
  use_docs?: boolean;
  contextPrompt?: string;
  coder_mode?: boolean;
  multi_agent: boolean;
  selectedModel?: string;
  apiConfiguration?: ApiConfiguration;
  telemetrySetting?: TelemetrySetting;
  customInstructions?: string;
  planActSeparateModelsSetting?: boolean;
}

export interface SettingsManager {
  getSettings(): JarvisSettings;
  updateSettings(settings: Partial<JarvisSettings>): Promise<void>;
  resetSettings(): Promise<void>;
}
