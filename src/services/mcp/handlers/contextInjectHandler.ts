import * as path from 'path';
import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { McpToolHandler, McpToolResult } from '../../../shared/types/mcp.types';

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null,
  },
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

// Cache in-memory dei contesti iniettati (per persistenza durante la sessione)
interface ContextItem {
  id: string;
  scope: string;
  text: string;
  timestamp: number;
  tags?: string[]; // Array di tag semantici
}

// Memoria divisa per scope
const memoryStore: Record<string, ContextItem[]> = {
  chat: [],
  project: [],
  agent: [],
};

/**
 * Genera un ID univoco per l'item in memoria
 */
function generateMemoryId(): string {
  return uuidv4();
}

/**
 * Aggiunge un nuovo contesto alla memoria
 */
function addToMemory(scope: string, text: string): ContextItem {
  const newItem: ContextItem = {
    id: generateMemoryId(),
    scope,
    text,
    timestamp: Date.now(),
  };

  // Assicura che lo scope esista
  if (!memoryStore[scope]) {
    memoryStore[scope] = [];
  }

  // Aggiungi alla memoria
  memoryStore[scope].push(newItem);

  return newItem;
}

/**
 * Restituisce i contesti memorizzati per uno specifico scope
 */
export function getFromMemory(scope: string): ContextItem[] {
  return memoryStore[scope] || [];
}

/**
 * Restituisce tutti i contesti memorizzati
 */
export function getAllMemory(): Record<string, ContextItem[]> {
  return { ...memoryStore };
}

/**
 * Salva la memoria su disco per persistenza
 */
async function persistMemoryToDisk(): Promise<void> {
  try {
    // Ottieni il percorso workspace
    let workspacePath = process.cwd();
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }

    // Directory per la memoria persistente
    const memoryDir = path.join(workspacePath, '.mcp-memory');

    // Crea la directory se non esiste
    try {
      await fs.mkdir(memoryDir, { recursive: true });
    } catch (error) {
      console.warn('Impossibile creare directory di memoria:', error);
    }

    // Salva ogni tipo di memoria in un file separato
    for (const scope in memoryStore) {
      const filePath = path.join(memoryDir, `${scope}-memory.json`);
      await fs.writeFile(filePath, JSON.stringify(memoryStore[scope], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Errore nel salvataggio della memoria su disco:', error);
  }
}

/**
 * Carica la memoria dal disco all'avvio
 */
export async function loadMemoryFromDisk(): Promise<void> {
  try {
    // Ottieni il percorso workspace
    let workspacePath = process.cwd();
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }

    // Directory per la memoria persistente
    const memoryDir = path.join(workspacePath, '.mcp-memory');

    // Verifica se la directory esiste
    try {
      await fs.access(memoryDir);
    } catch {
      console.log('Nessuna memoria persistente trovata.');
      return; // Directory non esistente, nessuna memoria da caricare
    }

    // Carica ogni tipo di memoria dal relativo file
    for (const scope of ['chat', 'project', 'agent']) {
      const filePath = path.join(memoryDir, `${scope}-memory.json`);

      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const items = JSON.parse(fileContent);

        if (Array.isArray(items)) {
          memoryStore[scope] = items;
        }
      } catch (error) {
        console.log(`Nessuna memoria '${scope}' trovata o errore nel caricamento:`, error);
      }
    }
  } catch (error) {
    console.error('Errore nel caricamento della memoria dal disco:', error);
  }
}

/**
 * Crea una stringa di anteprima del testo (primi 50 caratteri)
 */
function createTextPreview(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Handler principale per context.inject
 */
export const contextInjectHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Estrai i parametri
  const scope = args?.scope || 'chat';
  const text = args?.text;

  // Valida i parametri
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      output: null,
      error: "Il parametro 'text' è obbligatorio e deve essere una stringa",
    };
  }

  if (!['chat', 'project', 'agent'].includes(scope)) {
    return {
      success: false,
      output: null,
      error: `Scope '${scope}' non valido. Valori ammessi: chat, project, agent`,
    };
  }

  try {
    // Aggiungi alla memoria
    const newItem = addToMemory(scope, text);

    // Salva su disco per persistenza
    await persistMemoryToDisk();

    // Prepara risultato
    const result = {
      success: true,
      memoryId: newItem.id,
      scope: newItem.scope,
      timestamp: newItem.timestamp,
      textPreview: createTextPreview(text),
      memorySize: memoryStore[scope].length,
      summary: `Contesto aggiunto con successo alla memoria '${scope}'`,
    };

    return {
      success: true,
      output: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Errore nell'iniezione del contesto:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'iniezione del contesto: ${error.message}`,
    };
  }
};
