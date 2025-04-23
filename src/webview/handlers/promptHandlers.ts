import * as vscode from 'vscode';
import { WebviewMessage, ExtensionMessage } from '../../shared/ExtensionMessage';
import { SettingsManager } from '../../services/settings/SettingsManager';
import { Logger } from '../../utils/logger';
import { z } from 'zod';

const logger = new Logger('PromptHandlers');

// Schema di validazione per il profilo del prompt
const PromptProfileSchema = z.object({
  id: z.string().optional(), // Opzionale per la creazione, richiesto per l'aggiornamento
  name: z.string().min(1),
  description: z.string().optional(),
  contextPrompt: z.string().min(1),
});

/**
 * Ottiene tutti i profili dei prompt
 */
export async function handleGetPromptProfiles(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const settingsManager = SettingsManager.getInstance();
    const profiles = await settingsManager.getPromptProfiles();

    panel.webview.postMessage({
      type: 'promptProfiles',
      payload: { profiles }
    } as ExtensionMessage);

    logger.debug('Profili dei prompt inviati alla webview');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nel recupero dei profili dei prompt:', errorMessage);
    throw error;
  }
}

/**
 * Crea un nuovo profilo del prompt
 */
export async function handleCreatePromptProfile(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  try {
    const parseResult = PromptProfileSchema.omit({ id: true }).safeParse((msg.payload as unknown));
    if (!parseResult.success) {
      throw new Error(`Payload non valido: ${parseResult.error.message}`);
    }

    const settingsManager = SettingsManager.getInstance();
    const newProfile = await settingsManager.createPromptProfile(parseResult.data);

    panel.webview.postMessage({
      type: 'promptProfileCreated',
      payload: { profile: newProfile }
    } as ExtensionMessage);

    logger.info('Profilo del prompt creato con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nella creazione del profilo del prompt:', errorMessage);
    throw error;
  }
}

/**
 * Aggiorna un profilo del prompt esistente
 */
export async function handleUpdatePromptProfile(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  try {
    const parseResult = PromptProfileSchema.safeParse((msg.payload as unknown));
    if (!parseResult.success) {
      throw new Error(`Payload non valido: ${parseResult.error.message}`);
    }

    const settingsManager = SettingsManager.getInstance();
    const updatedProfile = await settingsManager.updatePromptProfile(parseResult.data);

    panel.webview.postMessage({
      type: 'promptProfileUpdated',
      payload: { profile: updatedProfile }
    } as ExtensionMessage);

    logger.info('Profilo del prompt aggiornato con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nell\'aggiornamento del profilo del prompt:', errorMessage);
    throw error;
  }
}

/**
 * Elimina un profilo del prompt
 */
export async function handleDeletePromptProfile(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  try {
    const profileId = (msg.payload as unknown)?.id;
    if (!profileId || typeof profileId !== 'string') {
      throw new Error('ID del profilo non valido o mancante');
    }

    const settingsManager = SettingsManager.getInstance();
    await settingsManager.deletePromptProfile(profileId);

    panel.webview.postMessage({
      type: 'promptProfileDeleted',
      payload: { id: profileId }
    } as ExtensionMessage);

    logger.info('Profilo del prompt eliminato con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nell\'eliminazione del profilo del prompt:', errorMessage);
    throw error;
  }
}

/**
 * Cambia il profilo del prompt attivo
 */
export async function handleSwitchPromptProfile(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  try {
    const profileId = (msg.payload as unknown)?.id;
    if (!profileId || typeof profileId !== 'string') {
      throw new Error('ID del profilo non valido o mancante');
    }

    const settingsManager = SettingsManager.getInstance();
    const profile = await settingsManager.switchPromptProfile(profileId);

    panel.webview.postMessage({
      type: 'promptProfileSwitched',
      payload: { profile }
    } as ExtensionMessage);

    logger.info('Profilo del prompt cambiato con successo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error('Errore nel cambio del profilo del prompt:', errorMessage);
    throw error;
  }
} 