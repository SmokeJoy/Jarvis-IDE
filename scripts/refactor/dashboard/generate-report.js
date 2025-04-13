#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configurazione
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const DATE_NOW = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const REPORT_FILE = path.join(REPORTS_DIR, `refactor-report-${DATE_NOW}.json`);
const CSV_FILE = path.join(REPORTS_DIR, `refactor-report-${DATE_NOW}.csv`);

// Crea la directory dei report se non esiste
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  console.log(chalk.blue(`Directory dei report creata: ${REPORTS_DIR}`));
}

// Carica i log dei refactoring tools
function loadRefactoringData() {
  // Simula i dati del refactoring - in produzione questi dati verrebbero
  // caricati dai file di log generati dagli strumenti di refactoring
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      totalFixes: 0,
      totalErrors: 0,
      nestedCalls: 0,
      missingImports: 0,
      malformedCalls: 0
    },
    fixes: [],
    errors: []
  };
}

// Calcola le statistiche da inserire nel report
function calculateStats(data) {
  // Raggruppa i fix per categoria
  const fixesByCategory = data.fixes.reduce((acc, fix) => {
    acc[fix.type] = (acc[fix.type] || 0) + 1;
    return acc;
  }, {});
  
  // Raggruppa gli errori per tipo
  const errorsByType = data.errors.reduce((acc, error) => {
    acc[error.reason] = (acc[error.reason] || 0) + 1;
    return acc;
  }, {});
  
  // Raggruppa i fix per file
  const fileStats = data.fixes.reduce((acc, fix) => {
    if (!acc[fix.file]) {
      acc[fix.file] = { fixes: 0, types: {} };
    }
    acc[fix.file].fixes++;
    acc[fix.file].types[fix.type] = (acc[fix.file].types[fix.type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    fixesByCategory,
    errorsByType,
    fileStats,
    mostFixedFiles: Object.entries(fileStats)
      .sort((a, b) => b[1].fixes - a[1].fixes)
      .slice(0, 10)
      .map(([file, stats]) => ({ file, fixes: stats.fixes }))
  };
}

// Genera il report JSON
function generateJsonReport(data, stats) {
  const report = {
    timestamp: data.timestamp,
    summary: {
      ...data.summary,
      duration: "N/A", // Da misurare durante l'esecuzione reale
      mostFixedFiles: stats.mostFixedFiles
    },
    statistics: {
      fixesByCategory: stats.fixesByCategory,
      errorsByType: stats.errorsByType
    },
    fixes: data.fixes,
    errors: data.errors
  };
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(chalk.green(`Report JSON generato: ${REPORT_FILE}`));
  
  return report;
}

// Genera il report CSV
function generateCsvReport(data, stats) {
  // Intestazione CSV
  const headers = ['File', 'Fix Type', 'Line', 'Original Code', 'Fixed Code'];
  
  // Righe CSV
  const rows = data.fixes.map(fix => [
    fix.file,
    fix.type,
    fix.line,
    JSON.stringify(fix.originalCode).replace(/"/g, '""'),
    JSON.stringify(fix.fixedCode).replace(/"/g, '""')
  ]);
  
  // Compila il CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  fs.writeFileSync(CSV_FILE, csvContent);
  console.log(chalk.green(`Report CSV generato: ${CSV_FILE}`));
}

// Genera il report di refactoring
function generateReport() {
  console.log(chalk.blue('Generazione report di refactoring in corso...'));
  
  try {
    // Carica i dati del refactoring
    const data = loadRefactoringData();
    
    // Calcola le statistiche
    const stats = calculateStats(data);
    
    // Genera il report JSON
    const report = generateJsonReport(data, stats);
    
    // Genera il report CSV
    generateCsvReport(data, stats);
    
    console.log(chalk.green('\nGenerazione report completata con successo!'));
    console.log(chalk.white(`Totale file elaborati: ${data.summary.totalFiles}`));
    console.log(chalk.white(`Totale correzioni: ${data.summary.totalFixes}`));
    
    if (data.summary.totalErrors > 0) {
      console.log(chalk.yellow(`Errori: ${data.summary.totalErrors}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Errore durante la generazione del report:'), error);
    process.exit(1);
  }
}

// Esegui la generazione del report
generateReport(); 