import './vscode-api';
import { useCallback, useState } from 'react';

export const useJarvisIdePricePer1kTokens = () => {
  const [pricePer1kTokens, setPricePer1kTokens] = useState<number>(0.002);

  const updatePricePer1kTokens = useCallback(async (newPricePer1kTokens: number) => {
    try {
      // Invia il nuovo prezzo per 1000 token al provider
      await vscode.postMessage({
        type: 'settings',
        payload: {
          pricePer1kTokens: newPricePer1kTokens,
        },
      });

      setPricePer1kTokens(newPricePer1kTokens);
    } catch (error) {
      console.error('Error updating price per 1k tokens:', error);
      throw error;
    }
  }, []);

  const resetPricePer1kTokens = useCallback(async () => {
    try {
      // Reimposta il prezzo per 1000 token al valore predefinito
      const defaultPricePer1kTokens = 0.002;
      await vscode.postMessage({
        type: 'settings',
        payload: {
          pricePer1kTokens: defaultPricePer1kTokens,
        },
      });

      setPricePer1kTokens(defaultPricePer1kTokens);
    } catch (error) {
      console.error('Error resetting price per 1k tokens:', error);
      throw error;
    }
  }, []);

  return {
    pricePer1kTokens,
    updatePricePer1kTokens,
    resetPricePer1kTokens,
  };
};
