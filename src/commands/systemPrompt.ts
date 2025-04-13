import { JarvisProvider } from '../core/webview/JarvisProvider';
import * as vscode from 'vscode';
import fs from 'fs/promises';
import path from 'path';

export function registerSystemPromptCommands(
  context: vscode.ExtensionContext,
  provider: JarvisProvider
) {
  // Comando per leggere il system prompt
  const readSystemPromptCommand = vscode.commands.registerCommand(
    'jarvis.readSystemPrompt',
    async () => {
      try {
        const content = await provider.getSystemPrompt();

        // Mostra il contenuto in un editor
        const doc = await vscode.workspace.openTextDocument({
          content,
          language: 'markdown',
        });

        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nella lettura del system prompt: ${error}`);
      }
    }
  );

  // Comando per salvare il system prompt
  const saveSystemPromptCommand = vscode.commands.registerCommand(
    'jarvis.saveSystemPrompt',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Nessun editor attivo');
        return;
      }

      const content = editor.document.getText();
      try {
        await provider.saveSystemPrompt(content);
        vscode.window.showInformationMessage('System prompt salvato con successo');
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nel salvataggio del system prompt: ${error}`);
      }
    }
  );

  // Comando per aprire il file system prompt direttamente
  const openSystemPromptCommand = vscode.commands.registerCommand(
    'jarvis.openSystemPromptFile',
    async () => {
      try {
        const configDir = path.join(context.globalStorageUri.fsPath, 'config');
        const systemPromptPath = path.join(configDir, 'system_prompt.md');

        const uri = vscode.Uri.file(systemPromptPath);
        await vscode.commands.executeCommand('vscode.open', uri);
      } catch (error) {
        vscode.window.showErrorMessage(`Errore nell'apertura del file system prompt: ${error}`);
      }
    }
  );

  // Comando per impostare un percorso personalizzato per il system prompt
  const setSystemPromptPathCommand = vscode.commands.registerCommand(
    'jarvis.setSystemPromptPath',
    async () => {
      // Implementare la logica per cambiare il percorso del file system prompt
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          Markdown: ['md'],
        },
        title: 'Seleziona file system prompt',
      });

      if (fileUris && fileUris.length > 0) {
        const selectedPath = fileUris[0].fsPath;
        // Qui si può implementare la logica per salvare il percorso nelle impostazioni
        vscode.window.showInformationMessage(`Selezionato: ${selectedPath}`);
      }
    }
  );

  context.subscriptions.push(
    readSystemPromptCommand,
    saveSystemPromptCommand,
    openSystemPromptCommand,
    setSystemPromptPathCommand
  );

  return {
    readSystemPromptCommand,
    saveSystemPromptCommand,
    openSystemPromptCommand,
    setSystemPromptPathCommand,
  };
}
