#!/usr/bin/env node
/**
 * Script per correggere errori di importazione con doppio suffisso .js.js
 * 
 * Risolve:
 * - '../path/to/module.js.js' -> '../path/to/module.js'
 * 
 * Uso:
 * ```
 * node scripts/fix-double-js.js
 * ```
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Funzioni promisify per Node.js
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configurazione
const EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '.vscode'];
const ROOT_DIR = './src';

// Statistiche
const stats = {
  filesScanned: 0,
  filesModified: 0,
  errorCount: 0,
  fixCount: 0
};

// Regex per trovare import con doppio .js
const DOUBLE_JS_REGEX = /from\s+['"]([^'"]*?)\.js\.js['"]/g;

/**
 * Processa un singolo file correggendo gli import
 * @param {string} filePath Percorso del file da processare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let fixCount = 0;
    
    // Corregge gli import con doppio .js.js
    newContent = newContent.replace(DOUBLE_JS_REGEX, (match, importPath) => {
      fixCount++;
      return match.replace(`${importPath}.js.js`, `${importPath}.js`);
    });
    
    // Aggiorna le statistiche
    stats.fixCount += fixCount;
    
    // Scrivi modifiche solo se ci sono state effettivamente modifiche
    if (content !== newContent) {
      await writeFile(filePath, newContent, 'utf-8');
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
  } catch (error) {
    console.error(`Errore nella lettura della directory ${dir}:`, error);
    stats.errorCount++;
  }
  
  return results;
}

/**
 * Funzione principale
 */
async function main() {
  console.log('📂 Scansione file TypeScript per trovare import con doppio .js.js...');
  
  try {
    // Trova tutti i file TypeScript/TSX nella directory src
    const files = await walkDir(ROOT_DIR);
    stats.filesScanned = files.length;
    console.log(`🔍 Trovati ${files.length} file da processare`);
    
    // Processa ogni file
    const results = [];
    let completed = 0;
    
    for (const file of files) {
      const result = await processFile(file);
      results.push(result);
      
      completed++;
      if (completed % 10 === 0 || completed === files.length) {
        process.stdout.write(`\r⏳ Processati ${completed}/${files.length} file (${Math.round(completed/files.length*100)}%)`);
      }
      
      if (result.modified) {
        console.log(`\n✅ Modificato: ${result.path} (${result.fixCount} correzioni di .js.js)`);
      } else if (result.error) {
        console.error(`\n❌ Errore in ${result.path}: ${result.error}`);
      }
    }
    
    // Mostra un riepilogo
    console.log('\n\n📊 RIEPILOGO:');
    console.log(`- File scansionati: ${stats.filesScanned}`);
    console.log(`- File modificati: ${stats.filesModified}`);
    console.log(`- Import .js.js corretti: ${stats.fixCount}`);
    console.log(`- Errori: ${stats.errorCount}`);
    
    console.log('\n✅ Correzione completata! Esegui "pnpm tsc --noEmit" per verificare gli errori rimanenti');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    process.exit(1);
  }
}

// Esecuzione
main(); 