import type { ExtensionState } from '../types/extension.js.js';
import type { ApiConfiguration } from '../types/api.types.js.js';
import type { ConfigModelInfo } from '../types/models.js.js';

export interface ExtensionStateContextType {
  state: ExtensionState;
  setApiConfiguration: (config: Partial<ApiConfiguration>) => void;
  setTelemetrySetting: (setting: ExtensionState['telemetrySetting']) => void;
  setCustomInstructions: (instructions: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setSystemPromptPath: (path: string) => void;
  setAvailableModels: (models: ConfigModelInfo[]) => void;
}

export interface ExtensionStateProviderProps {
  initialState: ExtensionState;
  children: React.ReactNode;
} 