import * as path from "path";
import * as fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import type * as vscode from "vscode";
import type { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";

// Supportiamo ESLint per TypeScript/JavaScript
let ESLint: any;
try {
  const eslintModule = require("eslint");
  ESLint = eslintModule.ESLint;
} catch (error) {
  console.warn("ESLint non disponibile come modulo. Utilizzeremo il fallback CLI.");
}

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null
  }
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

// Rileva linguaggio dal file
function detectLanguageFromPath(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json'
  };

  return languageMap[ext] || null;
}

// Verifico esistenza del file/cartella
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Eseguo comando di linting Python
async function lintPythonFile(filePath: string, shouldFix: boolean): Promise<any[]> {
  const execAsync = promisify(exec);
  
  // Determina il comando di linting
  const fixFlag = shouldFix ? "--fix-errors" : "";
  const cmd = `pylint ${filePath} --output-format=json ${fixFlag}`;
  
  try {
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr) {
      console.warn(`Avviso nell'esecuzione del linting Python: ${stderr}`);
    }
    
    if (!stdout.trim()) {
      return []; // Nessun problema trovato
    }
    
    try {
      // Converti l'output JSON in array di problemi
      const rawIssues = JSON.parse(stdout);
      return rawIssues.map((issue: any) => ({
        path: issue.path,
        line: issue.line,
        column: issue.column,
        severity: mapPylintSeverity(issue.type),
        message: issue.message,
        rule: issue.symbol || issue.message_id,
        fixApplied: shouldFix && issue.fix !== undefined
      }));
    } catch (parseError) {
      console.error("Errore nel parsing dell'output pylint:", parseError);
      return [{
        path: filePath,
        line: 0,
        column: 0,
        severity: "error",
        message: `Errore nel parsing dell'output: ${parseError}`,
        rule: "parser-error"
      }];
    }
  } catch (error: any) {
    // Pylint può uscire con codice diverso da 0 quando trova problemi
    if (error.stdout) {
      try {
        const rawIssues = JSON.parse(error.stdout);
        return rawIssues.map((issue: any) => ({
          path: issue.path,
          line: issue.line,
          column: issue.column,
          severity: mapPylintSeverity(issue.type),
          message: issue.message,
          rule: issue.symbol || issue.message_id,
          fixApplied: shouldFix && issue.fix !== undefined
        }));
      } catch {
        // Fallback se l'output non è JSON valido
      }
    }
    
    return [{
      path: filePath,
      line: 0,
      column: 0,
      severity: "error",
      message: `Errore nell'esecuzione di pylint: ${error.message}`,
      rule: "execution-error"
    }];
  }
}

// Mappa la severità di pylint
function mapPylintSeverity(pylintType: string): string {
  const severityMap: Record<string, string> = {
    'fatal': 'error',
    'error': 'error',
    'warning': 'warning',
    'convention': 'info',
    'refactor': 'info',
    'info': 'info'
  };
  
  return severityMap[pylintType.toLowerCase()] || 'info';
}

// Eseguo linting con ESLint
async function lintJavaScriptFile(filePath: string, shouldFix: boolean): Promise<any[]> {
  try {
    if (!ESLint) {
      // Fallback a CLI se il modulo non è disponibile
      return await lintWithEslintCli(filePath, shouldFix);
    }
    
    // Utilizzo il modulo ESLint
    const eslint = new ESLint({ fix: shouldFix });
    
    // Check se il file è ignorato
    const isIgnored = await eslint.isPathIgnored(filePath);
    if (isIgnored) {
      return [{
        path: filePath,
        line: 0,
        column: 0,
        severity: "info",
        message: "File ignorato da ESLint",
        rule: "eslint-ignore"
      }];
    }
    
    // Lint file
    const results = await eslint.lintFiles([filePath]);
    
    // Scrittura correzioni se necessario
    if (shouldFix) {
      await ESLint.outputFixes(results);
    }
    
    if (results.length === 0) {
      return [];
    }
    
    // Formatta risultati
    const issues: any[] = [];
    for (const result of results) {
      for (const message of result.messages) {
        issues.push({
          path: result.filePath,
          line: message.line || 0,
          column: message.column || 0,
          severity: mapEslintSeverity(message.severity),
          message: message.message,
          rule: message.ruleId || "unknown",
          fixApplied: shouldFix && message.fix !== undefined
        });
      }
    }
    
    return issues;
  } catch (error: any) {
    console.error("Errore nell'esecuzione di ESLint:", error);
    return [{
      path: filePath,
      line: 0,
      column: 0,
      severity: "error",
      message: `Errore nell'esecuzione di ESLint: ${error.message}`,
      rule: "execution-error"
    }];
  }
}

