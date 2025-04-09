#!/usr/bin/env node
/**
 * Script per correggere automaticamente gli errori di import in progetti TypeScript ESM
 * 
 * Risolve:
 * - TS2835: Relative import paths need explicit file extensions in EcmaScript imports
 * - TS1484: 'X' is a type and must be imported using a type-only import
 * 
 * Uso:
 * ```
 * node scripts/fix-imports.js
 * node scripts/fix-imports.js --dry-run  # Solo anteprima modifiche senza scrivere
 * ```
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  importFixCount: 0,
  typeImportFixCount: 0
};

// Funzioni promisify per Node.js
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Regex per trovare problemi di import
const IMPORT_REGEX = /from\s+['"]([^'"]*?)(?:\.js)?['"]/g;
const TYPE_IMPORT_REGEX = /import\s+(?!type)({[^}]*})\s+from\s+['"]/g;

/**
 * Processa un singolo file correggendo gli import
 * @param {string} filePath Percorso del file da processare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let importFixCount = 0;
    let typeImportFixCount = 0;
    
    // Corregge gli import senza estensione .js
    newContent = newContent.replace(IMPORT_REGEX, (match, importPath) => {
      // Aggiungi .js solo se è un import relativo e non ha già un'estensione
      if ((importPath.startsWith('./') || importPath.startsWith('../')) && 
          !importPath.match(/\.(js|jsx|ts|tsx|json|css|scss|less|svg|png|jpg|jpeg|gif)$/)) {
        importFixCount++;
        return match.replace(importPath, `${importPath}.js`);
      }
      return match;
    });

    // Migliora imports di tipi (questo è un fix parziale, alcuni potrebbero richiedere revisione manuale)
    // Cerca gli import che probabilmente contengono solo tipi
    const typeIndicators = [
      'Type', 'Interface', 'Enum', 'Props', 'State', 'Config', 'Options', 
      'Settings', 'Args', 'Params', 'Result'
    ];
    
    // Controlla se il contenuto dell'import contiene indicatori di tipi
    function shouldBeTypeImport(importContent) {
      const items = importContent.split(',').map(i => i.trim());
      return items.some(item => 
        typeIndicators.some(indicator => item.includes(indicator))
      );
    }
    
    // Trasforma gli import normali in import type quando appropriato
    newContent = newContent.replace(TYPE_IMPORT_REGEX, (match, importContent) => {
      if (shouldBeTypeImport(importContent)) {
        typeImportFixCount++;
        return match.replace('import {', 'import type {');
      }
      return match;
    });
    
    // Aggiorna le statistiche
    stats.importFixCount += importFixCount;
    stats.typeImportFixCount += typeImportFixCount;
    
    // Scrivi modifiche solo se ci sono state effettivamente modifiche e non siamo in modalità dry-run
    if (content !== newContent) {
      if (!DRY_RUN) {
        await writeFile(filePath, newContent, 'utf-8');
      }
      stats.filesModified++;
      return { 
        path: filePath,
        modified: true,
        importFixCount,
        typeImportFixCount
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
  console.log(`📂 Scansione file TypeScript... ${DRY_RUN ? '[MODALITÀ DRY-RUN]' : ''}`);
  
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
        console.log(`\n✅ ${DRY_RUN ? '[ANTEPRIMA] ' : ''}Modificato: ${result.path} (${result.importFixCount} import, ${result.typeImportFixCount} type import)`);
      } else if (result.error) {
        console.error(`\n❌ Errore in ${result.path}: ${result.error}`);
      }
    }
    
    // Mostra un riepilogo
    console.log('\n\n📊 RIEPILOGO:');
    console.log(`- File scansionati: ${stats.filesScanned}`);
    console.log(`- File ${DRY_RUN ? 'che sarebbero modificati' : 'modificati'}: ${stats.filesModified}`);
    console.log(`- Import .js ${DRY_RUN ? 'che sarebbero aggiunti' : 'aggiunti'}: ${stats.importFixCount}`);
    console.log(`- Import type ${DRY_RUN ? 'che sarebbero migliorati' : 'migliorati'}: ${stats.typeImportFixCount}`);
    console.log(`- Errori: ${stats.errorCount}`);
    
    if (DRY_RUN) {
      console.log('\n✅ Anteprima completata! Per applicare le modifiche esegui senza --dry-run');
    } else {
      console.log('\n✅ Correzione completata! Esegui "pnpm tsc --noEmit" per verificare gli errori rimanenti');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    process.exit(1);
  }
}

// Esecuzione
main(); 