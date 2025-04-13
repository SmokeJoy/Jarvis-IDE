#!/usr/bin/env ts-node

import { Project, SyntaxKind, CallExpression, SourceFile, Node } from 'ts-morph';
import fg from 'fast-glob';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json');
const targetDir = process.argv[2] || '';

console.log(`Project root: ${ROOT_DIR}`);
console.log(`Using tsconfig: ${TSCONFIG_PATH}`);
console.log(`Target directory: ${targetDir || 'all'}`);

// Verifica il tsconfig
if (!fs.existsSync(TSCONFIG_PATH)) {
  console.error(chalk.red(`tsconfig.json non trovato in ${TSCONFIG_PATH}`));
  process.exit(1);
}

// Setup progetto
const project = new Project({
  tsConfigFilePath: TSCONFIG_PATH,
});

// Pattern glob per la ricerca
const pattern = targetDir 
  ? [`${targetDir}/**/*.ts`, `${targetDir}/**/*.tsx`]
  : ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'];

// Trova i file
const filesToCheck = fg.sync(pattern, {
  ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
  cwd: ROOT_DIR,
});

console.log(`Trovati ${filesToCheck.length} file da analizzare\n`);

// Statistiche
let totalCalls = 0;
let suspiciousCalls = 0;
let importsCount = 0;
let filesWithCalls = 0;
let filesWithoutImport = 0;

interface CallInfo {
  file: string;
  code: string;
  reason: string;
  line: number;
  suggestion?: string;
}

const suspiciousCallsList: CallInfo[] = [];
const missingImportFiles: string[] = [];

// Verifica la correttezza delle chiamate a createSafeMessage
function analyzeCreateSafeMessageCalls(sourceFile: SourceFile, filePath: string): void {
  // 1. Conta le chiamate a createSafeMessage
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const createSafeMsgCalls = callExpressions.filter(call => {
    if (call.wasForgotten()) return false;
    const expr = call.getExpression();
    return expr && expr.getText() === 'createSafeMessage';
  });
  
  if (createSafeMsgCalls.length === 0) return;
  
  filesWithCalls++;
  totalCalls += createSafeMsgCalls.length;
  
  // 2. Verifica se l'import è presente
  const hasImport = sourceFile.getImportDeclarations().some(importDecl => {
    return importDecl.getNamedImports().some(
      namedImport => namedImport.getName() === 'createSafeMessage'
    );
  });
  
  if (!hasImport) {
    filesWithoutImport++;
    missingImportFiles.push(filePath);
  } else {
    importsCount++;
  }
  
  // 3. Analizza le chiamate per problemi
  for (const call of createSafeMsgCalls) {
    if (call.wasForgotten()) continue;
    
    const linePos = sourceFile.getLineAndColumnAtPos(call.getStart());
    const lineNumber = linePos.line;
    
    // Verifica se ci sono argomenti
    const args = call.getArguments();
    if (args.length === 0) {
      suspiciousCalls++;
      suspiciousCallsList.push({
        file: filePath,
        code: call.getText(),
        reason: "Nessun argomento fornito",
        line: lineNumber,
        suggestion: "createSafeMessage({role: 'unknown', content: ''})"
      });
      continue;
    }
    
    // Verifica la struttura dell'argomento
    const firstArg = args[0];
    if (firstArg.wasForgotten()) continue;
    
    // Se è una chiamata annidata a createSafeMessage
    if (firstArg.getKind() === SyntaxKind.CallExpression) {
      const nestedCall = firstArg as CallExpression;
      if (nestedCall.wasForgotten()) continue;
      
      try {
        const nestedExpr = nestedCall.getExpression();
        if (nestedExpr && nestedExpr.getText() === 'createSafeMessage') {
          suspiciousCalls++;
          let suggestion = '';
          
          // Recupera l'argomento interno in modo sicuro
          if (nestedCall.getArguments().length > 0 && !nestedCall.getArguments()[0].wasForgotten()) {
            suggestion = `createSafeMessage(${nestedCall.getArguments()[0].getText()})`;
          }
          
          suspiciousCallsList.push({
            file: filePath,
            code: call.getText(),
            reason: "Chiamata annidata",
            line: lineNumber,
            suggestion
          });
        }
      } catch (error) {
        console.error(`Errore nell'analizzare chiamata annidata in ${filePath}:`, error);
      }
      continue;
    }
    
    // Se non è un oggetto
    if (firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      suspiciousCalls++;
      suspiciousCallsList.push({
        file: filePath,
        code: call.getText(),
        reason: "Argomento non è un oggetto",
        line: lineNumber
      });
      continue;
    }
    
    // Verifica le proprietà dell'oggetto in modo sicuro
    try {
      const objText = firstArg.getText();
      if (!objText.includes('role:') || !objText.includes('content:')) {
        suspiciousCalls++;
        suspiciousCallsList.push({
          file: filePath, 
          code: call.getText(),
          reason: "Mancano role o content",
          line: lineNumber
        });
      }
    } catch (error) {
      console.error(`Errore nell'analizzare le proprietà dell'oggetto in ${filePath}:`, error);
    }
  }
}

