// Dichiarazione per l'API vscode WebView
declare const vscode: { postMessage: (message: any) => void };

import type { useCallback, useState } from 'react';

export const useJarvisIdeUsage = () => {
  const [usage, setUsage] = useState<{
    tokensIn: number;
    tokensOut: number;
    cost: number;
  }>({
    tokensIn: 0,
    tokensOut: 0,
    cost: 0
  });

  const updateUsage = useCallback(async (newUsage: {
    tokensIn: number;
    tokensOut: number;
    cost: number;
  }) => {
    try {
      // Invia le nuove statistiche di utilizzo al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          usage: newUsage
        }
      });

      setUsage(newUsage);
    } catch (error) {
      console.error('Error updating usage:', error);
      throw error;
    }
  }, []);

  const resetUsage = useCallback(async () => {
    try {
      // Reimposta le statistiche di utilizzo ai valori predefiniti
      const defaultUsage = {
        tokensIn: 0,
        tokensOut: 0,
        cost: 0
      };
      await vscode.postMessage({
        type: 'settings',
        payload: {
          usage: defaultUsage
        }
      });

      setUsage(defaultUsage);
    } catch (error) {
      console.error('Error resetting usage:', error);
      throw error;
    }
  }, []);

  return {
    usage,
    updateUsage,
    resetUsage
  };
}; 