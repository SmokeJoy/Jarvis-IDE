/**
 * @file jarvis-refactor.ts
 * @description Strumento CLI per analizzare e tracciare il refactoring della type safety in Jarvis IDE
 * 
 * Uso:
 * npx ts-node --esm tools/jarvis-refactor.ts --report-any
 * npx ts-node --esm tools/jarvis-refactor.ts --find-js-imports
 * npx ts-node --esm tools/jarvis-refactor.ts --rename-js-to-ts
 * npx ts-node --esm tools/jarvis-refactor.ts --generate-map
 * 
 * @author TypescriptGPT & Team Jarvis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as util from 'util';
import { exec as execCallback } from 'child_process';
import * as yaml from 'js-yaml';
import * as ts from 'typescript';

// Promisify exec
const exec = util.promisify(execCallback);

// Get current file directory for ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const SRC_DIR = path.resolve(process.cwd(), './src');
const REPORT_FILE = path.resolve(process.cwd(), 'refactor-map.yaml');
const TREND_FILE = path.resolve(process.cwd(), 'refactor-trend.md');
const DETAILED_REPORT_FILE = path.resolve(process.cwd(), 'refactor-details.json');

// Interfacce
interface LocationInfo {
  line: number;
  column: number;
  context: string;
  text?: string;
}

interface FileReport {
  path: string;
  filePath?: string; // For backward compatibility
  anyCount: number;
  jsImports: number;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'pending';
  anyLocations: LocationInfo[];
  jsImportLocations: LocationInfo[];
}

interface RefactorMap {
  lastUpdated: string;
  totalFiles: number;
  filesWithAny: number;
  filesWithJsImports: number;
  totalAnyCount: number;
  totalJsImports: number;
  files: FileReport[];
}

interface DetailedRefactorMap extends RefactorMap {
  filesWithDetails: (FileReport & { anyLocations: LocationInfo[], jsImportLocations: LocationInfo[] })[];
}

const projectRoot = path.resolve(process.cwd(), 'src');

/**
 * Cammina ricorsivamente attraverso una directory
 */
function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(fullPath);
    }
  });
}

/**
 * Ottiene la posizione (riga, colonna) da un offset nel file
 */
function getLineAndColumnFromPosition(content: string, pos: number): { line: number, column: number } {
  const lines = content.substring(0, pos).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Ottiene il contesto circostante (la riga completa) per una posizione
 */
function getContextForPosition(content: string, pos: number): string {
  const lines = content.split('\n');
  const { line } = getLineAndColumnFromPosition(content, pos);
  return lines[line - 1].trim();
}

/**
 * Analizza un file per trovare 'any' types e JS imports con posizione
 */
function analyzeFile(filePath: string): FileReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true);
  
  const anyLocations = findAnyTypesWithLocations(sourceFile, content);
  const jsImportLocations = findJsImportsWithLocations(content);
    
  return {
    path: path.relative(projectRoot, filePath),
    filePath: path.relative(projectRoot, filePath),
    anyCount: anyLocations.length,
    jsImports: jsImportLocations.length,
    anyLocations,
    jsImportLocations,
    priority: 'low',
    status: 'pending'
  };
}

/**
 * Trova tutte le occorrenze di 'any' nel codice con posizioni
 */
