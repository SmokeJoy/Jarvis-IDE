import './vscode-api';
import { useCallback, useState } from 'react';

export const useJarvisIdeTemperature = () => {
  const [temperature, setTemperature] = useState<number>(0.7);

  const updateTemperature = useCallback(async (newTemperature: number) => {
    try {
      // Invia la nuova temperatura al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          temperature: newTemperature,
        },
      });

      setTemperature(newTemperature);
    } catch (error) {
      console.error('Error updating temperature:', error);
      throw error;
    }
  }, []);

  const resetTemperature = useCallback(async () => {
    try {
      // Reimposta la temperatura al valore predefinito
      const defaultTemperature = 0.7;
      await vscode.postMessage({
        type: 'settings',
        payload: {
          temperature: defaultTemperature,
        },
      });

      setTemperature(defaultTemperature);
    } catch (error) {
      console.error('Error resetting temperature:', error);
      throw error;
    }
  }, []);

  return {
    temperature,
    updateTemperature,
    resetTemperature,
  };
};
