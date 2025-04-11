import type { useCallback, useState } from 'react';
import type { WebviewMessage } from '../types/webview.js';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeBaseUrl = () => {
  const [baseUrl, setBaseUrl] = useState<string>('');

  const updateBaseUrl = useCallback(async (newBaseUrl: string) => {
    try {
      // Invia il nuovo URL base al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          baseUrl: newBaseUrl
        }
      });

      setBaseUrl(newBaseUrl);
    } catch (error) {
      console.error('Error updating base URL:', error);
      throw error;
    }
  }, []);

  const resetBaseUrl = useCallback(async () => {
    try {
      // Reimposta l'URL base al valore predefinito
      const defaultBaseUrl = '';
      await vscode.postMessage({
        type: 'settings',
        payload: {
          baseUrl: defaultBaseUrl
        }
      });

      setBaseUrl(defaultBaseUrl);
    } catch (error) {
      console.error('Error resetting base URL:', error);
      throw error;
    }
  }, []);

  return {
    baseUrl,
    updateBaseUrl,
    resetBaseUrl
  };
};