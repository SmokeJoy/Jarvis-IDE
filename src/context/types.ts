import { ExtensionState } from '../types/extension';
import { ApiConfiguration } from '../types/api.types';
import { ConfigModelInfo } from '../types/models';

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
