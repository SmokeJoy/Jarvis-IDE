import React, { createContext, useContext, useState, useCallback } from 'react';
import { ExtensionState } from '../../../../../src/shared/types';

interface ExtensionStateContextType {
  state: ExtensionState;
  setState: (state: ExtensionState) => void;
}

const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined);

export const useExtensionState = () => {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error('useExtensionState must be used within an ExtensionStateProvider');
  }
  return context;
};

export const ExtensionStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExtensionState>({
    version: '1.0.0',
    didHydrateState: false,
    showWelcome: true,
    shouldShowAnnouncement: false,
    telemetrySetting: 'on',
    customInstructions: '',
    chatSettings: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    apiConfiguration: {
      provider: 'openai',
      apiKey: '',
      modelId: 'gpt-3.5-turbo',
      modelName: 'GPT-3.5 Turbo'
    }
  });

  return (
    <ExtensionStateContext.Provider value={{ state, setState }}>
      {children}
    </ExtensionStateContext.Provider>
  );
}; 