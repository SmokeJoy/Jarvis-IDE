/**
 * @file tsrefactor.ts
 * @description Prepara un file per il refactoring MAS-compliant
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configurazione
const BACKUP_DIR = '.cache/backups';
const HEADER = `/**
 * @file %FILENAME%
 * @description %DESCRIPTION%
 * @refactor MAS compliance
 * @author dev ai 1
 * @date %DATE%
 */
`;

interface RefactorContext {
  filePath: string;
  fileName: string;
  backupPath: string;
  description: string;
}

function validateInput(): string {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ Specificare il percorso del file da refactorare');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File non trovato: ${absolutePath}`);
    process.exit(1);
  }

  if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
    console.error('❌ Il file deve essere TypeScript (.ts/.tsx)');
    process.exit(1);
  }

  return absolutePath;
}

function createBackup(context: RefactorContext): void {
  // Crea directory backup se non esiste
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Copia il file nella directory backup
  fs.copyFileSync(context.filePath, context.backupPath);
  console.log(`✅ Backup creato in: ${context.backupPath}`);
}

function getFileDescription(filePath: string): string {
  try {
    // Legge il contenuto del file
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Cerca un commento di descrizione esistente
    const descMatch = content.match(/@description\s+([^\n]+)/);
    if (descMatch) {
      return descMatch[1].trim();
    }

    // Se non trovato, genera una descrizione basata sul nome del file
    const fileName = path.basename(filePath, path.extname(filePath));
    return `${fileName} module - pending MAS refactor`;
  } catch (error) {
    return 'Module pending MAS refactor';
  }
}

function prepareFile(context: RefactorContext): void {
  // Legge il contenuto originale
  const content = fs.readFileSync(context.filePath, 'utf-8');

  // Prepara l'header
  const header = HEADER
    .replace('%FILENAME%', context.fileName)
    .replace('%DESCRIPTION%', context.description)
    .replace('%DATE%', new Date().toISOString().split('T')[0]);

  // Rimuove eventuali header esistenti
  const cleanContent = content.replace(/\/\*\*[\s\S]*?\*\/\s*/, '');

  // Scrive il nuovo contenuto
  fs.writeFileSync(context.filePath, header + cleanContent);
}

function analyzeFile(context: RefactorContext): void {
  try {
    // Esegue tsc sul file
    execSync(`pnpm tsc ${context.filePath} --noEmit`, { stdio: 'pipe' });
    console.log('✅ File compila senza errori');
  } catch (error) {
    if (error instanceof Error) {
      console.log('⚠️  Errori di compilazione trovati:');
      console.log(error.message);
    }
  }

  // Cerca pattern non sicuri
  const content = fs.readFileSync(context.filePath, 'utf-8');
  const patterns = {
    any: (content.match(/any/g) || []).length,
    unknown: (content.match(/unknown/g) || []).length,
    asAssertions: (content.match(/as\s+[A-Za-z]/g) || []).length,
    todos: (content.match(/TODO|FIXME/g) || []).length
  };

  console.log('\n📊 Analisi Pattern:');
  console.log(`- any: ${patterns.any}`);
  console.log(`- unknown: ${patterns.unknown}`);
  console.log(`- type assertions: ${patterns.asAssertions}`);
  console.log(`- TODO/FIXME: ${patterns.todos}`);
}

// Esecuzione
try {
  // Validazione input
  const filePath = validateInput();
  const fileName = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, `${fileName}.backup-${Date.now()}`);
  const description = getFileDescription(filePath);

  const context: RefactorContext = {
    filePath,
    fileName,
    backupPath,
    description
  };

  console.log('\n🔄 Preparazione Refactor MAS');
  console.log('-------------------------');
  console.log(`📝 File: ${fileName}`);
  console.log(`📍 Path: ${filePath}`);

  // Esegue le operazioni
  createBackup(context);
  prepareFile(context);
  analyzeFile(context);

  console.log('\n✅ File pronto per il refactor');
  console.log('Prossimi passi:');
  console.log('1. Rimuovere tutti gli `any` e sostituire con tipi appropriati');
  console.log('2. Aggiungere type guard per narrowing sicuro');
  console.log('3. Validare input esterni con Zod');
  console.log('4. Aggiungere test per la nuova implementazione\n');

} catch (error) {
  console.error('\n❌ Errore durante la preparazione:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} 
 