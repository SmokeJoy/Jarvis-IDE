/**
 * Test di integrazione per fix-imports.ts
 * 
 * Questi test verificano che lo script fix-imports.ts funzioni correttamente
 * in scenari realistici utilizzando directory temporanee per evitare modifiche
 * al filesystem reale.
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { processFile, getFilesToProcess } from './fix-imports'; // Corretto il percorso di importazione
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const TEMP_DIR = join(__dirname, '..', '..', 'temp-test-imports');

describe('Fix-Imports Integration Tests', () => {
  let tempDir: string;

  // Prepara una directory temporanea per i test
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `fix-imports-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  // Pulizia dopo i test
  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Errore nella pulizia della directory temporanea:', error);
    }
  });

  /**
   * Helper per creare un file temporaneo con il contenuto specificato
   */
  async function createTempFile(filename: string, content: string): Promise<string> {
    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  test('Dovrebbe processare correttamente un file TypeScript con import da correggere', async () => {
    // Crea un file TypeScript con import relativi senza estensione .js
    const content = `
      import { Component } from 'react';
      import { helper } from './utils/helper';
      import { Button } from '../components/Button';
      import type { Props } from './types';
    `;
    
    const filePath = await createTempFile('test.ts', content);
    
    // Processa il file
    const result = await processFile(filePath, false, false);
    
    // Verifica i risultati
    expect(result.modified).toBe(true);
    expect(result.importFixCount).toBe(2);
    
    // Verifica il contenuto del file modificato
    const updatedContent = await fs.readFile(filePath, 'utf8');
    expect(updatedContent).toContain("import { helper } from './utils/helper.js';");
    expect(updatedContent).toContain("import { Button } from '../components/Button.js';");
    expect(updatedContent).toContain("import { Component } from 'react';"); // Non modificato
  });

  test('Dovrebbe gestire correttamente una directory con sottodirectory', async () => {
    // Crea una struttura di directory con file TypeScript
    const subDir = path.join(tempDir, 'subdir');
    await fs.mkdir(subDir, { recursive: true });
    
    // File nella directory principale
    await createTempFile('main.ts', "import { util } from './util';");
    
    // File nella sottodirectory
    await createTempFile('subdir/util.ts', "export const util = () => 'hello';");
    
    // Ottieni i file da processare
    const filesToProcess = await getFilesToProcess([tempDir]);
    
    // Verifica che entrambi i file siano stati trovati
    expect(filesToProcess.length).toBe(2);
    expect(filesToProcess.some(file => file.endsWith('main.ts'))).toBe(true);
    expect(filesToProcess.some(file => file.endsWith('util.ts'))).toBe(true);
    
    // Processa tutti i file
    for (const file of filesToProcess) {
      await processFile(file, false, false);
    }
    
    // Verifica che il file principale sia stato aggiornato
    const mainContent = await fs.readFile(path.join(tempDir, 'main.ts'), 'utf8');
    expect(mainContent).toContain("import { util } from './util.js';");
  });

  test('Dovrebbe ignorare file non TypeScript', async () => {
    // Crea diversi tipi di file
    await createTempFile('file.ts', "import { a } from './b';");
    await createTempFile('file.js', "import { a } from './b';");
    await createTempFile('file.txt', "Non TypeScript");
    
    // Ottieni i file da processare
    const filesToProcess = await getFilesToProcess([tempDir]);
    
    // Verifica che solo il file .ts sia stato trovato
    expect(filesToProcess.length).toBe(1);
    expect(filesToProcess[0].endsWith('file.ts')).toBe(true);
  });

  test('Dovrebbe correggere import di tipo quando necessario', async () => {
    // Crea un file con import di tipo che dovrebbero essere corretti
    const content = `
      import { Component } from 'react';
      import { UserType } from './types';
      import { ButtonProps } from '../components/Button';
    `;
    
    const filePath = await createTempFile('typeTest.ts', content);
    
    // Processa il file
    const result = await processFile(filePath, false, true);
    
    // Verifica il contenuto aggiornato
    const updatedContent = await fs.readFile(filePath, 'utf8');
    
    // Controlla che gli import appropriati siano stati convertiti in import type
    expect(updatedContent).toContain("import type { UserType }");
    expect(updatedContent).toContain("import type { ButtonProps }");
    expect(updatedContent).toContain("import { Component } from 'react';"); // Non modificato
  });

  test('Dovrebbe correggere le estensioni .js.js duplicate', async () => {
    // Crea un file con import contenenti estensioni .js.js duplicate
    const content = `
      import { Component } from 'react';
      import { helper } from './utils/helper.js.js';
      import { Button } from '../components/Button.js.js';
    `;
    
    const filePath = await createTempFile('doubleJsTest.ts', content);
    
    // Processa il file
    const result = await processFile(filePath, false, false);
    
    // Verifica i risultati
    expect(result.modified).toBe(true);
    expect(result.doubleJsFixCount).toBe(2);
    
    // Verifica il contenuto aggiornato
    const updatedContent = await fs.readFile(filePath, 'utf8');
    
    // Verifica che le estensioni doppie siano state corrette
    expect(updatedContent).toContain("import { helper } from './utils/helper.js';");
    expect(updatedContent).toContain("import { Button } from '../components/Button.js';");
    expect(updatedContent).toContain("import { Component } from 'react';"); // Non modificato
  });

  test('Non dovrebbe modificare file in modalità check', async () => {
    // Crea un file con import da correggere
    const content = `
      import { helper } from './utils/helper';
      import { Button } from '../components/Button';
    `;
    
    const filePath = await createTempFile('checkTest.ts', content);
    const originalContent = content;
    
    // Processa il file in modalità check
    const result = await processFile(filePath, true, false);
    
    // Verifica che il file risulti modificabile ma non sia stato effettivamente modificato
    expect(result.modified).toBe(true);
    expect(result.importFixCount).toBe(2);
    
    // Verifica che il contenuto non sia stato cambiato
    const currentContent = await fs.readFile(filePath, 'utf8');
    expect(currentContent).toBe(originalContent);
    
    // Riprocessa senza check e verifica che ora venga modificato
    await processFile(filePath, false, false);
    const updatedContent = await fs.readFile(filePath, 'utf8');
    expect(updatedContent).not.toBe(originalContent);
  });
});

// Helper per leggere il contenuto dei file
import { readFile } from 'fs/promises'; 