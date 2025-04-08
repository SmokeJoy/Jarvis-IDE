import type { useCallback, useState } from 'react';

export const useJarvisIdeCustomInstructions = () => {
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const updateCustomInstructions = useCallback(async (newInstructions: string) => {
    try {
      // Invia le nuove istruzioni personalizzate al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          customInstructions: newInstructions
        }
      });

      setCustomInstructions(newInstructions);
    } catch (error) {
      console.error('Error updating custom instructions:', error);
      throw error;
    }
  }, []);

  const resetCustomInstructions = useCallback(async () => {
    try {
      // Reimposta le istruzioni personalizzate al valore predefinito
      const defaultInstructions = '';
      await vscode.postMessage({
        type: 'settings',
        payload: {
          customInstructions: defaultInstructions
        }
      });

      setCustomInstructions(defaultInstructions);
    } catch (error) {
      console.error('Error resetting custom instructions:', error);
      throw error;
    }
  }, []);

  return {
    customInstructions,
    updateCustomInstructions,
    resetCustomInstructions
  };
}; 