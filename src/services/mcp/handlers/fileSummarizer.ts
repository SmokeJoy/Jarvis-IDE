import * as vscode from 'vscode';
import type { HandlerFunction } from '../types.js.js';
import { readFile } from 'fs/promises';
import { extname } from 'path';

interface FileSummarizerArgs {
  filePath: string;
  includeMetadata?: boolean;
  maxPreviewLength?: number;
}

interface FileSummary {
  path: string;
  name: string;
  extension: string;
  size: number;
  preview?: string;
  metadata?: {
    lastModified: Date;
    createdAt: Date;
    mimeType?: string;
  };
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.xml': 'application/xml'
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

async function summarizeFile(filePath: string, includeMetadata: boolean = true, maxPreviewLength: number = 1000): Promise<FileSummary> {
  try {
    const stats = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    const extension = extname(filePath);
    const name = filePath.split(/[\\/]/).pop() || '';

    const summary: FileSummary = {
      path: filePath,
      name,
      extension,
      size: stats.size
    };

    if (includeMetadata) {
      summary.metadata = {
        lastModified: new Date(stats.mtime),
        createdAt: new Date(stats.ctime),
        mimeType: getMimeType(extension)
      };
    }

    if (maxPreviewLength > 0) {
      const content = await readFile(filePath, 'utf-8');
      summary.preview = content.slice(0, maxPreviewLength);
    }

    return summary;
  } catch (error) {
    throw new Error(`Failed to summarize file ${filePath}: ${error.message}`);
  }
}

export const fileSummarizer: HandlerFunction = async (args: FileSummarizerArgs) => {
  const { filePath, includeMetadata = true, maxPreviewLength = 1000 } = args;

  try {
    const summary = await summarizeFile(filePath, includeMetadata, maxPreviewLength);
    return {
      success: true,
      data: summary
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to summarize file: ${error.message}`
    };
  }
};