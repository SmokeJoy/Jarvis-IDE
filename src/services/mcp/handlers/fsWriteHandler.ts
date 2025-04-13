import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { McpToolHandler, McpToolResult } from '../../../shared/types/mcp.types';

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null,
  },
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

// Estensioni di file consentite per la scrittura
const allowedExtensions = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.txt',
  '.css',
  '.scss',
  '.less',
  '.html',
  '.xml',
  '.yaml',
  '.yml',
];

/**
 * Handler per il comando fs.write
 * Scrive contenuto in un file, controllando prima i vincoli di sicurezza
 */
export const fsWriteHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Validazione parametri
  const filePath = args?.path;
  const content = args?.content;
  const overwrite = !!args?.overwrite;
  const previewOnly = !!args?.previewOnly;

  // Verifica parametri obbligatori
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      output: null,
      error: "Parametro 'path' mancante o non valido",
    };
  }

  if (content === undefined || typeof content !== 'string') {
    return {
      success: false,
      output: null,
      error: "Parametro 'content' mancante o non valido",
    };
  }

  try {
    // Ottieni il percorso workspace
    let workspacePath = process.cwd(); // Default al percorso corrente

    // Se c'è un workspace VS Code aperto, usalo invece
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }

    // Risolvi il percorso completo e controlla che sia all'interno del workspace
    const absPath = path.resolve(workspacePath, filePath);
    if (!absPath.startsWith(workspacePath)) {
      return {
        success: false,
        output: null,
        error: "Percorso non autorizzato: deve essere all'interno del workspace",
      };
    }

    // Controlla l'estensione del file
    const fileExt = path.extname(absPath).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return {
        success: false,
        output: null,
        error: `Estensione file non consentita: ${fileExt}. Estensioni consentite: ${allowedExtensions.join(', ')}`,
      };
    }

    // Verifica se il file esiste
    let fileExists = false;
    try {
      const stats = await fs.stat(absPath);
      fileExists = stats.isFile();
    } catch (err) {
      // File non esiste, va bene continuare
      fileExists = false;
    }

    // Se il file esiste ma overwrite è false, blocca l'operazione
    if (fileExists && !overwrite) {
      return {
        success: false,
        output: null,
        error: "Il file esiste già. Usa 'overwrite: true' per sovrascriverlo.",
      };
    }

    // Se è una preview, non scrivere effettivamente
    if (previewOnly) {
      console.log(`[PREVIEW] Scrittura file simulata: ${filePath}`);

      return {
        success: true,
        output: {
          path: filePath,
          absolutePath: absPath,
          content: content.slice(0, 300) + (content.length > 300 ? '...' : ''),
          mode: fileExists ? 'sovrascrittura' : 'creazione',
          previewOnly: true,
        },
      };
    }

    // Assicurati che la directory esista
    const dirPath = path.dirname(absPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Scrivi il file
    await fs.writeFile(absPath, content, 'utf-8');

    return {
      success: true,
      output: {
        path: filePath,
        absolutePath: absPath,
        size: Buffer.from(content).length,
        mode: fileExists ? 'sovrascrittura' : 'creazione',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Errore durante la scrittura del file: ${error.message}`,
    };
  }
};
