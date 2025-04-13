#!/usr/bin/env ts-node

import { Project, SyntaxKind, CallExpression, SourceFile, Node } from 'ts-morph';
import fg from 'fast-glob';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { 
  safeGetExpression, 
  safeGetText, 
  safeGetLineNumber, 
  safeIsKind 
} from './utils.js'; // Uso .js per import relativo tra moduli TS compilati

// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json');

// Modalità dry run (controlla senza applicare modifiche)
const isDryRun = process.argv.includes('--check');
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
const filesToTransform = fg.sync(pattern, {
  ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
  cwd: ROOT_DIR,
});

console.log(`Trovati ${filesToTransform.length} file da analizzare`);

let fixedCount = 0;
let affectedFileCount = 0;

// Cerca le chiamate annidate a createSafeMessage
function processSourceFile(sourceFile: SourceFile, filePath: string, dryRun: boolean): boolean {
  let modified = false;
  let transformCount = 0;

  try {
    // Trova tutte le chiamate a createSafeMessage
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    // Preparare gli aggiornamenti da applicare dopo l'analisi
    interface TransformOperation {
      node: CallExpression;
      replacement: string;
    }
    
    const transformOperations: TransformOperation[] = [];
    
    for (const callExpr of callExpressions) {
      if (callExpr.wasForgotten()) continue;
      
      // Verifica se è una chiamata a createSafeMessage
      try {
        const expr = safeGetExpression(callExpr);
        if (!expr || safeGetText(expr) !== 'createSafeMessage') continue;
        
        // Controlla gli argomenti
        const args = callExpr.getArguments();
        if (args.length !== 1) continue;
        
        const arg = args[0];
        if (arg.wasForgotten()) continue;
        
        // Se l'argomento stesso è una chiamata a createSafeMessage
        if (safeIsKind(arg, SyntaxKind.CallExpression)) {
          const nestedCall = arg as CallExpression;
          if (nestedCall.wasForgotten()) continue;
          
          try {
            const nestedExpr = safeGetExpression(nestedCall);
            if (!nestedExpr || safeGetText(nestedExpr) !== 'createSafeMessage') continue;
            
            // Ottieni l'argomento interno
            const nestedArgs = nestedCall.getArguments();
            if (nestedArgs.length === 0 || nestedArgs[0].wasForgotten()) continue;
            
            const nestedArg = nestedArgs[0];
            const nestedArgText = safeGetText(nestedArg); // Usa safeGetText
            
            if (dryRun) {
              console.log(chalk.yellow(`\nNested createSafeMessage in ${filePath}:`));
              console.log(chalk.red(`  - From: ${safeGetText(callExpr)}`)); // Usa safeGetText
              console.log(chalk.green(`  - To:   createSafeMessage(${nestedArgText})`));
            } else {
              // Salva l'operazione di sostituzione per eseguirla dopo
              transformOperations.push({
                node: callExpr,
                replacement: `createSafeMessage(${nestedArgText})`
              });
              
              modified = true;
              transformCount++;
            }
          } catch (error) {
            console.error(`Errore nell'analizzare chiamata annidata in ${filePath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Errore nell'elaborare ${safeGetText(callExpr) || 'una chiamata'} in ${filePath}:`, error);
      }
    }
    
    // Applica le modifiche dopo aver completato l'analisi
    if (!dryRun && transformOperations.length > 0) {
      // Applica le sostituzioni in ordine inverso per evitare di invalidare gli indici
      for (let i = transformOperations.length - 1; i >= 0; i--) {
        const op = transformOperations[i];
        if (!op.node.wasForgotten()) {
          try {
            op.node.replaceWithText(op.replacement);
          } catch (error) {
            console.error(`Errore nel sostituire ${safeGetText(op.node) || 'un nodo'} in ${filePath}:`, error);
            transformCount--;
          }
        } else {
          console.warn(`Nodo dimenticato prima della sostituzione in ${filePath}`);
          transformCount--;
        }
      }
    }

    if (modified && !dryRun) {
      try {
        sourceFile.saveSync();
        console.log(`Aggiornato: ${filePath} (${transformCount} correzioni)`);
      } catch (error) {
        console.error(`Errore nel salvare ${filePath}:`, error);
        modified = false;
      }
    }

    return modified;
  } catch (error) {
    console.error(`Errore nell'elaborare il file ${filePath}:`, error);
    return false;
  }
}

// Elabora tutti i file
for (const filePath of filesToTransform) {
  try {
    const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
    const fileModified = processSourceFile(sourceFile, filePath, isDryRun);
    
    if (fileModified) {
      affectedFileCount++;
      fixedCount += 1; // Incrementiamo per ogni file, non per ogni fix
    }
  } catch (error) {
    console.error(chalk.red(`Errore nell'elaborare ${filePath}:`), error);
  }
}

// Stampa risultato finale
if (isDryRun) {
  console.log(chalk.cyanBright(`\nCheck completato. Trovate ${fixedCount} chiamate nidificate in ${affectedFileCount} file.\n`));
  
  if (fixedCount > 0) {
    console.log(chalk.yellow(`Per correggere automaticamente, esegui senza --check`));
    process.exit(1); 
  } else {
    console.log(chalk.green(`✅ Nessuna chiamata nidificata trovata!\n`));
    process.exit(0);
  }
} else {
  console.log(chalk.cyanBright(`\n🏁 Correzione completata. Sistemati ${fixedCount} file con chiamate nidificate.\n`));
} 