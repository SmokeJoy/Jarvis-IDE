import * as vscode from 'vscode';
import { ChatMessage } from '../types/extension';
// import type { ApiConfiguration } from '../shared/types/api.types';
// import type { ExtensionMessage } from '../shared/ExtensionMessage';
// import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const CHAT_HISTORY_FILE = 'chat_history.json';

/**
 * Carica la cronologia chat dal file JSON
 * @returns Array di messaggi della chat
 */
export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Nessuna cartella di lavoro aperta');
    }

    const historyPath = path.join(workspaceFolder.uri.fsPath, CHAT_HISTORY_FILE);
    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(historyPath));
    return JSON.parse(content.toString());
  } catch (error) {
    console.error('Errore nel caricamento della cronologia chat:', error);
    return [];
  }
}

/**
 * Salva un nuovo messaggio nella cronologia
 * @param message Messaggio da salvare
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Nessuna cartella di lavoro aperta');
    }

    const historyPath = path.join(workspaceFolder.uri.fsPath, CHAT_HISTORY_FILE);
    const history = await loadChatHistory();

    // Se il messaggio è in streaming, aggiorna il messaggio esistente
    if (message.streaming) {
      const existingIndex = history.findIndex((m) => m.id === message.id);
      if (existingIndex !== -1) {
        history[existingIndex] = message;
      } else {
        history.push(message);
      }
    } else {
      // Per i messaggi completi, aggiungi alla fine
      history.push(message);
    }

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(historyPath),
      Buffer.from(JSON.stringify(history, null, 2))
    );
  } catch (error) {
    console.error('Errore nel salvataggio del messaggio:', error);
  }
}

/**
 * Cancella tutta la cronologia chat
 */
export async function clearChatHistory(): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Nessuna cartella di lavoro aperta');
    }

    const historyPath = path.join(workspaceFolder.uri.fsPath, CHAT_HISTORY_FILE);
    await vscode.workspace.fs.writeFile(vscode.Uri.file(historyPath), Buffer.from('[]'));
  } catch (error) {
    console.error('Errore nella cancellazione della cronologia:', error);
  }
}

/**
 * Esporta tutta la chat history in formato JSON.
 * @returns JSON stringificato della chat history
 */
export async function exportChatHistory(): Promise<string> {
  const history = await loadChatHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Esporta la cronologia in formato Markdown
 * @returns Stringa Markdown formattata
 */
export async function exportChatHistoryAsMarkdown(): Promise<string> {
  try {
    const history = await loadChatHistory();
    let markdown = '# Cronologia Chat\n\n';

    history.forEach((message) => {
      markdown += `## ${message.role === 'user' ? 'Utente' : 'Assistente'}\n`;
      markdown += `*${new Date(message.timestamp).toLocaleString()}*\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += '---\n\n';
    });

    return markdown;
  } catch (error) {
    console.error("Errore nell'esportazione in Markdown:", error);
    return "# Errore nell'esportazione della cronologia";
  }
}