function findAnyTypesWithLocations(sourceFile: ts.SourceFile, content: string): LocationInfo[] {
  const anyLocations: LocationInfo[] = [];
  
  // Visita l'AST per trovare i riferimenti a 'any'
  function visit(node: ts.Node) {
    // Controllare i tipi espliciti 'any'
    if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'any') {
      const pos = node.getStart(sourceFile);
      const { line, column } = getLineAndColumnFromPosition(content, pos);
      anyLocations.push({
        line,
        column,
        text: 'any',
        context: getContextForPosition(content, pos)
      });
    }
    
    // Controllare le asserzioni di tipo 'as any'
    if (ts.isAsExpression(node) && 
        node.type && 
        ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any') {
      const pos = node.type.getStart(sourceFile);
      const { line, column } = getLineAndColumnFromPosition(content, pos);
      anyLocations.push({
        line,
        column,
        text: 'as any',
        context: getContextForPosition(content, pos)
      });
    }
    
    // Controllare le dichiarazioni di variabili con tipo 'any'
    if (ts.isVariableDeclaration(node) && 
        node.type && 
        ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any') {
      const pos = node.type.getStart(sourceFile);
      const { line, column } = getLineAndColumnFromPosition(content, pos);
      anyLocations.push({
        line,
        column,
        text: `: any`,
        context: getContextForPosition(content, pos)
      });
    }
    
    // Controllare i parametri di funzione con tipo 'any'
    if (ts.isParameter(node) && 
        node.type && 
        ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any') {
      const pos = node.type.getStart(sourceFile);
      const { line, column } = getLineAndColumnFromPosition(content, pos);
      anyLocations.push({
        line,
        column,
        text: `: any`,
        context: getContextForPosition(content, pos)
      });
    }
    
    // Controllare le firme di funzione con tipo di ritorno 'any'
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) && 
        node.type && 
        ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any') {
      const pos = node.type.getStart(sourceFile);
      const { line, column } = getLineAndColumnFromPosition(content, pos);
      anyLocations.push({
        line,
        column,
        text: `: any`,
        context: getContextForPosition(content, pos)
      });
    }
    
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  
  // Trova anche i pattern 'as any' con regex per essere sicuri
  const asAnyRegex = /as\s+any/g;
  let match;
  
  while ((match = asAnyRegex.exec(content)) !== null) {
    const pos = match.index;
    const { line, column } = getLineAndColumnFromPosition(content, pos);
    
    // Verifica se questa posizione è già stata rilevata dall'analisi AST
    const alreadyFound = anyLocations.some(loc => 
      loc.line === line && Math.abs(loc.column - column) < 5);
      
    if (!alreadyFound) {
      anyLocations.push({
        line,
        column,
        text: match[0],
        context: getContextForPosition(content, pos)
      });
    }
  }
  
  return anyLocations;
}

/**
 * Trova tutte le importazioni JS nel codice con posizioni
 */
function findJsImportsWithLocations(content: string): LocationInfo[] {
  const jsImportLocations: LocationInfo[] = [];
  const lines = content.split('\n');
  
  // Trova import da file .js
  const importRegex = /from\s+['"](.+\.js)['"]/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = importRegex.exec(line)) !== null) {
      jsImportLocations.push({
        line: index + 1,
        column: match.index + 1,
        text: match[1],
        context: line.trim()
      });
    }
  });
  
  // Trova require di file .js
  const requireRegex = /require\(\s*['"](.+\.js)['"]\s*\)/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = requireRegex.exec(line)) !== null) {
      jsImportLocations.push({
        line: index + 1,
        column: match.index + 1,
        text: match[1],
        context: line.trim()
      });
    }
  });
  
  return jsImportLocations;
}

function runAudit() {
  const reports: FileReport[] = [];

  walkDir(projectRoot, file => {
    reports.push(analyzeFile(file));
  });

  const totalAny = reports.reduce((sum, r) => sum + r.anyCount, 0);
  const totalJS = reports.reduce((sum, r) => sum + r.jsImports, 0);

  console.log('📊 Refactor Report');
  console.log('='.repeat(40));
  console.log(`🔍 Analizzati ${reports.length} file`);
  console.log(`🟡 Total "any" trovati: ${totalAny}`);
  console.log(`🔴 Importazioni .js trovate: ${totalJS}`);
  console.log('='.repeat(40));

  reports
    .filter(r => r.anyCount > 0 || r.jsImports > 0)
    .forEach(r => {
      console.log(`📁 ${r.path} → any: ${r.anyCount} | .js imports: ${r.jsImports}`);
      
      if (r.anyLocations && r.anyLocations.length > 0) {
        console.log('  Any types:');
        r.anyLocations.forEach(loc => {
          console.log(`    Line ${loc.line}: ${loc.context}`);
        });
      }
      
      if (r.jsImportLocations && r.jsImportLocations.length > 0) {
        console.log('  JS imports:');
        r.jsImportLocations.forEach(loc => {
          console.log(`    Line ${loc.line}: ${loc.context}`);
        });
      }
    });
}

/**
 * Trova tutte le occorrenze di 'any' nei file TypeScript
 */
async function findAllAnyTypes(): Promise<Map<string, { count: number, locations: LocationInfo[] }>> {
  const result = new Map<string, { count: number, locations: LocationInfo[] }>();
  
  walkDir(projectRoot, filePath => {
    const report = analyzeFile(filePath);
    if (report.anyCount > 0) {
      result.set(filePath, { 
        count: report.anyCount, 
        locations: report.anyLocations || [] 
      });
    }
  });
  
  return result;
}

