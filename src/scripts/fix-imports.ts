#!/usr/bin/env node
/**
 * Script TypeScript per correggere automaticamente gli errori di import in progetti ESM
 *
 * Risolve:
 * - TS2835: Relative import paths need explicit file extensions in EcmaScript imports
 * - TS1484: 'X' is a type and must be imported using a type-only import
 * - TS2307: Import paths with duplicate `.js` extensions
 *
 * Uso:
 * ```
 * pnpm fix-imports           # Esecuzione standard
 * pnpm fix-imports --check   # Solo anteprima modifiche (non scrive)
 * pnpm fix-imports --verbose # Mostra dettagli completi
 * pnpm fix-imports file1.ts file2.ts  # Processa solo file specifici
 * ```
 */

import fs from 'fs/promises';
import path from 'path';

// Costanti esportate per i test
export const DEFAULT_EXTENSIONS = ['.ts', '.tsx'];
export const DEFAULT_EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', '.vscode'];

// Tipi
interface ProgramOptions {
  check: boolean;
  verbose: boolean;
  help: boolean;
  paths: string[];
}

interface FileResult {
  path: string;
  modified: boolean;
  importFixCount: number;
  typeImportFixCount: number;
  doubleJsFixCount: number;
  error?: string;
}

/**
 * Analizza gli argomenti da linea di comando
 * @param args Array di argomenti da linea di comando
 * @returns Opzioni del programma configurate
 */
export function parseArguments(args: string[]): ProgramOptions {
  const options: ProgramOptions = {
    check: false,
    verbose: false,
    help: false,
    paths: ['.'],
  };

  const normalArgs: string[] = [];

  for (const arg of args) {
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      normalArgs.push(arg);
    }
  }

  if (normalArgs.length > 0) {
    options.paths = normalArgs;
  }

  return options;
}

/**
 * Verifica se un file dovrebbe essere processato in base all'estensione
 * @param filePath Percorso del file
 * @param allowedExtensions Array di estensioni consentite
 * @returns True se il file dovrebbe essere processato
 */
function shouldProcessFile(
  filePath: string,
  allowedExtensions: string[],
  excludedDirs: string[]
): boolean {
  const extension = path.extname(filePath);

  // Controlla se il file ha un'estensione supportata
  if (!allowedExtensions.includes(extension)) {
    return false;
  }

  // Controlla se il file è in una directory esclusa
  return !excludedDirs.some((dir) => filePath.includes(`${dir}${path.sep}`));
}

/**
 * Ottiene tutti i file da processare
 * @param paths Percorsi da processare (file o directory)
 * @param extensions Array di estensioni consentite
 * @param excludedDirs Array di directory da escludere
 * @returns Array di percorsi di file da processare
 */
export async function getFilesToProcess(
  paths: string[],
  extensions: string[] = DEFAULT_EXTENSIONS,
  excludedDirs: string[] = DEFAULT_EXCLUDED_DIRS
): Promise<string[]> {
  const result: string[] = [];

  for (const itemPath of paths) {
    try {
      // Verifica se il percorso esiste
      await fs.access(itemPath);

      // Controlla se è un file o una directory
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // Se è una directory, esegue una scansione ricorsiva
        const files = await walkDirectory(itemPath, extensions, excludedDirs);
        result.push(...files);
      } else if (shouldProcessFile(itemPath, extensions, excludedDirs)) {
        // Se è un file con estensione consentita, aggiungilo all'elenco
        result.push(itemPath);
      }
    } catch (error) {
      console.error(`Errore nell'elaborazione di ${itemPath}:`, error);
    }
  }

  return result;
}

/**
 * Scansiona ricorsivamente una directory per trovare file TypeScript
 * @param dirPath Percorso della directory
 * @param extensions Array di estensioni consentite
 * @param excludedDirs Array di directory da escludere
 * @returns Array di percorsi di file trovati
 */
async function walkDirectory(
  dirPath: string,
  extensions: string[],
  excludedDirs: string[]
): Promise<string[]> {
  const result: string[] = [];

  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);

      // Salta le directory escluse
      if (excludedDirs.includes(item)) {
        continue;
      }

      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // Scansione ricorsiva sottodirectory
        const subDirFiles = await walkDirectory(itemPath, extensions, excludedDirs);
        result.push(...subDirFiles);
      } else if (shouldProcessFile(itemPath, extensions, excludedDirs)) {
        // Aggiungi i file con estensione consentita
        result.push(itemPath);
      }
    }
  } catch (error) {
    console.error(`Errore nella lettura della directory ${dirPath}:`, error);
  }

  return result;
}

