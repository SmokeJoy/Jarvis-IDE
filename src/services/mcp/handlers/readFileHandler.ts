import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import type { ReadFileArgs } from '../mcp.types.js';

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null
  }
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

/**
 * Handler per la lettura di file
 * 
 * @param args - Argomenti per la lettura del file
 * @returns Contenuto del file letto o messaggio di errore
 */
export async function readFileHandler(args: ReadFileArgs): Promise<{ success: boolean; message?: string; data?: string }> {
  // Verifica che sia stato specificato un percorso
  if (!args.filePath) {
    return {
      success: false,
      message: 'Percorso del file non specificato'
    };
  }

  try {
    // Normalizza il percorso
    const normalizedPath = path.normalize(args.filePath);
    
    // Verifica se il percorso è assoluto o relativo
    const isAbsolutePath = path.isAbsolute(normalizedPath);
    
    // Ottieni il percorso completo del file
    let filePath = normalizedPath;
    
    // Se è un percorso relativo, ottieni il percorso assoluto rispetto alla cartella di lavoro
    if (!isAbsolutePath && vscodeMod.workspace.workspaceFolders) {
      filePath = path.join(vscodeMod.workspace.workspaceFolders[0].uri.fsPath, normalizedPath);
    }
    
    // Verifica se il percorso esiste
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return {
        success: false,
        message: `Il percorso non è un file: ${args.filePath}`
      };
    }
    
    // Leggi il contenuto del file
    const encoding = args.encoding || 'utf-8';
    const content = await fs.readFile(filePath, encoding);
    
    return {
      success: true,
      data: content
    };
  } catch (error) {
    return {
      success: false,
      message: `Errore durante la lettura del file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 