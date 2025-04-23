import { ApiConfiguration } from './api.types';
import { TelemetrySetting } from './telemetry.types';
import { JarvisSettings } from './global';

/**
 * Rappresenta un modello LLM disponibile
 */
export interface AvailableModel {
  label: string;
  value: string;
  provider: string; // es: 'openai', 'local', 'openrouter', 'ollama'
  coder: boolean;
  apiKey?: string; // opzionale
  endpoint?: string; // opzionale per modelli custom
}

export interface Settings {
  apiConfiguration: ApiConfiguration;
  telemetrySetting: TelemetrySetting;
  customInstructions: string;
  planActSeparateModelsSetting: boolean;
  use_docs: boolean;
  coder_mode: boolean;
  multi_agent: boolean;
  contextPrompt: string;
  selectedModel?: string;
  systemPromptPath?: string;
  availableModels?: AvailableModel[]; // nuovo campo persistente
  code_style?: 'standard' | 'concise' | 'verbose';
}

export interface TelemetrySetting {
  id: string;
  enabled: boolean;
  lastUpdated?: number;
}

export interface ChatSettings {
  modelId: string;
  temperature: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useStreaming?: boolean;
  functionCall?: boolean;
  [key: string]: unknown;
}

/**
 * Interfaccia per il gestore delle impostazioni
 */
export interface SettingsManager {
  getSettings(): JarvisSettings;
  updateSettings(settings: JarvisSettings): Promise<void>;
  resetSettings(): Promise<void>;
  loadSettings(): Promise<JarvisSettings | undefined>;
  saveSettings(settings: JarvisSettings): Promise<void>;
  exportToFile(filePath: string): Promise<void>;
  importFromFile(filePath: string): Promise<void>;
}

/**
 * Interfaccia per il profilo del prompt
 */
export interface PromptProfile {
  id: string;
  name: string;
  description?: string;
  contextPrompt: string;
}

/**
 * Interfaccia per la risposta delle impostazioni
 */
export interface SettingsResponse {
  success: boolean;
  settings?: JarvisSettings;
  error?: string;
}

/**
 * Interfaccia per la risposta del profilo del prompt
 */
export interface PromptProfileResponse {
  success: boolean;
  profile?: PromptProfile;
  error?: string;
}

/**
 * Interfaccia per il payload delle impostazioni
 */
export interface SettingsPayload {
  apiConfiguration?: {
    provider: string;
    apiKey: string;
    modelId: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  telemetryEnabled?: boolean;
  customInstructions?: string;
  contextPrompt?: string | Record<string, unknown>;
  planActSeparateModelsSetting?: boolean;
}
