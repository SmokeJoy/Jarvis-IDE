import type { ApiConfiguration } from './api.types.js';
import type { TelemetrySetting } from './telemetry.types.js';

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