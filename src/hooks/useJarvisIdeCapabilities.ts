import type { useCallback, useState } from 'react';
import type { WebviewMessage } from '../types/webview.js.js';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeCapabilities = () => {
  const [capabilities, setCapabilities] = useState<string[]>([]);

  const updateCapabilities = useCallback(async (newCapabilities: string[]) => {
    try {
      // Invia le nuove capacità al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          capabilities: newCapabilities
        }
      });

      setCapabilities(newCapabilities);
    } catch (error) {
      console.error('Error updating capabilities:', error);
      throw error;
    }
  }, []);

  const resetCapabilities = useCallback(async () => {
    try {
      // Reimposta le capacità ai valori predefiniti
      const defaultCapabilities: string[] = [];
      await vscode.postMessage({
        type: 'settings',
        payload: {
          capabilities: defaultCapabilities
        }
      });

      setCapabilities(defaultCapabilities);
    } catch (error) {
      console.error('Error resetting capabilities:', error);
      throw error;
    }
  }, []);

  return {
    capabilities,
    updateCapabilities,
    resetCapabilities
  };
};