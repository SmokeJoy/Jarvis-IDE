import React, { createContext, useContext, useReducer } from 'react';
import { ExtensionStateContextType, ExtensionStateProviderProps } from './types';
import { ExtensionState } from '../types/extension';
import { ApiConfiguration } from '../src/shared/types/api.types';
import { ConfigModelInfo } from '../types/models';

const ExtensionStateContext = createContext<ExtensionStateContextType | null>(null);

type ExtensionStateAction =
  | { type: 'SET_API_CONFIGURATION'; payload: Partial<ExtensionState['apiConfiguration']> }
  | { type: 'SET_TELEMETRY_SETTING'; payload: ExtensionState['telemetrySetting'] }
  | { type: 'SET_CUSTOM_INSTRUCTIONS'; payload: string }
  | { type: 'SET_SYSTEM_PROMPT'; payload: string }
  | { type: 'SET_SYSTEM_PROMPT_PATH'; payload: string }
  | { type: 'SET_AVAILABLE_MODELS'; payload: ExtensionState['availableModels'] };

function extensionStateReducer(
  state: ExtensionState,
  action: ExtensionStateAction
): ExtensionState {
  switch (action.type) {
    case 'SET_API_CONFIGURATION':
      return {
        ...state,
        apiConfiguration: { ...state.apiConfiguration, ...action.payload },
      };
    case 'SET_TELEMETRY_SETTING':
      return { ...state, telemetrySetting: action.payload };
    case 'SET_CUSTOM_INSTRUCTIONS':
      return { ...state, customInstructions: action.payload };
    case 'SET_SYSTEM_PROMPT':
      return { ...state, systemPrompt: action.payload };
    case 'SET_SYSTEM_PROMPT_PATH':
      return { ...state, systemPromptPath: action.payload };
    case 'SET_AVAILABLE_MODELS':
      return { ...state, availableModels: action.payload };
    default:
      return state;
  }
}

export const ExtensionStateProvider: React.FC<ExtensionStateProviderProps> = ({
  initialState,
  children,
}) => {
  const [state, dispatch] = useReducer(extensionStateReducer, initialState);

  const value: ExtensionStateContextType = {
    state,
    setApiConfiguration: (config) => dispatch({ type: 'SET_API_CONFIGURATION', payload: config }),
    setTelemetrySetting: (setting) => dispatch({ type: 'SET_TELEMETRY_SETTING', payload: setting }),
    setCustomInstructions: (instructions) =>
      dispatch({ type: 'SET_CUSTOM_INSTRUCTIONS', payload: instructions }),
    setSystemPrompt: (prompt) => dispatch({ type: 'SET_SYSTEM_PROMPT', payload: prompt }),
    setSystemPromptPath: (path) => dispatch({ type: 'SET_SYSTEM_PROMPT_PATH', payload: path }),
    setAvailableModels: (models) => dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models }),
  };

  return <ExtensionStateContext.Provider value={value}>{children}</ExtensionStateContext.Provider>;
};

export const useExtensionState = (): ExtensionStateContextType => {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error('useExtensionState must be used within an ExtensionStateProvider');
  }
  return context;
};
