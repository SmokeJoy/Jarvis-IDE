import { ChatMessage } from '../shared/types/chat.types';
import { ApiConfiguration } from '../shared/types/api.types';
import { ExtensionMessage } from '../shared/ExtensionMessage';
import * as vscode from 'vscode';

export async function exportChatToMarkdown(messages: ChatMessage[]): Promise<string> {
  let markdown = '# Chat History\n\n';

  // Aggiungi metadata
  markdown += '## Metadata\n';
  markdown += `- Data: ${new Date().toLocaleString()}\n`;
  markdown += `- Numero messaggi: ${messages.length}\n\n`;

  // Esporta ogni messaggio
  for (const message of messages) {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const role = message.role === 'user' ? '👤 Utente' : '🤖 Assistente';

    markdown += `### ${role} (${timestamp})\n\n`;

    // Formatta il contenuto
    const content = message.content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line)
      .join('\n\n');

    markdown += `${content}\n\n`;

    // Aggiungi providerFields del messaggio se presenti
    if (message.providerFields && Object.keys(message.providerFields).length > 0) {
      markdown += '<details>\n<summary>Provider Fields</summary>\n\n';
      markdown += '```json\n';
      markdown += JSON.stringify(message.providerFields, null, 2);
      markdown += '\n```\n\n';
      markdown += '</details>\n\n';
    }

    markdown += '---\n\n';
  }

  return markdown;
}

export async function saveMarkdownToFile(content: string): Promise<void> {
  const uri = await vscode.window.showSaveDialog({
    filters: {
      Markdown: ['md'],
    },
    defaultUri: vscode.Uri.file('chat_history.md'),
  });

  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    vscode.window.showInformationMessage('Chat history esportata con successo!');
  }
}
