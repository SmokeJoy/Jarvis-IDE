/**
 * @file run-dashboard.ts
 * @description Script CLI per generare un dashboard di type safety per il progetto Jarvis
 * 
 * Uso:
 * npx ts-node --esm tools/run-dashboard.ts
 * 
 * @author TypescriptGPT & Team Jarvis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as util from 'util';
import { exec as execCallback } from 'child_process';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

// Promisify exec
const exec = util.promisify(execCallback);

// Get current file directory for ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const REPORT_FILE = path.resolve(process.cwd(), 'refactor-map.yaml');
const TREND_FILE = path.resolve(process.cwd(), 'refactor-trend.md');
const DETAILED_REPORT_FILE = path.resolve(process.cwd(), 'refactor-details.json');

interface Location {
  line: number;
  column: number;
  text: string;
  context?: string;
}

interface FileReport {
  path: string;
  filePath?: string;
  anyCount: number;
  jsImports: number;
  anyLocations?: Location[];
  jsImportLocations?: Location[];
  strategy?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
}

interface RefactorMap {
  lastUpdated: string;
  totalAnyCount: number;
  totalJsImports: number;
  files: FileReport[];
}

interface DetailedRefactorMap extends RefactorMap {
  filesWithDetails: (FileReport & { anyLocations: Location[], jsImportLocations: Location[] })[];
}

// Statistiche per il dashboard
interface RefactorStats {
  totalFiles: number;
  filesWithAny: number;
  filesWithJsImports: number;
  totalAnyCount: number;
  totalJsImports: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  mostCriticalFiles: FileReport[];
  trend: { date: string; anyCount: number }[];
}

/**
 * Carica il report dettagliato
 */
async function loadDetailedReport(): Promise<DetailedRefactorMap | null> {
  try {
    if (fs.existsSync(DETAILED_REPORT_FILE)) {
      const content = fs.readFileSync(DETAILED_REPORT_FILE, 'utf-8');
      return JSON.parse(content);
    }
    
    // Se il file non esiste, esegui il comando per generarlo
    await exec('npx ts-node --esm tools/jarvis-refactor.ts --detailed-report');
    
    if (fs.existsSync(DETAILED_REPORT_FILE)) {
      const content = fs.readFileSync(DETAILED_REPORT_FILE, 'utf-8');
      return JSON.parse(content);
    }
    
    return null;
  } catch (error) {
    console.error('Errore nel caricamento del report dettagliato:', error);
    return null;
  }
}

/**
 * Carica il file di trend
 */
