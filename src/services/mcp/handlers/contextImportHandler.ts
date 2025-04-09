import type { ContextItem } from '../types/context.js.js';
import type { getMemoryContexts, saveMemoryContexts } from '../utils/memory.js.js';
import type { ToolCallResult } from '../types/tool.js.js';
import { v4 as uuidv4 } from 'uuid';

interface ImportOptions {
  format: 'auto' | 'json' | 'csv' | 'markdown';
  content: string;
  scope?: 'chat' | 'project' | 'agent';
  mergeTags?: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

function detectImportFormat(content: string): 'json' | 'csv' | 'markdown' {
  // Prova JSON
  try {
    JSON.parse(content);
    return 'json';
  } catch (e) {
    // Non è JSON
  }

  // Prova CSV (prima riga contiene header)
  const firstLine = content.split('\n')[0];
  if (firstLine.includes(',') && firstLine.toLowerCase().includes('text')) {
    return 'csv';
  }

  // Prova Markdown (contiene ### ID e ---)
  if (content.includes('### ID:') && content.includes('---')) {
    return 'markdown';
  }

  throw new Error('Formato non riconosciuto');
}

function parseJsonImport(content: string): ContextItem[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error('Il contenuto JSON deve essere un array');
  }

  return data.map(item => ({
    id: item.id || uuidv4(),
    scope: item.scope || 'chat',
    timestamp: item.timestamp || Date.now(),
    tags: item.tags || [],
    text: item.text
  }));
}

function parseCsvImport(content: string): ContextItem[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  if (!headers.includes('text')) {
    throw new Error('Il CSV deve contenere una colonna "text"');
  }

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const item: any = {};
    
    headers.forEach((header, i) => {
      if (values[i]) {
        item[header] = header === 'tags' ? 
          values[i].split(',').map((t: string) => t.trim()) : 
          values[i];
      }
    });

    return {
      id: item.id || uuidv4(),
      scope: item.scope || 'chat',
      timestamp: item.timestamp ? parseInt(item.timestamp) : Date.now(),
      tags: item.tags || [],
      text: item.text
    };
  });
}

function parseMarkdownImport(content: string): ContextItem[] {
  const sections = content.split('---').filter(s => s.trim());
  const items: ContextItem[] = [];

  for (const section of sections) {
    const lines = section.split('\n');
    const item: any = {};

    for (const line of lines) {
      if (line.startsWith('### ID:')) {
        item.id = line.replace('### ID:', '').trim();
      } else if (line.includes('**Scope**:')) {
        item.scope = line.split('**Scope**:')[1].trim();
      } else if (line.includes('**Timestamp**:')) {
        const timestamp = line.split('**Timestamp**:')[1].trim();
        item.timestamp = new Date(timestamp).getTime();
      } else if (line.includes('**Tags**:')) {
        const tags = line.split('**Tags**:')[1].trim();
        item.tags = tags.split(',').map(t => t.trim().replace(/`/g, ''));
      } else if (line.trim() && !line.startsWith('-')) {
        item.text = line.trim();
      }
    }

    if (item.text) {
      items.push({
        id: item.id || uuidv4(),
        scope: item.scope || 'chat',
        timestamp: item.timestamp || Date.now(),
        tags: item.tags || [],
        text: item.text
      });
    }
  }

  return items;
}

function normalizeImportedItem(
  item: ContextItem,
  options: ImportOptions
): ContextItem {
  return {
    ...item,
    scope: options.scope || item.scope,
    tags: options.mergeTags ? 
      [...new Set([...item.tags])] : // Deduplica tag
      item.tags
  };
}

async function insertIntoMemory(
  items: ContextItem[],
  options: ImportOptions
): Promise<ImportResult> {
  const existingContexts = await getMemoryContexts();
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  for (const item of items) {
    try {
      const normalized = normalizeImportedItem(item, options);
      
      // Verifica duplicati
      const isDuplicate = existingContexts.some(
        ctx => ctx.id === normalized.id || ctx.text === normalized.text
      );

      if (isDuplicate) {
        result.skipped++;
        continue;
      }

      existingContexts.push(normalized);
      result.imported++;
    } catch (error) {
      result.errors.push(
        `Errore nell'importazione dell'item ${item.id}: ${
          error instanceof Error ? error.message : 'Errore sconosciuto'
        }`
      );
    }
  }

  if (result.imported > 0) {
    await saveMemoryContexts(existingContexts);
  }

  return result;
}

export async function contextImportHandler(
  args: ImportOptions
): Promise<ToolCallResult> {
  try {
    const {
      format = 'auto',
      content,
      scope,
      mergeTags = true
    } = args;

    // Rileva il formato se auto
    const detectedFormat = format === 'auto' ? 
      detectImportFormat(content) : 
      format;

    // Parsing in base al formato
    let items: ContextItem[];
    switch (detectedFormat) {
      case 'json':
        items = parseJsonImport(content);
        break;
      case 'csv':
        items = parseCsvImport(content);
        break;
      case 'markdown':
        items = parseMarkdownImport(content);
        break;
      default:
        throw new Error(`Formato non supportato: ${detectedFormat}`);
    }

    // Inserimento in memoria
    const result = await insertIntoMemory(items, {
      format: detectedFormat,
      content,
      scope,
      mergeTags
    });

    return {
      success: true,
      output: {
        format: detectedFormat,
        ...result
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante l\'importazione'
    };
  }
} 