// Regex pattern per trovare problemi di import
const IMPORT_REGEX = /from\s+['"]([^'"]*?)(?:\.js)?['"]/g;
const TYPE_IMPORT_REGEX = /import\s+(?!type)({[^}]*})\s+from\s+['"]/g;
const DOUBLE_JS_REGEX = /from\s+['"]([^'"]*?)\.js\.js['"]/g;

/**
 * Processa un singolo file correggendo gli import
 * @param filePath Percorso del file da processare
 * @param checkOnly Modalità di sola verifica (senza scrivere modifiche)
 * @param verbose Modalità verbosa
 * @returns Risultato dell'elaborazione
 */
export async function processFile(
  filePath: string,
  checkOnly: boolean,
  verbose: boolean
): Promise<FileResult> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let newContent = content;
    let importFixCount = 0;
    let typeImportFixCount = 0;
    let doubleJsFixCount = 0;

    // Corregge gli import con doppio .js
    newContent = newContent.replace(DOUBLE_JS_REGEX, (match, importPath) => {
      doubleJsFixCount++;
      return match.replace(`${importPath}.js`, `${importPath}.js`);
    });

    // Corregge gli import senza estensione .js
    newContent = newContent.replace(IMPORT_REGEX, (match, importPath) => {
      // Aggiungi .js solo se è un import relativo e non ha già un'estensione
      if (
        (importPath.startsWith('./') || importPath.startsWith('../')) &&
        !importPath.match(/\.(js|jsx|ts|tsx|json|css|scss|less|svg|png|jpg|jpeg|gif)$/)
      ) {
        importFixCount++;
        return match.replace(importPath, `${importPath}.js`);
      }
      return match;
    });

    // Migliora imports di tipi
    const typeIndicators = [
      'Type',
      'Interface',
      'Enum',
      'Props',
      'State',
      'Config',
      'Options',
      'Settings',
      'Args',
      'Params',
      'Result',
    ];

    // Controlla se il contenuto dell'import contiene indicatori di tipi
    function shouldBeTypeImport(importContent: string): boolean {
      const items = importContent.split(',').map((i) => i.trim());
      return items.some((item) => typeIndicators.some((indicator) => item.includes(indicator)));
    }

    // Trasforma gli import normali in import type quando appropriato
    newContent = newContent.replace(TYPE_IMPORT_REGEX, (match, importContent) => {
      if (shouldBeTypeImport(importContent)) {
        typeImportFixCount++;
        return match.replace('import {', 'import type {');
      }
      return match;
    });

    // Verifica se ci sono state modifiche
    const hasChanges = content !== newContent;

    // Mostra dettagli in modalità verbose
    if (verbose && hasChanges) {
      console.log(
        `[${filePath}] ${importFixCount} import fixes, ${typeImportFixCount} type import fixes, ${doubleJsFixCount} double .js fixes`
      );
    }

    // Scrivi le modifiche se necessario e non in modalità check
    if (hasChanges && !checkOnly) {
      await fs.writeFile(filePath, newContent, 'utf8');
    }

    return {
      path: filePath,
      modified: hasChanges,
      importFixCount,
      typeImportFixCount,
      doubleJsFixCount,
    };
  } catch (error) {
    if (verbose) {
      console.error(`Errore nell'elaborazione di ${filePath}:`, error);
    }
    return {
      path: filePath,
      modified: false,
      importFixCount: 0,
      typeImportFixCount: 0,
      doubleJsFixCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Mostra istruzioni di utilizzo
 */
function showHelp(): void {
  console.log(`
Fix-Imports - Correzione automatica degli import nei progetti TypeScript ESM

Uso:
  pnpm fix-imports [opzioni] [file...]

Opzioni:
  --check       Verifica i problemi senza effettuare modifiche
  --verbose     Mostra informazioni dettagliate sull'elaborazione
  --help, -h    Mostra questo messaggio di aiuto

Esempi:
  pnpm fix-imports                       # Processa tutti i file TypeScript nel progetto
  pnpm fix-imports --check               # Verifica senza modificare
  pnpm fix-imports --verbose src/app.ts  # Processo dettagliato di un singolo file
  `);
}

/**
 * Funzione principale
 */
async function main(): Promise<void> {
  // Analizza gli argomenti da linea di comando
  const args = process.argv.slice(2);
  const options = parseArguments(args);

  // Mostra aiuto se richiesto
  if (options.help) {
    showHelp();
    return;
  }

  console.log(`📂 Correzione import TypeScript`);
  if (options.check) {
    console.log(
      '🔍 Modalità CHECK: le modifiche verranno solo verificate, nessun file sarà modificato'
    );
  }

  // Ottieni i file da processare
  let filesToProcess: string[] = [];

  if (options.paths.length === 1 && options.paths[0] === '.') {
    // Se non sono stati specificati percorsi, processa l'intera directory src
    filesToProcess = await getFilesToProcess(['src'], DEFAULT_EXTENSIONS, DEFAULT_EXCLUDED_DIRS);
  } else {
    // Altrimenti processa solo i percorsi specificati
    filesToProcess = await getFilesToProcess(
      options.paths,
      DEFAULT_EXTENSIONS,
      DEFAULT_EXCLUDED_DIRS
    );
  }

  console.log(`🔍 Trovati ${filesToProcess.length} file da processare`);

  // Statistiche
  let filesModified = 0;
  let totalImportFixes = 0;
  let totalTypeImportFixes = 0;
  let totalDoubleJsFixes = 0;
  let errors = 0;

  // Processa ogni file
  for (const file of filesToProcess) {
    const result = await processFile(file, options.check, options.verbose);

    if (result.error) {
      errors++;
    }

    if (result.modified) {
      filesModified++;
      totalImportFixes += result.importFixCount;
      totalTypeImportFixes += result.typeImportFixCount;
      totalDoubleJsFixes += result.doubleJsFixCount;
    }
  }

  // Mostra riepilogo
  console.log('\n✅ Elaborazione completata');
  console.log(`📊 Statistiche:
  - File scansionati: ${filesToProcess.length}
  - File modificati: ${filesModified}
  - Errori: ${errors}
  - Import corretti: ${totalImportFixes}
  - Import di tipo corretti: ${totalTypeImportFixes}
  - Import con doppio .js corretti: ${totalDoubleJsFixes}
  `);
}

// Esegui la funzione principale se questo script è stato eseguito direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Errore durante l'esecuzione dello script:", error);
    process.exit(1);
  });
}
