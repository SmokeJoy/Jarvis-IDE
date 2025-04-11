import * as vscode from 'vscode';
import type { HandlerFunction } from '../types.js';
import { readFile } from 'fs/promises';
import { extname } from 'path';

interface ErrorResolverArgs {
  filePath: string;
  errorMessage?: string;
  lineNumber?: number;
  context?: string;
}

interface ErrorAnalysis {
  type: string;
  message: string;
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
  context?: string;
}

interface ErrorPattern {
  pattern: RegExp;
  type: string;
  severity: 'error' | 'warning' | 'info';
  getSuggestion: (match: RegExpMatchArray) => string;
}

const commonErrorPatterns: ErrorPattern[] = [
  {
    pattern: /Cannot find module '([^']+)'/,
    type: 'ModuleNotFound',
    severity: 'error',
    getSuggestion: (match) => `Installa il modulo mancante con 'npm install ${match[1]}'`
  },
  {
    pattern: /Property '([^']+)' does not exist on type/,
    type: 'TypeMismatch',
    severity: 'error',
    getSuggestion: (match) => `Verifica la definizione del tipo e aggiungi la proprietà '${match[1]}' se necessaria`
  },
  {
    pattern: /Unexpected token '([^']+)'/,
    type: 'SyntaxError',
    severity: 'error',
    getSuggestion: (match) => `Correggi la sintassi: token inaspettato '${match[1]}'`
  }
];

async function analyzeError(filePath: string, errorMessage?: string, lineNumber?: number): Promise<ErrorAnalysis> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const fileExtension = extname(filePath);
    
    let analysis: ErrorAnalysis = {
      type: 'Unknown',
      message: errorMessage || 'Errore non specificato',
      location: {
        file: filePath,
        line: lineNumber
      },
      severity: 'error'
    };

    if (errorMessage) {
      for (const pattern of commonErrorPatterns) {
        const match = errorMessage.match(pattern.pattern);
        if (match) {
          analysis = {
            ...analysis,
            type: pattern.type,
            severity: pattern.severity,
            suggestedFix: pattern.getSuggestion(match)
          };
          break;
        }
      }
    }

    // Aggiungi il contesto del codice se è disponibile il numero di riga
    if (lineNumber !== undefined) {
      const lines = fileContent.split('\n');
      const start = Math.max(0, lineNumber - 2);
      const end = Math.min(lines.length, lineNumber + 2);
      analysis.context = lines.slice(start, end).join('\n');
    }

    return analysis;
  } catch (error) {
    throw new Error(`Failed to analyze error in file ${filePath}: ${error.message}`);
  }
}

export const errorResolver: HandlerFunction = async (args: ErrorResolverArgs) => {
  const { filePath, errorMessage, lineNumber, context } = args;

  try {
    const analysis = await analyzeError(filePath, errorMessage, lineNumber);
    if (context) {
      analysis.context = context;
    }
    
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to resolve error: ${error.message}`
    };
  }
};