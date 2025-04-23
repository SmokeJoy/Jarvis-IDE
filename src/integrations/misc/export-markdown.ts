import { z } from 'zod';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  ContentBlock,
  ContentType,
  isImageBlock,
  isTextBlock,
  isToolUseBlock,
  isToolResultBlock,
} from '../../src/shared/types/chat.types';
import { AnthropicMessage } from '../../types/provider-types/anthropic-types';

export async function downloadTask(dateTs: number, conversationHistory: AnthropicMessage[]) {
  // File name
  const date = new Date(dateTs);
  const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const fileName = `jarvis_ide_task_${month}-${day}-${year}_${hours}-${minutes}-${seconds}-${ampm}.md`;

  // Generate markdown
  const markdownContent = conversationHistory
    .map((message) => {
      const role = message.role === 'user' ? '**User:**' : '**Assistant:**';
      const content = Array.isArray(message.content)
        ? message.content.map((block) => formatContentBlockToMarkdown(block as any)).join('\n')
        : message.content;
      return `${role}\n\n${content}\n\n`;
    })
    .join('---\n\n');

  // Prompt user for save location
  const saveUri = await vscode.window.showSaveDialog({
    filters: { Markdown: ['md'] },
    defaultUri: vscode.Uri.file(path.join(os.homedir(), 'Downloads', fileName)),
  });

  if (saveUri) {
    try {
      // Write content to the selected location
      await vscode.workspace.fs.writeFile(saveUri, new TextEncoder().encode(markdownContent));
      vscode.window.showTextDocument(saveUri, { preview: true });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to save markdown file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export function formatContentBlockToMarkdown(block: ContentBlock): string {
  if (isTextBlock(block)) {
    return block.text;
  } else if (isImageBlock(block)) {
    return `[Image]`;
  } else if (isToolUseBlock(block)) {
    let input: string;
    if (typeof block.input === 'object' && block.input !== null) {
      input = Object.entries(block.input)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join('\n');
    } else {
      input = String(block.input);
    }
    return `[Tool Use: ${block.tool_name}]\n${input}`;
  } else if (isToolResultBlock(block)) {
    const errorFlag = block.toolUseId ? ' (Error)' : '';

    if (typeof block.result === 'string') {
      return `[Tool${errorFlag}]\n${block.result}`;
    } else if (Array.isArray(block.result)) {
      return `[Tool${errorFlag}]\n${JSON.stringify(block.result, null, 2)}`;
    } else if (typeof block.result === 'object' && block.result !== null) {
      return `[Tool${errorFlag}]\n${JSON.stringify(block.result, null, 2)}`;
    } else {
      return `[Tool${errorFlag}]`;
    }
  } else if ((block as any).type === 'document') {
    // Retrocompatibilità con il vecchio formato
    return '[Document]';
  }

  return '[Unexpected content type]';
}
