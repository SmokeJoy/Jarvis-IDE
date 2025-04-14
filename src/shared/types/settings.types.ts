import { ApiConfiguration } from './api.types';
import { TelemetrySetting } from './telemetry.types';

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
