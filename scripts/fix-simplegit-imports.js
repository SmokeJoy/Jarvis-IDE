#!/usr/bin/env node
/**
 * Script per correggere errori di importazione di SimpleGit
 * 
 * Risolve:
 * - TS2349: This expression is not callable.
 * - TS1484: 'SimpleGit' è un tipo e deve essere importato usando un import di solo tipo
 * 
 * Uso:
 * ```
 * node scripts/fix-simplegit-imports.js
 * node scripts/fix-simplegit-imports.js --dry-run  # Solo anteprima modifiche senza scrivere
 * ```
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Configurazione
const ROOT_DIR = './src';
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

// Regex per trovare import di SimpleGit
const SIMPLEGIT_IMPORT_REGEX = /import\s+simpleGit,\s*{\s*SimpleGit\s*}\s+from\s+['"]simple-git['"];?/g;
const SIMPLEGIT_USAGE_REGEX = /simpleGit\s*\(/g;

/**
 * Processa un singolo file correggendo gli import di SimpleGit
 * @param {string} filePath Percorso del file da processare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Verifica se il file contiene import di SimpleGit
    if (!content.includes('simple-git')) {
      return { 
        path: filePath,
        modified: false
      };
    }
    
    let newContent = content;
    let fixCount = 0;
    
    // Corregge gli import di SimpleGit
    if (SIMPLEGIT_IMPORT_REGEX.test(newContent)) {
      newContent = newContent.replace(SIMPLEGIT_IMPORT_REGEX, () => {
        fixCount++;
        return 'import { simpleGit, SimpleGit } from "simple-git";';
      });
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
 * Scansiona ricorsivamente una directory per trovare file TypeScript
 * @param {string} dir Directory da scansionare
 * @returns {Promise<string[]>} Lista di file trovati
 */
async function walkDir(dir) {
  const results = [];
  const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '.vscode'];
  const EXTENSIONS = ['.ts', '.tsx'];
  
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
  console.log(`Correzione import SimpleGit in ${ROOT_DIR}${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  
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