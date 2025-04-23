import * as vscode from 'vscode';
import { WebviewMessage, ExtensionMessage } from '@shared/ExtensionMessage';
import { SettingsManager } from '../../services/settings/SettingsManager';
import { Logger } from '../../utils/logger';
import { z } from 'zod';
import { SettingsPayload } from '@shared/types/settings.types';

const logger = new Logger('SettingsHandlers');

// Schema di validazione per il payload delle impostazioni
const SaveSettingsSchema = z.object({
  apiConfiguration: z.object({
    provider: z.string(),
    apiKey: z.string(),
    modelId: z.string(),
    baseUrl: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
  }).optional(),
  telemetryEnabled: z.boolean().optional(),
  customInstructions: z.string().optional(),
  contextPrompt: z.union([z.string(), z.record(z.unknown())]).optional(),
  planActSeparateModelsSetting: z.boolean().optional(),
});

/**
 * Gestisce il salvataggio delle impostazioni
 */
export async function handleSaveSettings(
  message: WebviewMessage & { payload: SettingsPayload },
  panel: vscode.WebviewPanel
): Promise<void> {
  try {
    // Valida il payload
    const parseResult = SaveSettingsSchema.safeParse((msg.payload as unknown));
    if (!parseResult.success) {
      throw new Error(`Payload non valido: ${parseResult.error.message}`);
    }

    const settingsManager = SettingsManager.getInstance();
    const currentSettings = settingsManager.getSettings();
    const { apiConfiguration, telemetryEnabled, customInstructions, contextPrompt } = parseResult.data;

    // Aggiorna le impostazioni
    const updatedSettings = {
      ...currentSettings,
      apiConfiguration: apiConfiguration ?? currentSettings.apiConfiguration,
      telemetrySetting: { enabled: telemetryEnabled ?? currentSettings.telemetrySetting?.enabled ?? true },
      customInstructions: customInstructions ?? currentSettings.customInstructions,
      contextPrompt: typeof contextPrompt === 'object' ? JSON.stringify(contextPrompt) : contextPrompt
    };

    await settingsManager.updateSettings(updatedSettings);

    // Invia conferma alla webview
    panel.webview.postMessage({
      type: 'settingsSaved',
      id: message.id,
    } as ExtensionMessage);

    logger.info('Impostazioni salvate con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nel salvataggio delle impostazioni:', errorMessage);
    throw error;
  }
}

/**
 * Gestisce il reset delle impostazioni
 */
export async function handleResetSettings(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const settingsManager = SettingsManager.getInstance();
    await settingsManager.resetSettings();

    // Invia conferma alla webview
    panel.webview.postMessage({
      type: 'settingsReset',
    } as ExtensionMessage);

    logger.info('Impostazioni resettate con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nel reset delle impostazioni:', errorMessage);
    throw error;
  }
}

/**
 * Gestisce la richiesta di ottenere le impostazioni correnti
 */
export async function handleGetSettings(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const settingsManager = SettingsManager.getInstance();
    const settings = settingsManager.getSettings();

    // Prepara la risposta
    const response: ExtensionMessage = {
      type: 'settings',
      id: 'get-settings-response',
      settings: {
        apiConfiguration: settings.apiConfiguration || {
          provider: 'openai',
          apiKey: '',
          modelId: '',
          baseUrl: '',
          temperature: 0.7,
          maxTokens: 4096,
        },
        telemetrySetting: settings.telemetrySetting || { enabled: true },
        customInstructions: settings.customInstructions || '',
        contextPrompt: settings.contextPrompt || '',
      },
    };

    panel.webview.postMessage(response);
    logger.debug('Impostazioni inviate alla webview');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nel recupero delle impostazioni:', errorMessage);
    throw error;
  }
} 