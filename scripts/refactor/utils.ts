/**
 * Utilities per lavorare in modo sicuro con ts-morph
 */
import { Node, CallExpression, SourceFile, SyntaxKind, ObjectLiteralExpression, PropertyAssignment } from 'ts-morph';
import path from 'path';
import fs from 'fs';
import { parse } from 'json2csv';

// Esportazioni CommonJS per compatibilità
// Quando questo file viene compilato in .js, questi export funzioneranno
module.exports = {
  safeGetText,
  safeIsKind,
  safeGetExpression,
  safeGetLineNumber,
  safeReplaceWithText,
  safeGetArguments,
  generateSafetyReport,
  saveReportToFile,
  extractMessageProperties,
  exportCsvReport
};

/**
 * Ottiene in modo sicuro il testo di un nodo
 * @param node Il nodo da cui estrarre il testo
 * @param defaultValue Valore predefinito in caso di errore
 * @returns Il testo del nodo o il valore predefinito
 */
export function safeGetText(node: Node | undefined, defaultValue: string = ''): string {
  if (!node || node.wasForgotten()) return defaultValue;
  
  try {
    return node.getText();
  } catch (error) {
    console.warn('Errore nel recuperare il testo del nodo:', error);
    return defaultValue;
  }
}

/**
 * Verifica in modo sicuro se un nodo è del tipo specificato
 * @param node Il nodo da verificare
 * @param kind Il tipo di nodo da verificare
 * @returns true se il nodo è del tipo specificato, false altrimenti
 */
export function safeIsKind(node: Node | undefined, kind: SyntaxKind): boolean {
  if (!node || node.wasForgotten()) return false;
  
  try {
    return node.getKind() === kind;
  } catch (error) {
    console.warn('Errore nel recuperare il tipo del nodo:', error);
    return false;
  }
}

/**
 * Ottiene in modo sicuro l'espressione di una chiamata
 * @param callExpr La chiamata da cui estrarre l'espressione
 * @returns L'espressione della chiamata o null
 */
export function safeGetExpression(callExpr: CallExpression): Node | null {
  if (!callExpr || callExpr.wasForgotten()) {
    return null;
  }
  
  try {
    return callExpr.getExpression();
  } catch (error) {
    console.warn('Errore nel recuperare l\'espressione della chiamata:', error);
    return null;
  }
}

/**
 * Ottiene in modo sicuro il numero di linea di un nodo
 * @param sourceFile Il file sorgente
 * @param node Il nodo di cui ottenere il numero di linea
 * @returns Il numero di linea o -1 in caso di errore
 */
export function safeGetLineNumber(sourceFile: SourceFile, node: Node): number {
  if (!node || node.wasForgotten() || !sourceFile || sourceFile.wasForgotten()) return -1;
  
  try {
    const pos = node.getStart();
    const { line } = sourceFile.getLineAndColumnAtPos(pos);
    return line;
  } catch (error) {
    console.warn('Errore nel recuperare il numero di linea:', error);
    return -1;
  }
}

/**
 * Sostituisce in modo sicuro un nodo con un testo
 * @param node Il nodo da sostituire
 * @param text Il testo con cui sostituire il nodo
 * @returns true se la sostituzione è avvenuta con successo, false altrimenti
 */
export function safeReplaceWithText(node: Node, text: string): boolean {
  if (!node || node.wasForgotten()) return false;
  
  try {
    node.replaceWithText(text);
    return true;
  } catch (error) {
    console.warn('Errore nel sostituire il nodo con il testo:', error);
    return false;
  }
}

/**
 * Ottiene in modo sicuro gli argomenti di una chiamata
 * @param callExpr La chiamata da cui estrarre gli argomenti
 * @returns Gli argomenti della chiamata o un array vuoto
 */
export function safeGetArguments(callExpr: CallExpression): Node[] {
  if (!callExpr || callExpr.wasForgotten()) return [];
  
  try {
    return callExpr.getArguments();
  } catch (error) {
    console.warn('Errore nel recuperare gli argomenti della chiamata:', error);
    return [];
  }
}

export interface SafetyIssue {
  type: 'nested-call' | 'missing-import' | 'raw-message' | 'malformed-call';
  file: string;
  line: number;
  code?: string;
  message: string;
}

export interface SafetyReport {
  timestamp: string;
  totalFiles: number;
  filesWithIssues: number;
  issues: SafetyIssue[];
}

export function generateSafetyReport(issues: SafetyIssue[], totalFiles: number): SafetyReport {
  const report: SafetyReport = {
    timestamp: new Date().toISOString(),
    totalFiles,
    filesWithIssues: [...new Set(issues.map(issue => issue.file))].length,
    issues
  };
  
  return report;
}

export function saveReportToFile(report: SafetyReport, outputPath?: string): string {
  const reportsDir = path.join(process.cwd(), 'reports');
  
  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Generate filename with timestamp if not provided
  const filename = outputPath || path.join(reportsDir, `safety-report-${Date.now()}.json`);
  
  // Write report to file
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  
  return filename;
}

// Function to extract role and content from a message object literal
export function extractMessageProperties(obj: ObjectLiteralExpression): { 
  role?: string; 
  content?: string;
  hasRole: boolean;
  hasContent: boolean;
} {
  let role: string | undefined;
  let content: string | undefined;
  let hasRole = false;
  let hasContent = false;
  
  try {
    if (!obj || obj.wasForgotten()) {
      return { hasRole: false, hasContent: false };
    }
    
    const properties = obj.getProperties();
    
    for (const prop of properties) {
      if (prop.wasForgotten() || !safeIsKind(prop, SyntaxKind.PropertyAssignment)) {
        continue;
      }
      
      const propAssignment = prop as PropertyAssignment;
      const propName = safeGetText(propAssignment.getNameNode());
      
      if (propName === 'role') {
        hasRole = true;
        const initializer = propAssignment.getInitializer();
        if (initializer && !initializer.wasForgotten()) {
          role = safeGetText(initializer);
        }
      } else if (propName === 'content') {
        hasContent = true;
        const initializer = propAssignment.getInitializer();
        if (initializer && !initializer.wasForgotten()) {
          content = safeGetText(initializer);
        }
      }
    }
  } catch (error) {
    // Error handling
  }
  
  return { role, content, hasRole, hasContent };
}

/**
 * Esporta il report in formato CSV
 * @param data Array di oggetti SafetyIssue da esportare
 * @param outputPath Percorso del file CSV da generare
 * @returns Percorso del file CSV generato o stringa vuota in caso di errore
 */
export function exportCsvReport(data: SafetyIssue[], outputPath: string): string {
  if (!data || data.length === 0) {
    console.log('📄 Nessun problema da esportare in CSV.');
    return '';
  }

  try {
    // Determina i campi da includere nel CSV, assicurando l'ordine
    const fields = ['file', 'line', 'type', 'message', 'code'];
    
    // Genera il CSV
    const csv = parse(data, { fields });
    
    // Crea cartella reports se non esiste
    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Scrive il file CSV
    fs.writeFileSync(outputPath, csv, 'utf-8');
    console.log(`📄 Report CSV esportato con successo in: ${outputPath}`);
    
    return outputPath;
  } catch (err) {
    console.error('❌ Errore durante l\'esportazione CSV:', err);
    return '';
  }
} 