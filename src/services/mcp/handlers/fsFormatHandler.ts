import * as path from "path";
import * as fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";

// Promisify exec per usare con async/await
const execAsync = promisify(exec);

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null
  }
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

/**
 * Rileva il linguaggio dal percorso del file
 */
function detectFormatLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();

  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".py": "python",
    ".c": "c",
    ".cpp": "cpp",
    ".go": "go",
    ".java": "java",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml"
  };

  return map[ext] || null;
}

/**
 * Verifico esistenza del file/cartella
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Interfaccia per il risultato del formatter
 */
interface FormatResult {
  success: boolean;
  formattedContent?: string;
  error?: string;
  formatter?: string;
}

/**
 * Formatta codice JavaScript/TypeScript con Prettier
 */
async function formatWithPrettier(filePath: string, writeToFile: boolean): Promise<FormatResult> {
  // Determina il comando di formattazione
  const cmdWrite = `npx prettier --write "${filePath}"`;
  const cmdCheck = `npx prettier "${filePath}"`;
  
  try {
    if (writeToFile) {
      // Se dobbiamo scrivere il file, usiamo --write
      await execAsync(cmdWrite);
      
      // Leggiamo il file aggiornato
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        success: true,
        formattedContent: content,
        formatter: 'prettier'
      };
    } else {
      // Altrimenti, usiamo prettier e restituiamo l'output
      const { stdout } = await execAsync(cmdCheck);
      
      return {
        success: true,
        formattedContent: stdout,
        formatter: 'prettier'
      };
    }
  } catch (error: any) {
    // Se c'è un errore ma abbiamo stdout, probabilmente il comando è stato eseguito
    // ma ci sono stati warning (es. file non formattato correttamente)
    if (error.stdout) {
      return {
        success: true,
        formattedContent: error.stdout,
        formatter: 'prettier'
      };
    }
    
    return {
      success: false,
      error: `Errore nell'esecuzione di prettier: ${error.message}`,
      formatter: 'prettier'
    };
  }
}

/**
 * Formatta codice Python con Black
 */
async function formatWithBlack(filePath: string, writeToFile: boolean): Promise<FormatResult> {
  // Black scrive sempre il file, quindi dobbiamo leggere prima se non vogliamo sovrascrivere
  const originalContent = !writeToFile ? await fs.readFile(filePath, 'utf-8') : '';
  
  try {
    // Black scrive sempre il file
    const cmd = `black "${filePath}"`;
    await execAsync(cmd);
    
    if (!writeToFile) {
      // Se non vogliamo scrivere, ripristiniamo il file originale
      await fs.writeFile(filePath, originalContent);
      
      // Leggiamo il file formattato prima di ripristinarlo
      const formattedContent = await fs.readFile(filePath, 'utf-8');
      
      // Ripristina
      await fs.writeFile(filePath, originalContent);
      
      return {
        success: true,
        formattedContent: formattedContent,
        formatter: 'black'
      };
    } else {
      // Se vogliamo scrivere, leggiamo il contenuto formattato
      const formattedContent = await fs.readFile(filePath, 'utf-8');
      
      return {
        success: true,
        formattedContent: formattedContent,
        formatter: 'black'
      };
    }
  } catch (error: any) {
    // Prova con autopep8 se black fallisce
    try {
      console.log("Black non disponibile. Tentativo con autopep8...");
      return await formatWithAutopep8(filePath, writeToFile);
    } catch (autopep8Error: any) {
      return {
        success: false,
        error: `Errore nell'esecuzione di black: ${error.message}. Autopep8 fallback: ${autopep8Error.message}`,
        formatter: 'black/autopep8'
      };
    }
  }
}

/**
 * Formatta codice Python con Autopep8 (fallback)
 */
async function formatWithAutopep8(filePath: string, writeToFile: boolean): Promise<FormatResult> {
  try {
    if (writeToFile) {
      // Se dobbiamo scrivere il file, usiamo --in-place
      const cmd = `autopep8 --in-place "${filePath}"`;
      await execAsync(cmd);
      
      // Leggiamo il file aggiornato
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        success: true,
        formattedContent: content,
        formatter: 'autopep8'
      };
    } else {
      // Altrimenti, usiamo autopep8 senza --in-place
      const cmd = `autopep8 "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      
      return {
        success: true,
        formattedContent: stdout,
        formatter: 'autopep8'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Errore nell'esecuzione di autopep8: ${error.message}`,
      formatter: 'autopep8'
    };
  }
}

/**
 * Formatta codice C/C++ con ClangFormat
 */
