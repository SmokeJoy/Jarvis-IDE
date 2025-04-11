#!/usr/bin/env node
/**
 * Script per correggere errori di importazione dei React hooks
 * 
 * Risolve:
 * - TS1361: 'X' non può essere usato come valore perché è stato importato usando 'import type'
 * - Corregge specificamente i file nella cartella src/hooks/ che importano React hooks come tipi
 * 
 * Uso:
 * ```
 * node scripts/fix-react-hooks-imports.js
 * node scripts/fix-react-hooks-imports.js --dry-run  # Solo anteprima modifiche senza scrivere
 * ```
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Configurazione
const HOOKS_DIR = './src/hooks';
const DRY_RUN = process.argv.includes('--dry-run');

// Statistiche
const stats = {
  filesScanned: 0,
  filesModified: 0,
  errorCount: 0,
  fixCount: 0
};

// Funzioni promisify per Node.js
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Lista di React hooks comuni che devono essere importati come valori, non come tipi
const REACT_HOOKS = [
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue',
  'useDeferredValue',
  'useTransition',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect'
];

// Regex per trovare import type di React hooks
const REACT_HOOKS_IMPORT_REGEX = /import\s+type\s+{([^}]*)}\s+from\s+['"](react)['"];?/g;

/**
 * Processa un singolo file correggendo gli import di React hooks
 * @param {string} filePath Percorso del file da processare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let fixCount = 0;
    
    // Corregge gli import type di React hooks
    newContent = newContent.replace(REACT_HOOKS_IMPORT_REGEX, (match, importContent, importPath) => {
      if (importPath !== 'react') return match;
      
      // Verifica se ci sono hooks React nell'import
      const importItems = importContent.split(',').map(item => item.trim());
      const hasReactHooks = importItems.some(item => REACT_HOOKS.includes(item));
      
      if (hasReactHooks) {
        fixCount++;
        return match.replace('import type', 'import');
      }
      
      return match;
    });
    
    // Aggiunge dichiarazione vscode se mancante
    if (newContent.includes('vscode.postMessage') && !newContent.includes('declare const vscode:')) {
      const vscodeDeclaration = '// Dichiarazione per l\'API vscode WebView\ndeclare const vscode: { postMessage: (message: any) => void };\n\n';
      newContent = vscodeDeclaration + newContent;
      fixCount++;
    }
    
    // Aggiorna le statistiche
    stats.fixCount += fixCount;
    
    // Scrivi modifiche solo se ci sono state effettivamente modifiche e non siamo in modalità dry-run
    if (content !== newContent) {
      if (!DRY_RUN) {
        await writeFile(filePath, newContent, 'utf-8');
      }
      stats.filesModified++;
      return { 
        path: filePath,
        modified: true,
        fixCount
      };
    }
    
    return { 
      path: filePath,
      modified: false
    };
  } catch (error) {
    stats.errorCount++;
    return { 
      path: filePath,
      error: error.message
    };
  }
}

/**
 * Scansiona la directory hooks per trovare file TypeScript
 * @returns {Promise<string[]>} Lista di file trovati
 */
async function findHooksFiles() {
  const results = [];
  
  try {
    const items = await readdir(HOOKS_DIR);
    
    for (const item of items) {
      const itemPath = path.join(HOOKS_DIR, item);
      const itemStat = await stat(itemPath);
      
      if (!itemStat.isDirectory() && itemPath.endsWith('.ts')) {
        results.push(itemPath);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Errore nella scansione di ${HOOKS_DIR}:`, error);
    return results;
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log(`Correzione import React hooks in ${HOOKS_DIR}${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  
  try {
    // Trova tutti i file TypeScript nella directory hooks
    const files = await findHooksFiles();
    stats.filesScanned = files.length;
    
    console.log(`Trovati ${files.length} file da processare.`);
    
    // Processa ogni file
    const results = await Promise.all(files.map(processFile));
    
    // Mostra risultati
    console.log('\nRisultati:');
    console.log(`- File scansionati: ${stats.filesScanned}`);
    console.log(`- File modificati: ${stats.filesModified}`);
    console.log(`- Correzioni: ${stats.fixCount}`);
    console.log(`- Errori: ${stats.errorCount}`);
    
    if (DRY_RUN) {
      console.log('\nEseguito in modalità DRY RUN. Nessun file è stato modificato.');
    }
    
    // Mostra dettagli dei file modificati
    const modifiedFiles = results.filter(r => r.modified);
    if (modifiedFiles.length > 0) {
      console.log('\nDettaglio file modificati:');
      modifiedFiles.forEach(result => {
        console.log(`- ${result.path}: ${result.fixCount} correzioni`);
      });
    }
    
    // Mostra errori
    const filesWithErrors = results.filter(r => r.error);
    if (filesWithErrors.length > 0) {
      console.log('\nErrori:');
      filesWithErrors.forEach(result => {
        console.log(`- ${result.path}: ${result.error}`);
      });
    }
    
  } catch (error) {
    console.error('Errore durante l\'esecuzione dello script:', error);
    process.exit(1);
  }
}

// Esegui lo script
main();