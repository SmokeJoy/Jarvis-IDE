#!/usr/bin/env ts-node

import { Project, SyntaxKind, CallExpression, SourceFile } from 'ts-morph';
import fg from 'fast-glob';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { safeGetExpression, safeGetText } from './utils.js';

// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json');
const SHARED_TYPES_PATH = path.join(ROOT_DIR, 'src/shared/types');

// Modalità dry run (controlla senza applicare modifiche)
const isDryRun = process.argv.includes('--check');
const targetDir = process.argv[2] || '';

console.log(`Project root: ${ROOT_DIR}`);
console.log(`Using tsconfig: ${TSCONFIG_PATH}`);
console.log(`Shared types path: ${SHARED_TYPES_PATH}`);
console.log(`Target directory: ${targetDir || 'all'}`);
console.log(`Mode: ${isDryRun ? 'check only' : 'fix'}`);

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

let fixedCount = 0;
let errorsCount = 0;
const errorFiles: string[] = [];

// Aggiungi l'import mancante
function addMissingImport(sourceFile: SourceFile, filePath: string, dryRun: boolean): boolean {
  try {
    // Verifica se il file usa createSafeMessage
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const hasCreateSafeMessageCall = callExpressions.some(call => {
      if (call.wasForgotten()) return false;
      try {
        const expr = safeGetExpression(call);
        return expr && safeGetText(expr) === 'createSafeMessage';
      } catch (error) {
        console.error(`Errore nell'analizzare una chiamata in ${filePath}:`, error);
        return false;
      }
    });
    
    if (!hasCreateSafeMessageCall) return false;
    
    // Verifica se l'import è già presente
    const hasImport = sourceFile.getImportDeclarations().some(importDecl => {
      return importDecl.getNamedImports().some(
        namedImport => namedImport.getName() === 'createSafeMessage'
      );
    });
    
    if (hasImport) return false;
    
    // Calcola il percorso relativo per l'import
    const fileDirname = path.dirname(filePath);
    const absoluteSharedTypesPath = path.join(ROOT_DIR, 'src', 'shared', 'types');
    const relativePath = path.relative(fileDirname, absoluteSharedTypesPath).replace(/\\/g, '/');
    const moduleSpecifier = (relativePath.startsWith('.') ? relativePath : `./${relativePath}`) + '/message.js';
    
    if (dryRun) {
      console.log(chalk.yellow(`\nMissing import in ${filePath}:`));
      console.log(chalk.green(`  Would add: import { createSafeMessage } from "${moduleSpecifier}";`));
      return true;
    }
    
    // Aggiungi l'import
    try {
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [{ name: 'createSafeMessage' }]
      });
      
      sourceFile.saveSync();
      console.log(chalk.green(`✅ Added import to ${filePath}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`⚠️ Errore nell'aggiungere l'import a ${filePath}:`), error);
      throw error;
    }
  } catch (error: unknown) {
    console.error(chalk.red(`⚠️ Errore nell'elaborare ${filePath}:`), error instanceof Error ? error.message : error);
    errorFiles.push(filePath);
    errorsCount++;
    return false;
  }
}

// Elabora tutti i file
for (const filePath of filesToCheck) {
  try {
    const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
    if (addMissingImport(sourceFile, filePath, isDryRun)) {
      fixedCount++;
    }
  } catch (error: unknown) {
    console.error(chalk.red(`⚠️ Errore nell'elaborare ${filePath}:`), error instanceof Error ? error.message : error);
    errorFiles.push(filePath);
    errorsCount++;
  }
}

// Stampa risultato finale
if (isDryRun) {
  console.log(chalk.cyanBright(`\n🔍 Check completato. Trovati ${fixedCount} file senza import.\n`));
  
  if (fixedCount > 0) {
    console.log(chalk.yellow(`Per aggiungere gli import mancanti, esegui senza --check`));
  } else {
    console.log(chalk.green(`✅ Tutti i file hanno l'import corretto!\n`));
  }
} else {
  console.log(chalk.cyanBright(`\n🏁 Correzione completata. Aggiunti ${fixedCount} import mancanti.\n`));
  
  if (errorsCount > 0) {
    console.log(chalk.red(`⚠️ ${errorsCount} file hanno generato errori durante il processo`));
    console.log(chalk.red(`I primi 5 file con errori:`));
    errorFiles.slice(0, 5).forEach(file => {
      console.log(chalk.red(`  - ${file}`));
    });
  }
} 