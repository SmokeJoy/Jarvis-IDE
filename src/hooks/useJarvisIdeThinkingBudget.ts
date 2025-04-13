import './vscode-api';
import { useCallback, useState } from 'react';

export const useJarvisIdeThinkingBudget = () => {
  const [thinkingBudget, setThinkingBudget] = useState<number>(100);

  const updateThinkingBudget = useCallback(async (newBudget: number) => {
    try {
      // Invia il nuovo budget di pensiero al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          thinkingBudget: newBudget,
        },
      });

      setThinkingBudget(newBudget);
    } catch (error) {
      console.error('Error updating thinking budget:', error);
      throw error;
    }
  }, []);

  const resetThinkingBudget = useCallback(async () => {
    try {
      // Reimposta il budget di pensiero al valore predefinito
      const defaultBudget = 100;
      await vscode.postMessage({
        type: 'settings',
        payload: {
          thinkingBudget: defaultBudget,
        },
      });

      setThinkingBudget(defaultBudget);
    } catch (error) {
      console.error('Error resetting thinking budget:', error);
      throw error;
    }
  }, []);

  return {
    thinkingBudget,
    updateThinkingBudget,
    resetThinkingBudget,
  };
};
