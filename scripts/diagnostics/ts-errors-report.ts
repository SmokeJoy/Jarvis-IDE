/**
 * @file ts-errors-report.ts
 * @description Genera un report JSON degli errori TypeScript nel progetto
 */

import ts from 'typescript';
import fs from 'fs';
import path from 'path';

// Configurazione
const CONFIG_PATH = 'tsconfig.bonifica.json';
const OUTPUT_DIR = '.cache';
const OUTPUT_FILE = 'ts-errors.json';

interface DiagnosticOutput {
  file: string | undefined;
  code: number;
  message: string;
  line: number | null;
  column: number | null;
  category: string;
  severity: 'error' | 'warning' | 'suggestion' | 'message';
}

function createDiagnosticReport(): DiagnosticOutput[] {
  // Carica e valida il file tsconfig
  const configPath = ts.findConfigFile(
    process.cwd(),
    ts.sys.fileExists,
    CONFIG_PATH
  );

  if (!configPath) {
    throw new Error(`❌ File di configurazione non trovato: ${CONFIG_PATH}`);
  }

  // Legge la configurazione
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) {
    throw new Error(`❌ Errore lettura tsconfig: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
  }

  // Parsing della configurazione
  const parsed = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(configPath)
  );

  if (parsed.errors.length) {
    throw new Error(`❌ Errore parsing tsconfig: ${ts.flattenDiagnosticMessageText(parsed.errors[0].messageText, '\n')}`);
  }

  // Crea il programma TypeScript
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  // Mappa i diagnostici nel formato di output
  return diagnostics.map(diagnostic => {
    const position = diagnostic.file && diagnostic.start ? 
      ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start) :
      null;

    return {
      file: diagnostic.file?.fileName,
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      line: position?.line ? position.line + 1 : null,
      column: position?.character ? position.character + 1 : null,
      category: ts.DiagnosticCategory[diagnostic.category],
      severity: getSeverity(diagnostic.category)
    };
  });
}

function getSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'suggestion' | 'message' {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return 'error';
    case ts.DiagnosticCategory.Warning:
      return 'warning';
    case ts.DiagnosticCategory.Suggestion:
      return 'suggestion';
    case ts.DiagnosticCategory.Message:
      return 'message';
  }
}

function saveReport(diagnostics: DiagnosticOutput[]): void {
  // Crea directory .cache se non esiste
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Salva il report
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(diagnostics, null, 2)
  );

  // Log statistiche
  const stats = {
    total: diagnostics.length,
    errors: diagnostics.filter(d => d.severity === 'error').length,
    warnings: diagnostics.filter(d => d.severity === 'warning').length,
    suggestions: diagnostics.filter(d => d.severity === 'suggestion').length
  };

  console.log('\n📊 Report TypeScript Diagnostici');
  console.log('------------------------------');
  console.log(`✅ Report salvato in: ${outputPath}`);
  console.log(`📝 Totale diagnostici: ${stats.total}`);
  console.log(`❌ Errori: ${stats.errors}`);
  console.log(`⚠️  Warning: ${stats.warnings}`);
  console.log(`💡 Suggerimenti: ${stats.suggestions}\n`);
}

// Esecuzione
try {
  const diagnostics = createDiagnosticReport();
  saveReport(diagnostics);
} catch (error) {
  console.error(`\n❌ Errore durante la generazione del report:`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} 
 