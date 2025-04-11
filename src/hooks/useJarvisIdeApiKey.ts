import { useCallback, useState } from 'react';
import { WebviewMessage } from '../types/webview.js';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');

  const updateApiKey = useCallback(async (newApiKey: string) => {
    try {
      // Invia la nuova chiave API al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          apiKey: newApiKey
        }
      });

      setApiKey(newApiKey);
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  }, []);

  const resetApiKey = useCallback(async () => {
    try {
      // Reimposta la chiave API al valore predefinito
      const defaultApiKey = '';
      await vscode.postMessage({
        type: 'settings',
        payload: {
          apiKey: defaultApiKey
        }
      });

      setApiKey(defaultApiKey);
    } catch (error) {
      console.error('Error resetting API key:', error);
      throw error;
    }
  }, []);

  return {
    apiKey,
    updateApiKey,
    resetApiKey
  };
};