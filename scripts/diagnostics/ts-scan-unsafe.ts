/**
 * @file ts-scan-unsafe.ts
 * @description Scansiona il codice per identificare pattern potenzialmente non sicuri
 */

import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';

// Configurazione
const PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'webview-ui/src/**/*.ts',
  'webview-ui/src/**/*.tsx'
];

const KEYWORDS = {
  types: ['any', 'unknown', 'Function', 'object', '{}'],
  assertions: ['as any', 'as unknown', 'as const'],
  comments: ['TODO:', 'FIXME:', '@todo', '@fixme'],
  unsafe: ['eval(', 'new Function(', 'Object.create(null)']
};

interface UnsafePattern {
  line: number;
  column: number;
  pattern: string;
  category: keyof typeof KEYWORDS;
  context: string;
}

interface FileReport {
  path: string;
  patterns: UnsafePattern[];
}

function scanFile(filePath: string): FileReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const patterns: UnsafePattern[] = [];

  lines.forEach((line, lineIndex) => {
    // Scansiona ogni categoria di pattern
    Object.entries(KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        let columnIndex = line.indexOf(keyword);
        while (columnIndex !== -1) {
          patterns.push({
            line: lineIndex + 1,
            column: columnIndex + 1,
            pattern: keyword,
            category: category as keyof typeof KEYWORDS,
            context: line.trim()
          });
          columnIndex = line.indexOf(keyword, columnIndex + 1);
        }
      });
    });
  });

  return {
    path: filePath,
    patterns
  };
}

function generateReport(): FileReport[] {
  // Trova tutti i file che corrispondono ai pattern
  const files = glob.sync(PATTERNS, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });

  // Scansiona ogni file
  return files.map(file => scanFile(file))
    .filter(report => report.patterns.length > 0);
}

function saveReport(reports: FileReport[]): void {
  // Crea directory .cache se non esiste
  const outputDir = '.cache';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Salva il report
  const outputPath = path.join(outputDir, 'unsafe-patterns.json');
  fs.writeFileSync(outputPath, JSON.stringify(reports, null, 2));

  // Genera statistiche
  const stats = {
    totalFiles: reports.length,
    totalPatterns: reports.reduce((sum, report) => sum + report.patterns.length, 0),
    byCategory: {} as Record<keyof typeof KEYWORDS, number>
  };

  // Calcola statistiche per categoria
  Object.keys(KEYWORDS).forEach(category => {
    stats.byCategory[category as keyof typeof KEYWORDS] = reports.reduce(
      (sum, report) => sum + report.patterns.filter(p => p.category === category).length,
      0
    );
  });

  // Output del report
  console.log('\n🔍 Report Pattern Non Sicuri');
  console.log('-------------------------');
  console.log(`✅ Report salvato in: ${outputPath}`);
  console.log(`📁 File analizzati: ${reports.length}`);
  console.log(`⚠️  Pattern trovati: ${stats.totalPatterns}`);
  console.log('\nDettaglio per categoria:');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`- ${category}: ${count}`);
  });
  console.log('');
}

// Esecuzione
try {
  const reports = generateReport();
  saveReport(reports);
} catch (error) {
  console.error('\n❌ Errore durante la scansione:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} 
 