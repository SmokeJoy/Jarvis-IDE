/**
 * @file finalize-vsix.ts
 * @description Script per la finalizzazione e packaging dell'estensione VSCode
 * 
 * Questo script esegue le seguenti operazioni:
 * 1. Verifica che tutti i test passino
 * 2. Esegue la compilazione TypeScript
 * 3. Bundla il codice con esbuild
 * 4. Crea il pacchetto VSIX
 * 5. Aggiorna la documentazione di release
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// Colori per console
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Esegue un comando Shell e restituisce l'output
 */
function runCommand(command: string, cwd: string = ROOT_DIR): string {
  try {
    return execSync(command, { cwd, stdio: 'pipe' }).toString().trim();
  } catch (error: any) {
    console.error(`${COLORS.red}Errore nell'esecuzione del comando: ${command}${COLORS.reset}`);
    console.error(error.stdout?.toString() || error.message);
    process.exit(1);
  }
}

/**
 * Esegue un passaggio di build e ne stampa lo stato
 */
function runStep(name: string, fn: () => any): void {
  process.stdout.write(`${COLORS.blue}► ${name}...${COLORS.reset} `);
  try {
    fn();
    console.log(`${COLORS.green}✓${COLORS.reset}`);
  } catch (error) {
    console.log(`${COLORS.red}✗${COLORS.reset}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Verifica che tutti i test passino
 */
function runTests(): void {
  // Test del progetto principale
  runCommand('pnpm vitest run');
  
  // Test della webview-ui
  runCommand('pnpm vitest run', path.join(ROOT_DIR, 'webview-ui'));
}

/**
 * Esegue la compilazione TypeScript
 */
function compileTypeScript(): void {
  runCommand('pnpm tsc --noEmit');
  runCommand('pnpm tsc');
}

/**
 * Esegue il bundling con esbuild
 */
function bundleCode(): void {
  runCommand('pnpm run esbuild-base --minify');
  runCommand('pnpm run esbuild-watch --minify');
}

/**
 * Crea il pacchetto VSIX
 * @returns Path del file VSIX generato
 */
function packageVSIX(): string {
  // Legge la versione dal package.json
  const packageData = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const version = packageData.version;
  
  // Crea il pacchetto
  runCommand('pnpm vsce package');
  
  // Nome del file VSIX
  const vsixFileName = `jarvis-ide-${version}.vsix`;
  const vsixPath = path.join(ROOT_DIR, vsixFileName);
  
  // Verifica che il file esista
  if (!fs.existsSync(vsixPath)) {
    throw new Error(`File VSIX non trovato: ${vsixPath}`);
  }
  
  return vsixPath;
}

/**
 * Aggiorna la documentazione di release
 */
function updateReleaseNotes(version: string): void {
  const releaseNotesPath = path.join(ROOT_DIR, 'RELEASE-NOTES.md');
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Legge il contenuto attuale
  let content = '';
  if (fs.existsSync(releaseNotesPath)) {
    content = fs.readFileSync(releaseNotesPath, 'utf8');
  }
  
  // Template per la nuova release
  const newReleaseTemplate = `# ${version} (${date})

## Miglioramenti
- Ottimizzazione del Multi-Agent System (MAS)
- Supporto migliorato per provider LLM multipli
- Test completi per l'orchestratore LLM

## Bug Fix
- Risolti problemi di comunicazione tra agenti
- Corretti errori nei test Jest/Vitest
- Migliorata la stabilità dell'estensione

---

${content}`;
  
  // Scrive il nuovo contenuto
  fs.writeFileSync(releaseNotesPath, newReleaseTemplate, 'utf8');
}

/**
 * Funzione principale
 */
function main(): void {
  console.log(`${COLORS.magenta}=== FINALIZZAZIONE ESTENSIONE VSIX ===${COLORS.reset}\n`);
  
  // Legge la versione
  const packageData = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const version = packageData.version;
  
  console.log(`${COLORS.yellow}Versione: ${version}${COLORS.reset}\n`);
  
  // Esegue tutti i passaggi
  runStep('Esecuzione test', runTests);
  runStep('Compilazione TypeScript', compileTypeScript);
  runStep('Bundling con esbuild', bundleCode);
  
  let vsixPath: string = '';
  runStep('Creazione pacchetto VSIX', () => {
    vsixPath = packageVSIX();
  });
  
  runStep('Aggiornamento note di rilascio', () => {
    updateReleaseNotes(version);
  });
  
  // Output finale
  console.log(`\n${COLORS.green}✅ Pacchetto VSIX creato con successo:${COLORS.reset} ${vsixPath}`);
  console.log(`\n${COLORS.yellow}Per installare: ${COLORS.reset}code --install-extension ${path.basename(vsixPath)}`);
}

// Esecuzione dello script
main(); 