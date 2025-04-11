/**
 * Comandi per l'importazione ed esportazione di sessioni di chat
 * @module commands/exportCommands
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger.js';
import { JarvisProvider } from '../core/webview/JarvisProvider.js';
import { promisify } from 'util';
import type {
  exportSession,
  exportSessionToFile,
  importSession,
  importFromString,
  convertFormat,
  ExportFormat,
  ImportOptions,
  validateExportableSession,
  ExportOptions,
  ExportableSession
} from '../utils/exporters/index.js';
import { t, showInformationMessage, showErrorMessage, showWarningMessage } from '../utils/i18n.js';

const logger = Logger.getInstance('exportCommands');
const readFileAsync = promisify(fs.readFile);

/**
 * Registra i comandi per l'importazione ed esportazione
 * @param context Il contesto dell'estensione
 * @param provider Il provider WebView di Jarvis
 */
export function registerExportCommands(
  context: vscode.ExtensionContext,
  provider: JarvisProvider
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Comando per importare una sessione di chat
  disposables.push(
    vscode.commands.registerCommand('jarvis.importSession', async () => {
      try {
        // Richiedi il file da importare
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            'Sessioni': ['json', 'yaml', 'md', 'csv', 'html'],
            'JSON': ['json'],
            'YAML': ['yaml', 'yml'],
            'Markdown': ['md', 'markdown'],
            'CSV': ['csv'],
            'HTML': ['html', 'htm']
          },
          title: t('dialog.import.title')
        });

        if (!fileUris || fileUris.length === 0) {
          return;
        }

        const filePath = fileUris[0].fsPath;
        
        // Opzioni per l'importazione
        const options: ImportOptions = {
          validate: true,
          encoding: 'utf8'
        };

        // Importa la sessione
        const session = await importSession(filePath, options);
        
        logger.info(`Sessione importata con successo: ${session.messages.length} messaggi`);
        
        // Carica la sessione nel provider
        await provider.loadImportedSession(session);
        
        await showInformationMessage('import.success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Errore durante l'importazione: ${errorMessage}`);
        await showErrorMessage('import.error');
      }
    })
  );

  // Comando per esportare una sessione di chat
  disposables.push(
    vscode.commands.registerCommand('jarvis.exportSession', async () => {
      try {
        // Ottieni la sessione corrente dal provider
        const currentSession = await provider.getCurrentSession();
        
        if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
          await showWarningMessage('error.no.session');
          return;
        }

        // Richiedi il formato di esportazione
        const formatItems: vscode.QuickPickItem[] = [
          { label: 'JSON', description: t('format.json') },
          { label: 'YAML', description: t('format.yaml') },
          { label: 'Markdown', description: t('format.markdown') },
          { label: 'CSV', description: t('format.csv') },
          { label: 'HTML', description: t('format.html') }
        ];

        const formatSelection = await vscode.window.showQuickPick(formatItems, {
          placeHolder: t('dialog.format.placeholder'),
          canPickMany: false
        });

        if (!formatSelection) {
          return;
        }

        const format = formatSelection.label as ExportFormat;
        
        // Richiedi il percorso di salvataggio
        const saveUri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(`jarvis_session_${new Date().toISOString().replace(/[:]/g, '-')}`),
          filters: {
            [format]: [format.toLowerCase()]
          },
          title: `${t('dialog.export.title')} (${format})`
        });

        if (!saveUri) {
          return;
        }

        // Opzioni di esportazione
        const options: ExportOptions = {
          sanitize: true,
          timestamp: new Date().getTime()
        };

        // Esporta la sessione
        await exportSessionToFile(currentSession, saveUri.fsPath, format, options);
        
        logger.info(`Sessione esportata con successo in formato ${format}: ${saveUri.fsPath}`);
        await showInformationMessage('export.success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Errore durante l'esportazione: ${errorMessage}`);
        await showErrorMessage('export.error');
      }
    })
  );

  // Comando per validare una sessione di chat
  disposables.push(
    vscode.commands.registerCommand('jarvis.validateSession', async () => {
      try {
        // Richiedi il file da validare
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            'Sessioni': ['json', 'yaml', 'md', 'csv', 'html'],
            'JSON': ['json'],
            'YAML': ['yaml', 'yml'],
            'Markdown': ['md', 'markdown'],
            'CSV': ['csv'],
            'HTML': ['html', 'htm']
          },
          title: t('dialog.validate.title')
        });

        if (!fileUris || fileUris.length === 0) {
          return;
        }

        const filePath = fileUris[0].fsPath;
        
        // Opzioni per l'importazione
        const options: ImportOptions = {
          validate: false, // Disabilitiamo la validazione automatica per eseguirla manualmente
          encoding: 'utf8'
        };

        // Importa la sessione senza validazione
        const session = await importSession(filePath, options);
        
        // Valida manualmente
        const isValid = validateExportableSession(session);
        
        if (isValid) {
          logger.info(`Sessione valida: ${session.messages.length} messaggi`);
          await showInformationMessage('validate.success');
        } else {
          logger.warn('La sessione non è valida');
          await showWarningMessage('validate.error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Errore durante la validazione: ${errorMessage}`);
        await showErrorMessage('import.error');
      }
    })
  );

  // Comando per convertire il formato di una sessione
  disposables.push(
    vscode.commands.registerCommand('jarvis.convertFormat', async () => {
      try {
        // Richiedi il file da convertire
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            'Sessioni': ['json', 'yaml', 'md', 'csv', 'html'],
            'JSON': ['json'],
            'YAML': ['yaml', 'yml'],
            'Markdown': ['md', 'markdown'],
            'CSV': ['csv'],
            'HTML': ['html', 'htm']
          },
          title: t('dialog.convert.title')
        });

        if (!fileUris || fileUris.length === 0) {
          return;
        }

        const filePath = fileUris[0].fsPath;
        const fileExtension = path.extname(filePath).toLowerCase();
        
        // Determina il formato di input
        let inputFormat: ExportFormat;
        switch (fileExtension) {
          case '.json':
            inputFormat = 'JSON';
            break;
          case '.yaml':
          case '.yml':
            inputFormat = 'YAML';
            break;
          case '.md':
          case '.markdown':
            inputFormat = 'Markdown';
            break;
          case '.csv':
            inputFormat = 'CSV';
            break;
          case '.html':
          case '.htm':
            inputFormat = 'HTML';
            break;
          default:
            await showErrorMessage('error.invalid.format');
            return;
        }
        
        // Richiedi il formato di output
        const formatItems: vscode.QuickPickItem[] = [
          { label: 'JSON', description: t('format.json') },
          { label: 'YAML', description: t('format.yaml') },
          { label: 'Markdown', description: t('format.markdown') },
          { label: 'CSV', description: t('format.csv') },
          { label: 'HTML', description: t('format.html') }
        ].filter(item => item.label !== inputFormat); // Escludi il formato di input
        
        const formatSelection = await vscode.window.showQuickPick(formatItems, {
          placeHolder: t('dialog.convert.to'),
          canPickMany: false
        });
        
        if (!formatSelection) {
          return;
        }
        
        const outputFormat = formatSelection.label as ExportFormat;
        
        // Richiedi il percorso di salvataggio
        const saveUri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(path.join(
            path.dirname(filePath),
            `${path.basename(filePath, path.extname(filePath))}.${outputFormat.toLowerCase()}`
          )),
          filters: {
            [outputFormat]: [outputFormat.toLowerCase()]
          },
          title: `${t('dialog.export.title')} (${outputFormat})`
        });
        
        if (!saveUri) {
          return;
        }
        
        // Converti il formato
        await convertFormat(filePath, saveUri.fsPath, outputFormat);
        
        logger.info(`Sessione convertita da ${inputFormat} a ${outputFormat}: ${saveUri.fsPath}`);
        await showInformationMessage('convert.success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Errore durante la conversione: ${errorMessage}`);
        await showErrorMessage('convert.error');
      }
    })
  );

  // Comando per anteprima della sessione
  disposables.push(
    vscode.commands.registerCommand('jarvis.previewSession', async () => {
      try {
        // Richiedi il file da visualizzare
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            'Sessioni': ['json', 'yaml', 'md', 'csv', 'html'],
            'JSON': ['json'],
            'YAML': ['yaml', 'yml'],
            'Markdown': ['md', 'markdown'],
            'CSV': ['csv'],
            'HTML': ['html', 'htm']
          },
          title: t('dialog.preview.title')
        });

        if (!fileUris || fileUris.length === 0) {
          return;
        }

        const filePath = fileUris[0].fsPath;
        
        // Leggi il file
        const fileContent = await readFileAsync(filePath, { encoding: 'utf8' });
        
        // Crea un documento temporaneo per l'anteprima
        const document = await vscode.workspace.openTextDocument({
          content: fileContent,
          language: path.extname(filePath).substring(1) // Estensione senza il punto
        });
        
        // Apri il documento
        await vscode.window.showTextDocument(document);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Errore durante l'anteprima: ${errorMessage}`);
        await showErrorMessage('preview.error');
      }
    })
  );

  return disposables;
} 