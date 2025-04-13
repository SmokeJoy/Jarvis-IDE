import { useCallback, useState } from 'react';
import { JarvisSettings } from '../types/settings.types';
import { WebviewMessage } from '../types/webview';

declare const vscode: {
  postMessage: (message: WebviewMessage) => void;
};

export const useJarvisIdeSettings = (initialSettings: JarvisSettings) => {
  const [settings, setSettings] = useState<JarvisSettings>(initialSettings);

  const updateSettings = useCallback(async (newSettings: Partial<JarvisSettings>) => {
    try {
      // Invia le impostazioni aggiornate al provider
      await vscode.postMessage({
        type: 'settings',
        payload: newSettings,
      });

      setSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      // Reimposta le impostazioni ai valori predefiniti
      await vscode.postMessage({
        type: 'settings',
        payload: initialSettings,
      });

      setSettings(initialSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }, [initialSettings]);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
