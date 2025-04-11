/**
 * @file jest-to-vitest.js
 * @description Script per migrare automaticamente i test da Jest a Vitest
 * @usage node scripts/jest-to-vitest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Ottieni la directory corrente in modo compatibile con ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_PATHS = [
  path.join(ROOT_DIR, 'src/**/*.test.ts'),
  path.join(ROOT_DIR, 'src/**/*.test.tsx'),
  path.join(ROOT_DIR, 'src/__tests__/**/*.ts'),
  path.join(ROOT_DIR, 'src/__tests__/**/*.tsx'),
  path.join(ROOT_DIR, 'src/__integration__/**/*.ts'),
  path.join(ROOT_DIR, 'src/__integration__/**/*.tsx')
];

/**
 * Sostituzioni da effettuare nei file
 * Formato: [regex di ricerca, stringa di sostituzione]
 */
const replacements = [
  // Sostituzioni di base
  { from: /jest\.mock/g, to: 'vi.mock' },
  { from: /jest\.fn/g, to: 'vi.fn' },
  { from: /jest\.spyOn/g, to: 'vi.spyOn' },
  { from: /jest\.clearAllMocks/g, to: 'vi.clearAllMocks' },
  { from: /jest\.resetAllMocks/g, to: 'vi.resetAllMocks' },
  { from: /jest\.restoreAllMocks/g, to: 'vi.restoreAllMocks' },
  { from: /jest\.setTimeout/g, to: 'vi.setTimeout' },
  { from: /jest\.useFakeTimers/g, to: 'vi.useFakeTimers' },
  { from: /jest\.useRealTimers/g, to: 'vi.useRealTimers' },
  { from: /jest\.advanceTimersByTime/g, to: 'vi.advanceTimersByTime' },
  { from: /jest\.runAllTimers/g, to: 'vi.runAllTimers' },
  { from: /jest\.runOnlyPendingTimers/g, to: 'vi.runOnlyPendingTimers' },
  
  // MockedFunction
  { from: /jest\.MockedFunction/g, to: 'vi.MockedFunction' },
  
  // Import di jest
  { from: /import\s+(\{[^}]*\})\s+from\s+['"]jest['"]/g, to: 'import $1 from "vitest"' },
  { from: /import\s+\*\s+as\s+jest\s+from\s+['"]jest['"]/g, to: 'import * as vi from "vitest"' },
  
  // Sostituzione riferimenti a jest con vi nei commenti
  { from: /\/\/.*jest/g, to: (match) => match.replace(/jest/g, 'vi') },
  { from: /\/\*[\s\S]*?\*\//g, to: (match) => match.replace(/jest/g, 'vi') },
  
  // Sostituzione delle dichiarazioni di tipo
  { from: /type\s+MockedFunction<T>\s+=\s+jest\.MockedFunction<T>/g, to: 'type MockedFunction<T> = vi.MockedFunction<T>' },
  
  // Aggiungere l'import di vi se non è già presente
  { 
    from: /^(?!import.*['"]vitest['"])/,
    to: (match) => match + 'import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";\n',
    firstLineOnly: true
  }
];

/**
 * Funzione per verificare se un file è un file di test
 * @param {string} filePath Percorso del file da verificare
 * @returns {boolean} True se è un file di test, altrimenti false
 */
function isTestFile(filePath) {
  const fileName = path.basename(filePath);
  return fileName.includes('.test.') || fileName.includes('.spec.');
}

/**
 * Funzione per convertire un file
 * @param {string} filePath Percorso del file da convertire
 */
function convertFile(filePath) {
  if (!isTestFile(filePath)) return;
  
  console.log(`Convertendo: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let contentChanged = false;
    
    // Applica le sostituzioni
    replacements.forEach(replacement => {
      if (replacement.firstLineOnly) {
        const lines = content.split('\n');
        const firstLine = lines[0];
        const newFirstLine = firstLine.replace(replacement.from, replacement.to);
        
        if (firstLine !== newFirstLine) {
          lines[0] = newFirstLine;
          content = lines.join('\n');
          contentChanged = true;
        }
      } else if (typeof replacement.from === 'string') {
        if (content.includes(replacement.from)) {
          content = content.split(replacement.from).join(replacement.to);
          contentChanged = true;
        }
      } else {
        const newContent = content.replace(replacement.from, (match, ...args) => {
          if (typeof replacement.to === 'function') {
            return replacement.to(match, ...args);
          }
          return replacement.to;
        });
        
        if (newContent !== content) {
          content = newContent;
          contentChanged = true;
        }
      }
    });
    
    // Salva il file se ci sono state modifiche
    if (contentChanged) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Convertito: ${filePath}`);
    } else {
      console.log(`⏭️ Nessuna modifica necessaria: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Errore nella conversione di ${filePath}:`, error);
  }
}

/**
 * Funzione per attraversare una directory
 * @param {string} directory Percorso della directory da attraversare
 */
function traverseDirectory(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
    const fullPath = path.join(directory, dirent.name);
    
    if (dirent.isDirectory()) {
      // Salta node_modules e .git
      if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
        traverseDirectory(fullPath);
      }
    } else if (dirent.isFile() && fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      convertFile(fullPath);
    }
  });
}

/**
 * Funzione principale che esegue lo script
 */
function main() {
  console.log('🚀 Iniziando la migrazione da Jest a Vitest...');
  
  const files = getTestFiles();
  console.log(`📋 Trovati ${files.length} file di test da processare.`);
  
  let modifiedCount = 0;
  files.forEach(file => {
    if (convertFile(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n✨ Migrazione completata! Modificati ${modifiedCount} file su ${files.length}.`);
}

// Esegui lo script
main(); 