import type { ContextItem } from '../types/context.js.js';
import type { getMemoryContexts } from '../utils/memory.js.js';
import type { ToolCallResult } from '../types/tool.js.js';

interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  scope?: 'chat' | 'project' | 'agent';
  tags?: string[];
  sinceTimestamp?: number;
  includeMetadata?: boolean;
}

function filterContexts(
  contexts: ContextItem[],
  options: ExportOptions
): ContextItem[] {
  let filtered = [...contexts];

  if (options.scope) {
    filtered = filtered.filter(item => item.scope === options.scope);
  }

  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(item => 
      options.tags!.every(tag => item.tags?.includes(tag))
    );
  }

  if (options.sinceTimestamp) {
    filtered = filtered.filter(item => 
      item.timestamp >= options.sinceTimestamp!
    );
  }

  return filtered;
}

function exportToJson(contexts: ContextItem[], includeMetadata: boolean): string {
  const data = contexts.map(item => ({
    ...(includeMetadata ? {
      id: item.id,
      scope: item.scope,
      timestamp: item.timestamp,
      tags: item.tags
    } : {}),
    text: item.text
  }));
  return JSON.stringify(data, null, 2);
}

function exportToCsv(contexts: ContextItem[], includeMetadata: boolean): string {
  const headers = ['text'];
  if (includeMetadata) {
    headers.push('id', 'scope', 'timestamp', 'tags');
  }

  const rows = contexts.map(item => {
    const row = [item.text];
    if (includeMetadata) {
      row.push(
        item.id,
        item.scope,
        item.timestamp.toString(),
        item.tags?.join(',') || ''
      );
    }
    return row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function exportToMarkdown(contexts: ContextItem[], includeMetadata: boolean): string {
  const sections = contexts.map(item => {
    const parts = [];
    
    if (includeMetadata) {
      parts.push(`### ID: ${item.id}`);
      parts.push(`- **Scope**: ${item.scope}`);
      parts.push(`- **Timestamp**: ${new Date(item.timestamp).toISOString()}`);
      if (item.tags?.length) {
        parts.push(`- **Tags**: ${item.tags.map(t => `\`${t}\``).join(', ')}`);
      }
      parts.push('');
    }
    
    parts.push(item.text);
    parts.push('---');
    
    return parts.join('\n');
  });

  return sections.join('\n\n');
}

export async function contextExportHandler(
  args: ExportOptions
): Promise<ToolCallResult> {
  try {
    const {
      format = 'json',
      scope,
      tags,
      sinceTimestamp,
      includeMetadata = true
    } = args;

    // Recupera tutti i contesti
    const contexts = await getMemoryContexts();
    
    // Applica i filtri
    const filteredContexts = filterContexts(contexts, {
      format,
      scope,
      tags,
      sinceTimestamp,
      includeMetadata
    });

    // Esporta nel formato richiesto
    let content: string;
    switch (format) {
      case 'json':
        content = exportToJson(filteredContexts, includeMetadata);
        break;
      case 'csv':
        content = exportToCsv(filteredContexts, includeMetadata);
        break;
      case 'markdown':
        content = exportToMarkdown(filteredContexts, includeMetadata);
        break;
      default:
        throw new Error(`Formato di esportazione non supportato: ${format}`);
    }

    return {
      success: true,
      output: {
        format,
        content,
        count: filteredContexts.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante l\'esportazione'
    };
  }
} 