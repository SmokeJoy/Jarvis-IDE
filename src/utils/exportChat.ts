import * as vscode from 'vscode';
import { ChatMessage } from '../shared/types/chat.types';
import { Logger } from './logger';

const logger = new Logger('ChatExport');

/**
 * Esporta la chat in formato Markdown
 */
export async function exportChatToMarkdown(messages: ChatMessage[]): Promise<string> {
  try {
    const content = formatChatAsMarkdown(messages);
    const uri = await showSaveDialog();
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
      return uri.fsPath;
    }
    
    throw new Error('Operazione annullata dall\'utente');
  } catch (error) {
    logger.error('Errore durante l\'esportazione della chat:', error);
    throw error;
  }
}

/**
 * Formatta i messaggi della chat in Markdown
 */
function formatChatAsMarkdown(messages: ChatMessage[]): string {
  const lines: string[] = [
    '# Chat Export',
    '',
    `Data: ${new Date().toLocaleString()}`,
    '',
    '---',
    ''
  ];

  for (const message of messages) {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    lines.push(`### ${role}`);
    lines.push('');
    lines.push(message.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Mostra il dialog per salvare il file
 */
async function showSaveDialog(): Promise<vscode.Uri | undefined> {
  return vscode.window.showSaveDialog({
    filters: {
      'Markdown': ['md']
    },
    saveLabel: 'Esporta Chat',
    title: 'Esporta Chat come Markdown'
  });
} 