/**
 * Trova tutti gli import .js nel codice
 */
async function findAllJsImports(): Promise<Map<string, { count: number, locations: LocationInfo[] }>> {
  const result = new Map<string, { count: number, locations: LocationInfo[] }>();
  
  walkDir(projectRoot, filePath => {
    const report = analyzeFile(filePath);
    if (report.jsImports > 0) {
      result.set(filePath, { 
        count: report.jsImports, 
        locations: report.jsImportLocations || [] 
      });
    }
  });
  
  return result;
}

/**
 * Genera un report in formato YAML
 */
async function generateReport(): Promise<RefactorMap> {
  const anyMap = await findAllAnyTypes();
  const jsImportMap = await findAllJsImports();
  
  const allFiles = new Set<string>([...anyMap.keys(), ...jsImportMap.keys()]);
  
  const files: FileReport[] = [];
  let totalAny = 0;
  let totalJsImports = 0;
  
  for (const filePath of allFiles) {
    const anyInfo = anyMap.get(filePath);
    const jsImportInfo = jsImportMap.get(filePath);
    
    const anyCount = anyInfo?.count || 0;
    const jsImports = jsImportInfo?.count || 0;
    
    totalAny += anyCount;
    totalJsImports += jsImports;
    
    const fileReport: FileReport = {
      path: filePath,
      anyCount,
      jsImports,
      priority: anyCount > 10 ? 'high' : anyCount > 5 ? 'medium' : 'low',
      status: 'pending',
      anyLocations: anyInfo?.locations || [],
      jsImportLocations: jsImportInfo?.locations || []
    };
    
    files.push(fileReport);
  }
  
  // Ordina per priorità e conteggio
  files.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return b.anyCount - a.anyCount;
  });
  
  const report: RefactorMap = {
    lastUpdated: new Date().toISOString(),
    totalFiles: allFiles.size,
    filesWithAny: files.filter(f => f.anyCount > 0).length,
    filesWithJsImports: files.filter(f => f.jsImports > 0).length,
    totalAnyCount: totalAny,
    totalJsImports: totalJsImports,
    files
  };
  
  return report;
}

/**
 * Genera un report dettagliato con le posizioni
 */
async function generateDetailedReport(): Promise<DetailedRefactorMap> {
  const basicReport = await generateReport();
  
  const filesWithDetails = basicReport.files
    .filter(f => (f.anyLocations && f.anyLocations.length > 0) || 
                 (f.jsImportLocations && f.jsImportLocations.length > 0))
    .map(f => {
      return {
        ...f,
        anyLocations: f.anyLocations || [],
        jsImportLocations: f.jsImportLocations || []
      };
    });
  
  return {
    ...basicReport,
    filesWithDetails
  };
}

/**
 * Aggiorna il file di trend
 */
async function updateTrendFile(anyCount: number): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const entry = `${date}: ${anyCount} any types\n`;
  
  if (fs.existsSync(TREND_FILE)) {
    fs.appendFileSync(TREND_FILE, entry);
  } else {
    fs.writeFileSync(TREND_FILE, `# Refactoring Trend\n\n${entry}`);
  }
}

/**
 * Stampa il report in formato markdown
 */
function printMarkdownReport(report: RefactorMap): void {
  console.log(`# Jarvis Type Safety Refactoring Report\n`);
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  console.log(`Total 'any' types found: ${report.totalAnyCount}`);
  console.log(`Total '.js' imports found: ${report.totalJsImports}\n`);
  
  console.log(`## High Priority Files (${report.files.filter(f => f.priority === 'high').length})\n`);
  console.log(`| File | Any Count | JS Imports | Status |`);
  console.log(`|------|-----------|------------|--------|`);
  
  for (const file of report.files.filter(f => f.priority === 'high')) {
    console.log(`| ${file.path} | ${file.anyCount} | ${file.jsImports} | ${file.status} |`);
  }
  
  console.log(`\n## Medium Priority Files (${report.files.filter(f => f.priority === 'medium').length})\n`);
  console.log(`| File | Any Count | JS Imports | Status |`);
  console.log(`|------|-----------|------------|--------|`);
  
  for (const file of report.files.filter(f => f.priority === 'medium')) {
    console.log(`| ${file.path} | ${file.anyCount} | ${file.jsImports} | ${file.status} |`);
  }
  
  console.log(`\n## Completed Files\n`);
  console.log(`| File | Any Count | JS Imports | Status |`);
  console.log(`|------|-----------|------------|--------|`);
  
  for (const file of report.files.filter(f => f.status === 'completed')) {
    console.log(`| ${file.path} | ${file.anyCount} | ${file.jsImports} | ${file.status} |`);
  }
}

