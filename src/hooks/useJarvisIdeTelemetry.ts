// Dichiarazione per l'API vscode WebView
declare const vscode: { postMessage: (message: any) => void };

import { useCallback } from 'react';
import { TelemetrySetting } from '../types/settings.types.js';

export const useJarvisIdeTelemetry = () => {
  const sendTelemetry = useCallback(async (event: string, properties?: Record<string, unknown>) => {
    try {
      // Invia l'evento di telemetria al provider
      await vscode.postMessage({
        type: 'telemetry',
        payload: {
          event,
          properties
        }
      });
    } catch (error) {
      console.error('Error sending telemetry:', error);
    }
  }, []);

  const updateTelemetrySettings = useCallback(async (settings: Partial<TelemetrySetting>) => {
    try {
      // Aggiorna le impostazioni di telemetria
      await vscode.postMessage({
        type: 'settings',
        payload: {
          telemetry: settings
        }
      });
    } catch (error) {
      console.error('Error updating telemetry settings:', error);
      throw error;
    }
  }, []);

  return {
    sendTelemetry,
    updateTelemetrySettings
  };
}; 