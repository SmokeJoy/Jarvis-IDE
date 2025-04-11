/**
 * @file jest-to-vitest.js
 * @description Script per convertire i test da Jest a Vitest
 * 
 * Istruzioni per l'utilizzo:
 * 1. Esegui con: node scripts/jest-to-vitest.js <percorso>
 * 2. Il percorso può essere un file specifico o una directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Ottieni il percorso corrente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping delle sostituzioni
const replacements = [
  // Import e API
  { from: /import\s+.*\s+from\s+['"]@testing-library\/jest-dom['"];?/g, to: "import '@testing-library/jest-dom';" },
  { from: /import\s+.*\s+from\s+['"]jest['"];?/g, to: "import { vi } from 'vitest';" },
  { from: /import\s+{\s*render,\s*screen\s*}(?!\s*from\s+['"]vitest['"]\s*)/g, to: "import { render, screen } from '@testing-library/react';" },
  
  // Funzioni principali
  { from: /jest\.fn\(\)/g, to: "vi.fn()" },
  { from: /jest\.mock\(/g, to: "vi.mock(" },
  { from: /jest\.spyOn\(/g, to: "vi.spyOn(" },
  { from: /jest\.useFakeTimers\(\)/g, to: "vi.useFakeTimers()" },
  { from: /jest\.useRealTimers\(\)/g, to: "vi.useRealTimers()" },
  { from: /jest\.resetAllMocks\(\)/g, to: "vi.resetAllMocks()" },
  { from: /jest\.clearAllMocks\(\)/g, to: "vi.clearAllMocks()" },
  { from: /jest\.restoreAllMocks\(\)/g, to: "vi.restoreAllMocks()" },
  
  // Timer
  { from: /jest\.advanceTimersByTime\(/g, to: "vi.advanceTimersByTime(" },
  { from: /jest\.runAllTimers\(\)/g, to: "vi.runAllTimers()" },
  { from: /jest\.runOnlyPendingTimers\(\)/g, to: "vi.runOnlyPendingTimers()" },
  
  // Implementazioni di mock
  { from: /\.mockImplementation\(/g, to: ".mockImplementation(" },
  { from: /\.mockResolvedValue\(/g, to: ".mockResolvedValue(" },
  { from: /\.mockRejectedValue\(/g, to: ".mockRejectedValue(" },
  { from: /\.mockReturnValue\(/g, to: ".mockReturnValue(" },
  
  // Matchers
  { from: /expect\(([^)]+)\)\.toHaveBeenCalled\(\)/g, to: "expect($1).toHaveBeenCalled()" },
  { from: /expect\(([^)]+)\)\.toHaveBeenCalledWith\(/g, to: "expect($1).toHaveBeenCalledWith(" },
  { from: /expect\(([^)]+)\)\.toHaveBeenCalledTimes\(/g, to: "expect($1).toHaveBeenCalledTimes(" },
];

/**
 * Converte un file da Jest a Vitest
 * @param {string} filePath Percorso del file da convertire
 */
function convertFile(filePath) {
  console.log(`Elaborazione di ${filePath}...`);
  
  try {
    // Leggi il contenuto del file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Applica le sostituzioni
    for (const replacement of replacements) {
      content = content.replace(replacement.from, replacement.to);
    }
    
    // Se il file non importa già vitest, aggiungi l'import
    if (!content.includes("from 'vitest'")) {
      content = content.replace(
        /(import\s+.*from\s+['"].*['"];?\n|\/\*[\s\S]*?\*\/\n|\/\/.*\n)*/,
        match => match + "import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\n"
      );
    }
    
    // Scrivi il contenuto aggiornato
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ File convertito: ${filePath}`);
  } catch (error) {
    console.error(`❌ Errore nella conversione di ${filePath}:`, error);
  }
}

/**
 * Processa una directory ricorsivamente
 * @param {string} directoryPath Percorso della directory da processare
 */
function processDirectory(directoryPath) {
  const testFiles = glob.sync(`${directoryPath}/**/*.{test,spec}.{js,jsx,ts,tsx}`);
  
  if (testFiles.length === 0) {
    console.log(`⚠️ Nessun file di test trovato in ${directoryPath}`);
    return;
  }
  
  console.log(`Trovati ${testFiles.length} file di test in ${directoryPath}`);
  
  for (const filePath of testFiles) {
    convertFile(filePath);
  }
}

// Punto di ingresso principale
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Utilizzo: node scripts/jest-to-vitest.js <percorso>');
    process.exit(1);
  }
  
  const targetPath = path.resolve(args[0]);
  
  try {
    const stats = fs.statSync(targetPath);
    
    if (stats.isDirectory()) {
      processDirectory(targetPath);
    } else if (stats.isFile()) {
      convertFile(targetPath);
    } else {
      console.error(`❌ Il percorso ${targetPath} non è un file o una directory valida`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Errore nell'accesso al percorso ${targetPath}:`, error);
    process.exit(1);
  }
  
  console.log('✅ Conversione completata!');
}

main(); 