// Elabora tutti i file
for (const filePath of filesToCheck) {
  try {
    const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
    analyzeCreateSafeMessageCalls(sourceFile, filePath);
  } catch (error) {
    console.error(chalk.red(`Errore nell'analizzare ${filePath}:`), error);
  }
}

// Stampa report
console.log(chalk.cyanBright(`\n📊 REPORT CREATESSAFEMESSAGE`));
console.log(chalk.white(`=========================\n`));

console.log(chalk.white(`Totale chiamate: ${totalCalls} in ${filesWithCalls} file`));
console.log(chalk.white(`File con import: ${importsCount}`));
console.log(chalk.white(`File senza import: ${filesWithoutImport}`));
console.log(chalk.white(`Chiamate sospette: ${suspiciousCalls}`));

if (suspiciousCalls > 0) {
  console.log(chalk.yellow(`\n⚠️ CHIAMATE SOSPETTE PER TIPO:`));
  
  // Raggruppa per tipo di problema
  const problemsByType: Record<string, number> = {};
  suspiciousCallsList.forEach(call => {
    problemsByType[call.reason] = (problemsByType[call.reason] || 0) + 1;
  });
  
  // Mostra i problemi raggruppati
  Object.entries(problemsByType).forEach(([reason, count]) => {
    console.log(chalk.yellow(`  - ${reason}: ${count}`));
  });
  
  // Mostra le prime 10 chiamate problematiche come esempio
  console.log(chalk.yellow(`\n⚠️ ESEMPI DI CHIAMATE PROBLEMATICHE:`));
  const examples = suspiciousCallsList.slice(0, 10);
  examples.forEach((call, index) => {
    console.log(chalk.white(`\nEsempio #${index + 1} - ${call.reason}`));
    console.log(chalk.white(`File: ${call.file}:${call.line}`));
    console.log(chalk.red(`Codice: ${call.code}`));
    if (call.suggestion) {
      console.log(chalk.green(`Suggerimento: ${call.suggestion}`));
    }
  });
}

if (filesWithoutImport > 0) {
  console.log(chalk.yellow(`\n⚠️ FILE SENZA IMPORT CREATESSAFEMESSAGE:`));
  missingImportFiles.slice(0, 10).forEach(file => {
    console.log(chalk.white(`  - ${file}`));
  });
  if (missingImportFiles.length > 10) {
    console.log(chalk.white(`  - ...e altri ${missingImportFiles.length - 10} file`));
  }
}

console.log(chalk.cyanBright(`\n✅ PROSSIMI PASSI:`));
console.log(chalk.white(`1. Esegui fix-nested-safe-message.ts per risolvere le chiamate annidate`));
console.log(chalk.white(`2. Aggiungi gli import mancanti`));
console.log(chalk.white(`3. Controlla e correggi le chiamate sospette`)); 