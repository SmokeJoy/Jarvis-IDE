/**
 * Utilità per l'esportazione di dati in vari formati
 * Supporta YAML, JSON e altri formati per l'interoperabilità con strumenti esterni
 */

import { stringify } from 'yaml';
import * as vscode from 'vscode';
import { ChatMessage } from '../shared/types.js';
import { ChatSettings } from '../shared/types/settings.types.js';
import { ApiConfiguration } from '../shared/types/api.types.js';
import { Logger } from './logger.js';

const logger = Logger.getInstance("Exporters");

/**
 * Interfaccia per il payload di esportazione
 */
export interface ExportPayload {
  messages?: ChatMessage[];
  settings?: ChatSettings;
  systemPrompt?: string;
  contextFiles?: string[];
  modelId?: string;
  timestamp?: number;
}

/**
 * Esporta i dati in formato YAML compatibile con DeepSeek e OpenDevin
 * @param payload - Dati da esportare in YAML
 * @returns Stringa contenente il YAML formattato
 */
export function exportAsPromptYAML(payload: ExportPayload): string {
  try {
    // Struttura il payload per la compatibilità con i formati prompt standard
    const yamlPayload = {
      messages: payload.messages || [],
      settings: payload.settings || {},
      systemPrompt: payload.systemPrompt || "",
      metadata: {
        contextFiles: payload.contextFiles || [],
        modelId: payload.modelId || "",
        timestamp: payload.timestamp || Date.now(),
        version: "1.0"
      }
    };

    // Converti in YAML con opzioni di formattazione
    return stringify(yamlPayload, {
      indent: 2,
      doubleQuotedStringStyle: 'literal',
      lineWidth: 0  // Nessun limite alla lunghezza della riga
    });
  } catch (error) {
    logger.error(`Errore durante l'esportazione YAML: ${error.message}`, error);
    throw new Error(`Errore durante l'esportazione YAML: ${error.message}`);
  }
}

/**
 * Salva il contenuto YAML su file
 * @param content - Contenuto YAML da salvare
 * @returns Promise che si risolve quando il file è stato salvato
 */
export async function saveYAMLToFile(content: string): Promise<void> {
  try {
    const uri = await vscode.window.showSaveDialog({
      filters: {
        'YAML': ['yaml', 'yml']
      },
      defaultUri: vscode.Uri.file('prompt_export.yaml')
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
      vscode.window.showInformationMessage('Prompt esportato con successo in formato YAML!');
    }
  } catch (error) {
    logger.error(`Errore durante il salvataggio del file YAML: ${error.message}`, error);
    vscode.window.showErrorMessage(`Errore durante il salvataggio: ${error.message}`);
  }
}

/**
 * Esporta e salva il prompt in formato YAML
 * @param payload - Dati da esportare
 * @returns Promise che si risolve quando il file è stato salvato
 */
export async function exportAndSavePromptYAML(payload: ExportPayload): Promise<void> {
  try {
    const yamlContent = exportAsPromptYAML(payload);
    await saveYAMLToFile(yamlContent);
  } catch (error) {
    logger.error(`Errore durante l'esportazione e salvataggio YAML: ${error.message}`, error);
    vscode.window.showErrorMessage(`Errore durante l'esportazione: ${error.message}`);
  }
} 