async function formatWithClangFormat(filePath: string, writeToFile: boolean): Promise<FormatResult> {
  try {
    if (writeToFile) {
      // Se dobbiamo scrivere il file, usiamo -i
      const cmd = `clang-format -i "${filePath}"`;
      await execAsync(cmd);
      
      // Leggiamo il file aggiornato
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        success: true,
        formattedContent: content,
        formatter: 'clang-format'
      };
    } else {
      // Altrimenti, usiamo clang-format senza -i
      const cmd = `clang-format "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      
      return {
        success: true,
        formattedContent: stdout,
        formatter: 'clang-format'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Errore nell'esecuzione di clang-format: ${error.message}`,
      formatter: 'clang-format'
    };
  }
}

/**
 * Formatta codice Go con GoFmt
 */
async function formatWithGoFmt(filePath: string, writeToFile: boolean): Promise<FormatResult> {
  try {
    if (writeToFile) {
      // Se dobbiamo scrivere il file, usiamo -w
      const cmd = `gofmt -w "${filePath}"`;
      await execAsync(cmd);
      
      // Leggiamo il file aggiornato
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        success: true,
        formattedContent: content,
        formatter: 'gofmt'
      };
    } else {
      // Altrimenti, usiamo gofmt senza -w
      const cmd = `gofmt "${filePath}"`;
      const { stdout } = await execAsync(cmd);
      
      return {
        success: true,
        formattedContent: stdout,
        formatter: 'gofmt'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Errore nell'esecuzione di gofmt: ${error.message}`,
      formatter: 'gofmt'
    };
  }
}

/**
 * Formatta un file in base al suo linguaggio
 */
async function formatFile(filePath: string, language: string | null, writeToFile: boolean): Promise<FormatResult> {
  // Se il linguaggio non è specificato, rilevalo automaticamente
  const detectedLanguage = language || detectFormatLanguage(filePath);
  
  if (!detectedLanguage) {
    return {
      success: false,
      error: `Impossibile determinare il linguaggio del file. Specifica il linguaggio esplicitamente.`
    };
  }
  
  // Formatta in base al linguaggio
  switch (detectedLanguage.toLowerCase()) {
    case 'typescript':
    case 'javascript':
    case 'json':
    case 'markdown':
    case 'html':
    case 'css':
    case 'scss':
    case 'yaml':
    case 'xml':
      return await formatWithPrettier(filePath, writeToFile);
    
    case 'python':
      return await formatWithBlack(filePath, writeToFile);
    
    case 'c':
    case 'cpp':
      return await formatWithClangFormat(filePath, writeToFile);
    
    case 'go':
      return await formatWithGoFmt(filePath, writeToFile);
    
    default:
      // Tenta con prettier come fallback generale
      try {
        console.log(`Linguaggio ${detectedLanguage} non supportato esplicitamente. Tentativo con prettier...`);
        return await formatWithPrettier(filePath, writeToFile);
      } catch (error: any) {
        return {
          success: false,
          error: `Linguaggio ${detectedLanguage} non supportato per la formattazione.`
        };
      }
  }
}

/**
 * Handler principale per fs.format
 */
export const fsFormatHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Validazione parametri
  const filePath = args?.path;
  const language = args?.language;
  const writeToFile = args?.write === true;
  
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      output: null,
      error: "Parametro 'path' mancante o non valido"
    };
  }
  
  try {
    // Ottieni il percorso workspace
    let workspacePath = process.cwd();
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }
    
    // Risolvi path completo
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(workspacePath, filePath);
    
    // Verifica esistenza file
    const exists = await fileExists(fullPath);
    if (!exists) {
      return {
        success: false,
        output: null,
        error: `Il file '${filePath}' non esiste`
      };
    }
    
    // Ottieni informazioni sul file
    const stats = await fs.stat(fullPath);
    
    // Controllo se è una directory
    if (stats.isDirectory()) {
      return {
        success: false,
        output: null,
        error: `Il path '${filePath}' è una directory. Attualmente fs.format supporta solo singoli file.`
      };
    }
    
    // Formatta il file
    const formatResult = await formatFile(fullPath, language, writeToFile);
    
    if (!formatResult.success) {
      return {
        success: false,
        output: null,
        error: formatResult.error || "Errore sconosciuto durante la formattazione"
      };
    }
    
    // Preparazione risultato
    const result = {
      formatted: true,
      written: writeToFile,
      modifiedFiles: writeToFile ? [filePath] : [],
      formatter: formatResult.formatter,
      // Se non scriviamo, includiamo il contenuto formattato
      content: !writeToFile ? formatResult.formattedContent : undefined,
      summary: `File ${writeToFile ? 'formattato e salvato' : 'formattato'} con ${formatResult.formatter}`
    };
    
    return {
      success: true,
      output: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Errore nell'esecuzione della formattazione:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'esecuzione della formattazione: ${error.message}`
    };
  }
}; 