/**
 * Stampa un report dettagliato con posizioni precise
 */
function printDetailedReport(report: DetailedRefactorMap): void {
  printMarkdownReport(report);
  
  console.log(`\n## Detailed Locations\n`);
  
  for (const file of report.filesWithDetails) {
    if (file.anyCount > 0 || file.jsImports > 0) {
      console.log(`\n### ${file.path}\n`);
      
      if (file.anyLocations.length > 0) {
        console.log(`#### Any Types (${file.anyLocations.length})\n`);
        console.log(`| Line | Column | Context |`);
        console.log(`|------|--------|---------|`);
        
        for (const loc of file.anyLocations) {
          console.log(`| ${loc.line} | ${loc.column} | \`${loc.context}\` |`);
        }
      }
      
      if (file.jsImportLocations.length > 0) {
        console.log(`\n#### JS Imports (${file.jsImportLocations.length})\n`);
        console.log(`| Line | Column | Module |`);
        console.log(`|------|--------|--------|`);
        
        for (const loc of file.jsImportLocations) {
          console.log(`| ${loc.line} | ${loc.column} | \`${loc.text}\` |`);
        }
      }
    }
  }
}

/**
 * Genera un report HTML con i frammenti di codice e gli 'any' evidenziati
 */
async function generateHtmlReport(report: RefactorMap): Promise<void> {
  const htmlOutputPath = path.resolve(__dirname, '../refactor-report.html');
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Type Safety Refactor Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 { 
      color: #2c3e50;
      margin-top: 1.5em;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      min-width: 200px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
    }
    .file-card {
      background-color: #fff;
      border-radius: 8px;
      margin-bottom: 20px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .file-path {
      font-weight: bold;
      font-family: monospace;
      word-break: break-all;
    }
    .priority-high {
      color: #e74c3c;
    }
    .priority-medium {
      color: #f39c12;
    }
    .priority-low {
      color: #27ae60;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .badge-high {
      background-color: #e74c3c;
    }
    .badge-medium {
      background-color: #f39c12;
    }
    .badge-low {
      background-color: #27ae60;
    }
    .badge-pending {
      background-color: #95a5a6;
    }
    .badge-progress {
      background-color: #3498db;
    }
    .badge-completed {
      background-color: #2ecc71;
    }
    .code-block {
      background-color: #f8f9fa;
      border-radius: 4px;
      padding: 10px;
      margin: 10px 0;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', 'Andale Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
    }
    .highlight-any {
      background-color: #ffcccc;
      padding: 2px;
      border-radius: 3px;
    }
    .highlight-js {
      background-color: #ffffcc;
      padding: 2px;
      border-radius: 3px;
    }
    .tabs {
      display: flex;
      margin-bottom: 10px;
    }
    .tab {
      padding: 8px 16px;
      cursor: pointer;
      border: 1px solid #ddd;
      background-color: #f8f9fa;
      border-radius: 4px 4px 0 0;
      margin-right: 5px;
    }
    .tab.active {
      background-color: #fff;
      border-bottom-color: #fff;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .progress-bar {
      height: 10px;
      background-color: #ecf0f1;
      border-radius: 5px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: #3498db;
    }
    .line-number {
      display: inline-block;
      width: 30px;
      text-align: right;
      color: #888;
      user-select: none;
      margin-right: 10px;
    }
    .line-content {
      white-space: pre;
    }
    .summary {
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <h1>Type Safety Refactor Report</h1>
  <p>Last updated: ${new Date(report.lastUpdated).toLocaleString()}</p>
  
  <div class="stats">
    <div class="stat-card">
      <div>Total Files</div>
      <div class="stat-value">${report.totalFiles}</div>
    </div>
    <div class="stat-card">
      <div>Files with 'any'</div>
      <div class="stat-value">${report.filesWithAny}</div>
      <div>${((report.filesWithAny / report.totalFiles) * 100).toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div>Files with JS imports</div>
      <div class="stat-value">${report.filesWithJsImports}</div>
      <div>${((report.filesWithJsImports / report.totalFiles) * 100).toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div>Total 'any' types</div>
      <div class="stat-value">${report.totalAnyCount}</div>
    </div>
    <div class="stat-card">
      <div>Total JS imports</div>
      <div class="stat-value">${report.totalJsImports}</div>
    </div>
  </div>
  
  <h2>Progress</h2>
  <div class="summary">
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${Math.round((report.files.filter(f => f.status === 'completed').length / report.files.length) * 100)}%;"></div>
    </div>
    <div>
      <span class="badge badge-completed">Completed</span> ${report.files.filter(f => f.status === 'completed').length} (${((report.files.filter(f => f.status === 'completed').length / report.files.length) * 100).toFixed(1)}%)
      <span class="badge badge-progress">In Progress</span> ${report.files.filter(f => f.status === 'in-progress').length} (${((report.files.filter(f => f.status === 'in-progress').length / report.files.length) * 100).toFixed(1)}%)
      <span class="badge badge-pending">Pending</span> ${report.files.filter(f => f.status === 'pending').length} (${((report.files.filter(f => f.status === 'pending').length / report.files.length) * 100).toFixed(1)}%)
    </div>
  </div>
  
  <h2>Files by Priority</h2>
  <table>
    <thead>
      <tr>
        <th>Priority</th>
        <th>Count</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-high">High</span></td>
        <td>${report.files.filter(f => f.priority === 'high').length}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.round((report.files.filter(f => f.priority === 'high' && f.status === 'completed').length / Math.max(1, report.files.filter(f => f.priority === 'high').length)) * 100)}%;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td><span class="badge badge-medium">Medium</span></td>
        <td>${report.files.filter(f => f.priority === 'medium').length}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.round((report.files.filter(f => f.priority === 'medium' && f.status === 'completed').length / Math.max(1, report.files.filter(f => f.priority === 'medium').length)) * 100)}%;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td><span class="badge badge-low">Low</span></td>
        <td>${report.files.filter(f => f.priority === 'low').length}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.round((report.files.filter(f => f.priority === 'low' && f.status === 'completed').length / Math.max(1, report.files.filter(f => f.priority === 'low').length)) * 100)}%;"></div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  
  <h2>Top Critical Files</h2>`;

  // Add top 20 files with the most 'any' types
  const topFiles = [...report.files]
    .sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by any count
      return b.anyCount - a.anyCount;
    })
    .slice(0, 20);

  for (const file of topFiles) {
    // Read file content to create code snippets
    const fileContent = fs.existsSync(file.path) ? fs.readFileSync(file.path, 'utf8') : '';
    const lines = fileContent.split('\n');
    
    html += `
  <div class="file-card">
    <div class="file-header">
      <div class="file-path">${file.path.replace(/\\/g, '/')}</div>
      <div>
        <span class="badge badge-${file.priority}">${file.priority}</span>
        <span class="badge badge-${file.status === 'completed' ? 'completed' : file.status === 'in-progress' ? 'progress' : 'pending'}">${file.status}</span>
      </div>
    </div>
    <div>
      <strong>'Any' Types:</strong> ${file.anyCount} | 
      <strong>JS Imports:</strong> ${file.jsImports}
    </div>
    
    <div class="tabs">
      <div class="tab active" onclick="showTab(this, 'any-${encodeURIComponent(file.path)}')">Any Types</div>
      <div class="tab" onclick="showTab(this, 'js-${encodeURIComponent(file.path)}')">JS Imports</div>
    </div>
    
    <div id="any-${encodeURIComponent(file.path)}" class="tab-content active">`;
    
    if (file.anyLocations.length > 0) {
      for (const loc of file.anyLocations) {
        // Get the relevant code lines for context (3 lines before and after)
        const startLine = Math.max(0, loc.line - 4);
        const endLine = Math.min(lines.length - 1, loc.line + 2);
        
        html += `<div class="code-block">`;
        
        for (let i = startLine; i <= endLine; i++) {
          const lineContent = lines[i] || '';
          let highlightedLine = lineContent;
          
          // Highlight 'any' if this is the line with 'any'
          if (i === loc.line - 1) {
            // Escape HTML entities
            const escaped = lineContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            
            // Highlight the 'any' keyword
            highlightedLine = escaped.replace(/\bany\b/g, '<span class="highlight-any">any</span>');
          } else {
            // Just escape HTML
            highlightedLine = lineContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }
          
          html += `<div><span class="line-number">${i + 1}</span><span class="line-content">${highlightedLine}</span></div>`;
        }
        
        html += `</div>`;
      }
    } else {
      html += `<p>No 'any' types found in this file.</p>`;
    }
    
    html += `</div>
    
    <div id="js-${encodeURIComponent(file.path)}" class="tab-content">`;
    
    if (file.jsImportLocations.length > 0) {
      for (const loc of file.jsImportLocations) {
        // Get the relevant code lines for context (3 lines before and after)
        const startLine = Math.max(0, loc.line - 4);
        const endLine = Math.min(lines.length - 1, loc.line + 2);
        
        html += `<div class="code-block">`;
        
        for (let i = startLine; i <= endLine; i++) {
          const lineContent = lines[i] || '';
          let highlightedLine = lineContent;
          
          // Highlight JS import if this is the line with a JS import
          if (i === loc.line - 1) {
            // Escape HTML entities
            const escaped = lineContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            
            // Highlight the JS import
            if (loc.text) {
              highlightedLine = escaped.replace(
                new RegExp(loc.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), 
                `<span class="highlight-js">${loc.text}</span>`
              );
            }
          } else {
            // Just escape HTML
            highlightedLine = lineContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }
          
          html += `<div><span class="line-number">${i + 1}</span><span class="line-content">${highlightedLine}</span></div>`;
        }
        
        html += `</div>`;
      }
    } else {
      html += `<p>No JS imports found in this file.</p>`;
    }
    
    html += `</div>
  </div>`;
  }

  html += `
  <script>
    function showTab(tabElement, contentId) {
      // Get all tabs in the same group
      const tabContainer = tabElement.parentElement;
      const tabs = tabContainer.querySelectorAll('.tab');
      const tabContents = tabContainer.parentElement.querySelectorAll('.tab-content');
      
      // Remove 'active' class from all tabs and contents
      tabs.forEach(tab => tab.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add 'active' class to the clicked tab and its content
      tabElement.classList.add('active');
      document.getElementById(contentId).classList.add('active');
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(htmlOutputPath, html);
  console.log(`HTML report generated at ${htmlOutputPath}`);
  return;
}

/**
 * Analizza un file per trovare i tipi 'any' che possono essere sostituiti con tipi più specifici
 */
async function analyzeAndSuggestReplacements(filePath: string): Promise<{ line: number; suggestion: string; context: string }[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  const suggestions: { line: number; suggestion: string; context: string }[] = [];

  // Crea un programma TypeScript per analizzare il file
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
  });

  const sourceFile = program.getSourceFile(filePath);
  const typeChecker = program.getTypeChecker();

  if (!sourceFile) {
    return [];
  }

  // Funzione ricorsiva per visitare tutti i nodi dell'AST
  function visit(node: ts.Node) {
    // Cerca le dichiarazioni di variabili con tipo 'any'
    if (ts.isVariableDeclaration(node) && node.type && ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any' && node.initializer) {
      
      const lineNum = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const lineText = lines[lineNum - 1];
      
      // Analizza il valore iniziale per suggerire un tipo migliore
      let suggestedType = 'unknown';
      
      if (ts.isStringLiteral(node.initializer)) {
        suggestedType = 'string';
      } else if (ts.isNumericLiteral(node.initializer)) {
        suggestedType = 'number';
      } else if (node.initializer.kind === ts.SyntaxKind.TrueKeyword || 
                 node.initializer.kind === ts.SyntaxKind.FalseKeyword) {
        suggestedType = 'boolean';
      } else if (ts.isArrayLiteralExpression(node.initializer)) {
        // Cerca di dedurre il tipo degli elementi dell'array
        if (node.initializer.elements.length > 0) {
          const firstElement = node.initializer.elements[0];
          if (ts.isStringLiteral(firstElement)) {
            suggestedType = 'string[]';
          } else if (ts.isNumericLiteral(firstElement)) {
            suggestedType = 'number[]';
          } else if (firstElement.kind === ts.SyntaxKind.TrueKeyword || 
                     firstElement.kind === ts.SyntaxKind.FalseKeyword) {
            suggestedType = 'boolean[]';
          } else if (ts.isObjectLiteralExpression(firstElement)) {
            suggestedType = 'Record<string, unknown>[]';
          } else {
            suggestedType = 'unknown[]';
          }
        } else {
          suggestedType = 'unknown[]';
        }
      } else if (ts.isObjectLiteralExpression(node.initializer)) {
        suggestedType = 'Record<string, unknown>';
      }
      
      suggestions.push({
        line: lineNum,
        suggestion: suggestedType,
        context: lineText.trim(),
      });
    }
    
    // Cerca i parametri di funzione con tipo 'any'
    if (ts.isParameter(node) && node.type && ts.isTypeReferenceNode(node.type) && 
        node.type.typeName.getText() === 'any') {
      const lineNum = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const lineText = lines[lineNum - 1];
      
      suggestions.push({
        line: lineNum,
        suggestion: 'unknown',
        context: lineText.trim(),
      });
    }
    
    // Cerca i return type di funzioni con 'any'
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) && 
        node.type && ts.isTypeReferenceNode(node.type) && node.type.typeName.getText() === 'any') {
      const lineNum = sourceFile.getLineAndCharacterOfPosition(node.type.getStart()).line + 1;
      const lineText = lines[lineNum - 1];
      
      suggestions.push({
        line: lineNum,
        suggestion: 'unknown',
        context: lineText.trim(),
      });
    }
    
    // Visita ricorsivamente i nodi figli
    ts.forEachChild(node, visit);
  }
  
  // Avvia l'analisi
  if (sourceFile) {
    visit(sourceFile);
  }
  
  return suggestions;
}

