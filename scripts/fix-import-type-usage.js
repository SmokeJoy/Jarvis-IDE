#!/usr/bin/env node
/**
 * Script per correggere errori di importazione di tipo in progetti TypeScript ESM
 * 
 * Risolve:
 * - TS1361: 'X' è un valore e non può essere importato usando un import di solo tipo
 * - TS1484: 'X' è un tipo e deve essere importato usando un import di solo tipo
 * 
 * Uso:
 * ```
 * node scripts/fix-import-type-usage.js
 * node scripts/fix-import-type-usage.js --dry-run  # Solo anteprima modifiche senza scrivere
 * ```
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Configurazione
const EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '.vscode'];
const ROOT_DIR = './src';
const DRY_RUN = process.argv.includes('--dry-run');

// Statistiche
const stats = {
  filesScanned: 0,
  filesModified: 0,
  errorCount: 0,
  typeToValueFixCount: 0,  // import type -> import
  valueToTypeFixCount: 0    // import -> import type
};

// Funzioni promisify per Node.js
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Regex per trovare problemi di import
const TYPE_IMPORT_REGEX = /import\s+type\s+({[^}]*})\s+from\s+['"]([^'"]*)['"];?/g;
const VALUE_IMPORT_REGEX = /import\s+({[^}]*})\s+from\s+['"]([^'"]*)['"];?/g;

// Liste di identificatori comuni per valori e tipi
const VALUE_INDICATORS = [
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
  'createContext', 'forwardRef', 'memo', 'Component', 'PureComponent',
  'Provider', 'Consumer', 'createRoot', 'render',
  'BaseLLMProvider', 'BaseProvider', 'createProvider',
  'createSlice', 'configureStore', 'createAsyncThunk',
  'Router', 'Route', 'Link', 'NavLink',
  'axios', 'fetch', 'request',
  'express', 'app', 'router',
  'createServer', 'Server', 'Client',
  'default', 'module', 'exports'
];

const TYPE_INDICATORS = [
  'Type', 'Interface', 'Enum', 'Props', 'State', 'Config', 'Options',
  'Settings', 'Args', 'Params', 'Result', 'Response', 'Request',
  'Handler', 'Callback', 'Listener', 'Event', 'Message',
  'Model', 'Schema', 'DTO', 'Entity',
  'Context', 'Store', 'Action', 'Reducer', 'Dispatch',
  'Component', 'Element', 'Node', 'Fragment',
  'Route', 'Path', 'Url', 'Query', 'Param'
];

/**
 * Verifica se un import contiene principalmente valori
 * @param {string} importContent Contenuto dell'import
 * @returns {boolean} True se l'import contiene principalmente valori
 */
function containsValues(importContent) {
  const items = importContent.split(',').map(i => i.trim());
  return items.some(item => {
    const cleanItem = item.split(' as ')[0].trim();
    return VALUE_INDICATORS.some(indicator => cleanItem === indicator);
  });
}

/**
 * Verifica se un import contiene principalmente tipi
 * @param {string} importContent Contenuto dell'import
 * @returns {boolean} True se l'import contiene principalmente tipi
 */
function containsTypes(importContent) {
  const items = importContent.split(',').map(i => i.trim());
  return items.some(item => {
    const cleanItem = item.split(' as ')[0].trim();
    return TYPE_INDICATORS.some(indicator => 
      cleanItem.includes(indicator) && 
      !VALUE_INDICATORS.includes(cleanItem)
    );
  });
}

/**
 * Processa un singolo file correggendo gli import
 * @param {string} filePath Percorso del file da processare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let typeToValueFixCount = 0;
    let valueToTypeFixCount = 0;
    
    // Corregge gli import type che dovrebbero essere import normali
    newContent = newContent.replace(TYPE_IMPORT_REGEX, (match, importContent, importPath) => {
      if (containsValues(importContent)) {
        typeToValueFixCount++;
        return match.replace('import type', 'import');
      }
      return match;
    });
    
    // Corregge gli import normali che dovrebbero essere import type
    newContent = newContent.replace(VALUE_IMPORT_REGEX, (match, importContent, importPath) => {
      // Ignora gli import che sono già stati convertiti nella fase precedente
      if (match.includes('import type')) {
        return match;
      }
      
      if (containsTypes(importContent) && !containsValues(importContent)) {
        valueToTypeFixCount++;
        return match.replace('import {', 'import type {');
      }
      return match;
    });
    
    // Aggiorna le statistiche
    stats.typeToValueFixCount += typeToValueFixCount;
    stats.valueToTypeFixCount += valueToTypeFixCount;
    
    // Scrivi modifiche solo se ci sono state effettivamente modifiche e non siamo in modalità dry-run
    if (content !== newContent) {
      if (!DRY_RUN) {
        await writeFile(filePath, newContent, 'utf-8');
      }
      stats.filesModified++;
      return { 
        path: filePath,
        modified: true,
        typeToValueFixCount,
        valueToTypeFixCount
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
 * Scansiona ricorsivamente una directory per trovare file TypeScript
 * @param {string} dir Directory da scansionare
 * @returns {Promise<string[]>} Lista di file trovati
 */
async function walkDir(dir) {
  const results = [];
  
  try {
    const items = await readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      
      if (EXCLUDE_DIRS.includes(item)) continue;
      
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        const subResults = await walkDir(itemPath);
        results.push(...subResults);
      } else if (EXTENSIONS.includes(path.extname(itemPath))) {
        results.push(itemPath);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Errore nella scansione di ${dir}:`, error);
    return results;
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log(`Correzione import di tipo in ${ROOT_DIR}${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  
  try {
    // Trova tutti i file TypeScript nel progetto
    const files = await walkDir(ROOT_DIR);
    stats.filesScanned = files.length;
    
    console.log(`Trovati ${files.length} file da processare.`);
    
    // Processa ogni file
    const results = await Promise.all(files.map(processFile));
    
    // Mostra risultati
    console.log('\nRisultati:');
    console.log(`- File scansionati: ${stats.filesScanned}`);
    console.log(`- File modificati: ${stats.filesModified}`);
    console.log(`- Correzioni 'import type' -> 'import': ${stats.typeToValueFixCount}`);
    console.log(`- Correzioni 'import' -> 'import type': ${stats.valueToTypeFixCount}`);
    console.log(`- Errori: ${stats.errorCount}`);
    
    if (DRY_RUN) {
      console.log('\nEseguito in modalità DRY RUN. Nessun file è stato modificato.');
    }
    
    // Mostra dettagli dei file modificati
    const modifiedFiles = results.filter(r => r.modified);
    if (modifiedFiles.length > 0) {
      console.log('\nDettaglio file modificati:');
      modifiedFiles.forEach(result => {
        console.log(`- ${result.path}`);
        if (result.typeToValueFixCount > 0) {
          console.log(`  - Correzioni 'import type' -> 'import': ${result.typeToValueFixCount}`);
        }
        if (result.valueToTypeFixCount > 0) {
          console.log(`  - Correzioni 'import' -> 'import type': ${result.valueToTypeFixCount}`);
        }
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