// Fallback a CLI per ESLint
async function lintWithEslintCli(filePath: string, shouldFix: boolean): Promise<any[]> {
  const execAsync = promisify(exec);
  
  const fixFlag = shouldFix ? "--fix" : "";
  const cmd = `npx eslint ${filePath} --format json ${fixFlag}`;
  
  try {
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr) {
      console.warn(`Avviso nell'esecuzione di ESLint CLI: ${stderr}`);
    }
    
    if (!stdout.trim()) {
      return []; // Nessun problema trovato
    }
    
    try {
      const results = JSON.parse(stdout);
      
      if (!results || results.length === 0) {
        return [];
      }
      
      // Formatta risultati
      const issues: any[] = [];
      for (const result of results) {
        for (const message of result.messages) {
          issues.push({
            path: result.filePath,
            line: message.line || 0,
            column: message.column || 0,
            severity: mapEslintSeverity(message.severity),
            message: message.message,
            rule: message.ruleId || "unknown",
            fixApplied: shouldFix && message.fix !== undefined
          });
        }
      }
      
      return issues;
    } catch (parseError) {
      console.error("Errore nel parsing dell'output ESLint:", parseError);
      return [{
        path: filePath,
        line: 0,
        column: 0,
        severity: "error",
        message: `Errore nel parsing dell'output ESLint: ${parseError}`,
        rule: "parser-error"
      }];
    }
  } catch (error: any) {
    return [{
      path: filePath,
      line: 0,
      column: 0,
      severity: "error",
      message: `Errore nell'esecuzione di ESLint CLI: ${error.message}`,
      rule: "execution-error"
    }];
  }
}

// Mappa la severità di ESLint
function mapEslintSeverity(eslintSeverity: number): string {
  const severityMap: Record<number, string> = {
    0: 'info',    // off
    1: 'warning', // warning
    2: 'error'    // error
  };
  
  return severityMap[eslintSeverity] || 'info';
}

// Handler principale per project.lint
export const projectLintHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Validazione parametri
  const filePath = args?.path;
  let language = args?.language;
  const shouldFix = args?.fix === true;
  
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
        error: `Il file o directory '${filePath}' non esiste`
      };
    }
    
    // Auto-rileva il linguaggio se non specificato
    if (!language) {
      language = detectLanguageFromPath(fullPath);
      if (!language) {
        return {
          success: false,
          output: null,
          error: "Impossibile rilevare automaticamente il linguaggio. Specificare il parametro 'language'"
        };
      }
    }
    
    // Esegui il linting in base al linguaggio
    let issues: any[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      issues = await lintJavaScriptFile(fullPath, shouldFix);
    } else if (language === 'python') {
      issues = await lintPythonFile(fullPath, shouldFix);
    } else {
      return {
        success: false,
        output: null,
        error: `Linguaggio '${language}' non supportato per il linting`
      };
    }
    
    // Genera riassunto
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    
    const summary = `Trovati ${errorCount} errori, ${warningCount} warning e ${infoCount} info in ${path.basename(fullPath)}`;
    
    const result = {
      success: true,
      issues,
      summary,
      fixApplied: shouldFix
    };
    
    return {
      success: true,
      output: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Errore nell'esecuzione del linting:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'esecuzione del linting: ${error.message}`
    };
  }
}; 