/**
 * Analizza tutti i file e genera suggerimenti per la sostituzione dei tipi 'any'
 */
async function generateReplacementSuggestions(): Promise<void> {
  const report = await generateReport();
  const allSuggestions: { file: string; suggestions: { line: number; suggestion: string; context: string }[] }[] = [];
  
  // Filtra i file che contengono 'any' e hanno priorità alta o media
  const filesToAnalyze = report.files.filter(file => 
    file.anyCount > 0 && (file.priority === 'high' || file.priority === 'medium')
  );
  
  console.log(`\nAnalyzing ${filesToAnalyze.length} high/medium priority files for possible 'any' replacements...`);
  
  for (const file of filesToAnalyze) {
    const suggestions = await analyzeAndSuggestReplacements(file.path);
    if (suggestions.length > 0) {
      allSuggestions.push({
        file: file.path,
        suggestions,
      });
    }
  }
  
  // Genera un report HTML con i suggerimenti
  const htmlOutputPath = path.resolve(__dirname, '../refactor-suggestions.html');
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Type Safety Replacement Suggestions</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { 
      color: #2c3e50;
    }
    .file-section {
      margin-bottom: 30px;
      background-color: #fff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .file-path {
      font-weight: bold;
      font-family: monospace;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .suggestion {
      background-color: #f8f9fa;
      border-radius: 4px;
      padding: 12px;
      margin: 10px 0;
      border-left: 4px solid #3498db;
    }
    .line-number {
      font-weight: bold;
      color: #3498db;
    }
    .context {
      font-family: monospace;
      background-color: #f0f0f0;
      padding: 6px;
      border-radius: 3px;
      margin: 8px 0;
      white-space: pre;
    }
    .replace-suggestion {
      font-family: monospace;
      margin-top: 8px;
    }
    .highlight {
      color: #e74c3c;
      font-weight: bold;
    }
    .new-type {
      color: #27ae60;
      font-weight: bold;
    }
    .summary {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>Type Safety Replacement Suggestions</h1>
  
  <div class="summary">
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>Found <strong>${allSuggestions.reduce((total, file) => total + file.suggestions.length, 0)}</strong> potential replacements in <strong>${allSuggestions.length}</strong> files.</p>
  </div>`;
  
  for (const fileData of allSuggestions) {
    html += `
  <div class="file-section">
    <div class="file-path">${fileData.file.replace(/\\/g, '/')}</div>
    <p>Found ${fileData.suggestions.length} potential replacements:</p>`;
    
    for (const suggestion of fileData.suggestions) {
      // Replace 'any' with the suggestion in the context
      const highlightedContext = suggestion.context.replace(/\bany\b/, `<span class="highlight">any</span>`);
      const replacedContext = suggestion.context.replace(/\bany\b/, `<span class="new-type">${suggestion.suggestion}</span>`);
      
      html += `
    <div class="suggestion">
      <div class="line-number">Line ${suggestion.line}:</div>
      <div class="context">${highlightedContext}</div>
      <div class="replace-suggestion">Suggested replacement: ${replacedContext}</div>
    </div>`;
    }
    
    html += `
  </div>`;
  }
  
  html += `
</body>
</html>`;
  
  fs.writeFileSync(htmlOutputPath, html);
  console.log(`\nReplacement suggestions report generated at ${htmlOutputPath}`);
  
  // Stampa un riassunto sulla console
  console.log('\nTop files with replacement suggestions:');
  allSuggestions
    .sort((a, b) => b.suggestions.length - a.suggestions.length)
    .slice(0, 10)
    .forEach(fileData => {
      console.log(`${fileData.file}: ${fileData.suggestions.length} potential replacements`);
    });
}

/**
 * Esegue lo script in base ai parametri
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--report-any')) {
    const report = await generateReport();
    printMarkdownReport(report);
    await updateTrendFile(report.totalAnyCount);
  }
  
  if (args.includes('--detailed-report')) {
    const report = await generateDetailedReport();
    printDetailedReport(report);
    fs.writeFileSync(DETAILED_REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to ${DETAILED_REPORT_FILE}`);
  }
  
  if (args.includes('--html-report')) {
    const report = await generateDetailedReport();
    await generateHtmlReport(report);
  }
  
  if (args.includes('--find-js-imports')) {
    const jsImports = await findAllJsImports();
    console.log('JS Imports found:');
    for (const [file, info] of jsImports.entries()) {
      console.log(`${file}: ${info.count}`);
      for (const loc of info.locations) {
        console.log(`  Line ${loc.line}: ${loc.context}`);
      }
    }
  }
  
  if (args.includes('--generate-map')) {
    const report = await generateReport();
    fs.writeFileSync(REPORT_FILE, yaml.dump(report));
    console.log(`Report generated and saved to ${REPORT_FILE}`);
  }
  
  if (args.includes('--generate-trend')) {
    const report = await generateReport();
    await updateTrendFile(report.totalAnyCount);
    console.log(`Trend file updated and saved to ${TREND_FILE}`);
  }
  
  if (args.includes('--priority-report')) {
    const report = await generateReport();
    console.log(`\n# Priority Report\n`);
    console.log(`High priority files: ${report.files.filter(f => f.priority === 'high').length}`);
    console.log(`Medium priority files: ${report.files.filter(f => f.priority === 'medium').length}`);
    console.log(`Low priority files: ${report.files.filter(f => f.priority === 'low').length}`);
    
    if (report.files.filter(f => f.priority === 'high').length > 0) {
      console.log(`\n## Top High Priority Files\n`);
      report.files.filter(f => f.priority === 'high')
        .slice(0, 10)
        .forEach(f => console.log(`- ${f.path} (${f.anyCount} any, ${f.jsImports} js)`));
    }
  }
  
  if (args.includes('--auto-fix')) {
    console.log(`Auto-fix is not implemented yet. This will eventually automatically fix simple 'any' cases.`);
  }
  
  if (args.includes('--suggest-replacements')) {
    await generateReplacementSuggestions();
  }
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Jarvis Refactor Tool - Type Safety Improvement

Usage:
  npx ts-node tools/jarvis-refactor.ts [options]

Options:
  --report-any           Generate a markdown report of 'any' types
  --detailed-report      Generate a detailed report with exact locations
  --html-report          Generate an HTML report with code snippets and highlighting
  --suggest-replacements Analyze and suggest replacements for 'any' types
  --find-js-imports      Find all JavaScript imports in TypeScript files
  --generate-map         Generate the refactor-map.yaml file
  --generate-trend       Update the trend file with current 'any' count
  --priority-report      Generate a report of files by priority
  --auto-fix             Attempt to automatically fix simple 'any' cases
  --help                 Show this help message
    `);
  }

  runAudit();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 