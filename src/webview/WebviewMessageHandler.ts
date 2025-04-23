import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { WebviewMessage } from '@shared/ExtensionMessage';
import {
  handleSaveSettings,
  handleResetSettings,
  handleGetSettings
} from './handlers/settingsHandlers';
import {
  handleGetPromptProfiles,
  handleCreatePromptProfile,
  handleUpdatePromptProfile,
  handleDeletePromptProfile,
  handleSwitchPromptProfile
} from './handlers/promptHandlers';

const logger = new Logger('WebviewMessageHandler');

/**
 * Gestisce tutti i messaggi provenienti dalla WebView in modo centralizzato
 */
export async function handleWebviewMessage(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  logger.debug('Ricevuto messaggio WebView:', { type: message.type, payload: (msg.payload as unknown) });

  try {
    switch (message.type) {
      // Settings handlers
      case 'saveSettings':
        return await handleSaveSettings(message, panel);
      case 'resetSettings':
        return await handleResetSettings(panel);
      case 'getSettings':
        return await handleGetSettings(panel);

      // Prompt profile handlers  
      case 'getPromptProfiles':
        return await handleGetPromptProfiles(panel);
      case 'createPromptProfile':
        return await handleCreatePromptProfile(message, panel);
      case 'updatePromptProfile':
        return await handleUpdatePromptProfile(message, panel);
      case 'deletePromptProfile':
        return await handleDeletePromptProfile(message, panel);
      case 'switchPromptProfile':
        return await handleSwitchPromptProfile(message, panel);

      default:
        logger.warn('Tipo di messaggio sconosciuto:', message.type);
        return;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nella gestione del messaggio WebView:', errorMessage);
    
    // Invia messaggio di errore alla WebView
    panel.webview.postMessage({
      type: 'error',
      message: `Errore nella gestione del messaggio: ${errorMessage}`
    });
  }
} 