function loadTrendFile(): { date: string; anyCount: number }[] {
  try {
    if (fs.existsSync(TREND_FILE)) {
      const content = fs.readFileSync(TREND_FILE, 'utf-8');
      const lines = content.split('\n').filter(line => line.includes(':'));
      
      return lines.map(line => {
        const [date, countStr] = line.split(':');
        const anyCount = parseInt(countStr.replace(' any types', '').trim(), 10);
        return { date: date.trim(), anyCount };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Errore nel caricamento del trend file:', error);
    return [];
  }
}

/**
 * Calcola le statistiche per il dashboard
 */
function calculateStats(report: DetailedRefactorMap): RefactorStats {
  const filesWithAny = report.files.filter(f => f.anyCount > 0).length;
  const filesWithJsImports = report.files.filter(f => f.jsImports > 0).length;
  
  const highPriorityCount = report.files.filter(f => f.priority === 'high').length;
  const mediumPriorityCount = report.files.filter(f => f.priority === 'medium').length;
  const lowPriorityCount = report.files.filter(f => f.priority === 'low').length;
  
  const pendingCount = report.files.filter(f => f.status === 'pending').length;
  const inProgressCount = report.files.filter(f => f.status === 'in-progress').length;
  const completedCount = report.files.filter(f => f.status === 'completed').length;
  
  // Ordina i file per criticità (priorità e numero di 'any')
  const sortedFiles = [...report.files].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return b.anyCount - a.anyCount;
  });
  
  const mostCriticalFiles = sortedFiles.slice(0, 5);
  const trend = loadTrendFile();
  
  return {
    totalFiles: report.files.length,
    filesWithAny,
    filesWithJsImports,
    totalAnyCount: report.totalAnyCount,
    totalJsImports: report.totalJsImports,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    pendingCount,
    inProgressCount,
    completedCount,
    mostCriticalFiles,
    trend
  };
}

/**
 * Genera un grafico ASCII semplice per il trend
 */
function generateTrendChart(trend: { date: string; anyCount: number }[]): string {
  if (trend.length < 2) {
    return 'Dati di trend insufficienti per generare un grafico.';
  }
  
  const width = 50; // Larghezza del grafico
  const height = 10; // Altezza del grafico
  
  const values = trend.map(t => t.anyCount);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const normalized = values.map(val => Math.floor((val - min) / range * (height - 1)));
  const dates = trend.map(t => t.date);
  
  let chart = '';
  
  // Asse Y con i valori
  for (let y = height - 1; y >= 0; y--) {
    const value = Math.round(min + (y / (height - 1)) * range);
    chart += value.toString().padStart(6) + ' | ';
    
    for (let x = 0; x < normalized.length; x++) {
      chart += normalized[x] >= y ? '█' : ' ';
    }
    
    chart += '\n';
  }
  
  // Asse X
  chart += '       +-' + '-'.repeat(normalized.length) + '\n';
  
  // Date sull'asse X
  const dateLabels = dates.map(d => d.substring(5)); // Mostra solo mese-giorno
  chart += '         ' + dateLabels.join(' ');
  
  return chart;
}

/**
 * Visualizza il dashboard
 */
function displayDashboard(stats: RefactorStats) {
  console.log(chalk.bold.blue('\n=== JARVIS TYPE SAFETY DASHBOARD ==='));
  console.log(chalk.gray(`Last updated on: ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}\n`));
  
  // Statistiche generali
  console.log(chalk.bold('GENERAL STATISTICS:'));
  console.log(`${stats.totalFiles} files analyzed, ${stats.filesWithAny} files with 'any' types (${(stats.filesWithAny / stats.totalFiles * 100).toFixed(1)}%), ${stats.filesWithJsImports} files with '.js' imports (${(stats.filesWithJsImports / stats.totalFiles * 100).toFixed(1)}%)`);
  console.log(`Total 'any' types found: ${chalk.yellow(stats.totalAnyCount)}`);
  console.log(`Total '.js' imports found: ${chalk.red(stats.totalJsImports)}\n`);
  
  // Progresso
  console.log(chalk.bold('PROGRESS:'));
  console.log(`${stats.completedCount} completed (${(stats.completedCount / stats.totalFiles * 100).toFixed(1)}%), ${stats.inProgressCount} in progress (${(stats.inProgressCount / stats.totalFiles * 100).toFixed(1)}%), ${stats.pendingCount} pending (${(stats.pendingCount / stats.totalFiles * 100).toFixed(1)}%)`);
  
  // Visualizzazione grafica del progresso
  const total = stats.completedCount + stats.inProgressCount + stats.pendingCount;
  const completedRatio = Math.round(stats.completedCount / total * 40);
  const inProgressRatio = Math.round(stats.inProgressCount / total * 40);
  const pendingRatio = 40 - completedRatio - inProgressRatio;
  
  console.log('[' + 
    chalk.green('='.repeat(completedRatio)) + 
    chalk.yellow('='.repeat(inProgressRatio)) + 
    chalk.red('='.repeat(pendingRatio)) + 
    ']'
  );
  
  // Priorità
  console.log(chalk.bold('\nPRIORITY:'));
  console.log(`${stats.highPriorityCount} high priority files, ${stats.mediumPriorityCount} medium priority files, ${stats.lowPriorityCount} low priority files`);
  
  // File critici principali
  console.log(chalk.bold('\nTOP CRITICAL FILES:'));
  stats.mostCriticalFiles.forEach((file, i) => {
    const priorityColor = file.priority === 'high' ? chalk.red : file.priority === 'medium' ? chalk.yellow : chalk.green;
    console.log(`${i + 1}. ${chalk.cyan(file.path)} - ${chalk.yellow(file.anyCount)} 'any' types, ${chalk.red(file.jsImports)} JS imports, ${priorityColor(file.priority)} priority, ${file.status}`);
  });
  
  // Visualizza il trend chart
  console.log(chalk.bold('\nTREND:'));
  console.log(generateTrendChart(stats.trend));
  
  // Suggerimenti
  console.log(chalk.bold('\nSUGGESTIONS:'));
  if (stats.highPriorityCount > 0) {
    console.log(chalk.red('✖ There are still high priority files that need attention.'));
  } else if (stats.mediumPriorityCount > 0) {
    console.log(chalk.yellow('⚠ Focus on medium priority files next.'));
  } else {
    console.log(chalk.green('✓ Only low priority files remain.'));
  }
  
  // Comandi disponibili
  console.log(chalk.bold('\nAVAILABLE COMMANDS:'));
  console.log('- pnpm dashboard:trend      Generate/update trend file');
  console.log('- pnpm dashboard:detailed   Generate detailed report with locations');
  console.log('- pnpm dashboard:fix        Run automated fixes where possible');
  console.log('- pnpm dashboard:priority   List files by priority');
}

/**
 * Funzione principale
 */
async function main() {
  try {
    console.log(chalk.blue('Loading refactoring data...'));
    
    const report = await loadDetailedReport();
    if (!report) {
      console.error(chalk.red('Failed to load or generate the detailed report.'));
      return;
    }
    
    const stats = calculateStats(report);
    displayDashboard(stats);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Esegui il programma
main(); 