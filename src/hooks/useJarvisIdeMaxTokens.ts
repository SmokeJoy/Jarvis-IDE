import './vscode-api';
import { useCallback, useState } from 'react';

export const useJarvisIdeMaxTokens = () => {
  const [maxTokens, setMaxTokens] = useState<number>(1000);

  const updateMaxTokens = useCallback(async (newMaxTokens: number) => {
    try {
      // Invia il nuovo numero massimo di token al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          maxTokens: newMaxTokens,
        },
      });

      setMaxTokens(newMaxTokens);
    } catch (error) {
      console.error('Error updating max tokens:', error);
      throw error;
    }
  }, []);

  const resetMaxTokens = useCallback(async () => {
    try {
      // Reimposta il numero massimo di token al valore predefinito
      const defaultMaxTokens = 1000;
      await vscode.postMessage({
        type: 'settings',
        payload: {
          maxTokens: defaultMaxTokens,
        },
      });

      setMaxTokens(defaultMaxTokens);
    } catch (error) {
      console.error('Error resetting max tokens:', error);
      throw error;
    }
  }, []);

  return {
    maxTokens,
    updateMaxTokens,
    resetMaxTokens,
  };
};
