import { useCallback, useState } from 'react';
import { WebviewMessage } from '../types/webview';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeSystemPrompt = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');

  const updateSystemPrompt = useCallback(async (newPrompt: string) => {
    try {
      // Invia il nuovo system prompt al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          systemPrompt: newPrompt,
        },
      });

      setSystemPrompt(newPrompt);
    } catch (error) {
      console.error('Error updating system prompt:', error);
      throw error;
    }
  }, []);

  const resetSystemPrompt = useCallback(async () => {
    try {
      // Reimposta il system prompt al valore predefinito
      const defaultPrompt = 'You are a helpful AI assistant.';
      await vscode.postMessage({
        type: 'settings',
        payload: {
          systemPrompt: defaultPrompt,
        },
      });

      setSystemPrompt(defaultPrompt);
    } catch (error) {
      console.error('Error resetting system prompt:', error);
      throw error;
    }
  }, []);

  return {
    systemPrompt,
    updateSystemPrompt,
    resetSystemPrompt,
  };
};
