/**
 * @file cleanup-jest.ts
 * @description Script per rimuovere i file di test Jest legacy e configurare Vitest
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// File di configurazione Jest da rimuovere
const jestConfigFiles = [
  'jest.config.cjs',
  'jest.config.js',
  'jest.setup.cjs',
  'jest.setup.js',
];

// File da convertire da Jest a Vitest
async function findJestTestFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  const results: string[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      const nestedFiles = await findJestTestFiles(filePath);
      results.push(...nestedFiles);
    } else if (
      (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.test.js')) &&
      !file.includes('vitest')
    ) {
      // Verifica se il file contiene riferimenti a Jest
      const content = await readFile(filePath, 'utf-8');
      if (content.includes('jest.') || content.includes('beforeEach(') || content.includes('test(')) {
        results.push(filePath);
      }
    }
  }

  return results;
}

// Rimuovi i file di configurazione Jest
async function removeJestConfigFiles() {
  console.log('Rimozione dei file di configurazione Jest...');
  
  for (const configFile of jestConfigFiles) {
    const filePath = path.join(process.cwd(), configFile);
    
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        console.log(`✓ Rimosso: ${configFile}`);
      }
    } catch (error) {
      console.error(`✗ Errore durante la rimozione di ${configFile}:`, error);
    }
  }
}

// Aggiorna le dipendenze nel package.json
async function updatePackageJson() {
  console.log('Aggiornamento package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Rimuovi Jest dalle dipendenze
    if (packageJson.dependencies && packageJson.dependencies.jest) {
      delete packageJson.dependencies.jest;
    }
    
    if (packageJson.devDependencies) {
      // Rimuovi Jest dalle devDependencies
      const jestDeps = Object.keys(packageJson.devDependencies).filter(
        dep => dep.startsWith('jest') || dep.startsWith('@jest/')
      );
      
      for (const dep of jestDeps) {
        delete packageJson.devDependencies[dep];
      }
      
      // Assicurati che Vitest sia nelle devDependencies
      if (!packageJson.devDependencies.vitest) {
        packageJson.devDependencies.vitest = "^3.0.0";
      }
    }
    
    // Aggiorna gli script
    if (packageJson.scripts) {
      // Sostituisci gli script Jest con Vitest
      for (const [scriptName, scriptCmd] of Object.entries(packageJson.scripts)) {
        if (typeof scriptCmd === 'string' && scriptCmd.includes('jest')) {
          packageJson.scripts[scriptName] = scriptCmd.replace(/jest/g, 'vitest');
        }
      }
    }
    
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    console.log('✓ package.json aggiornato');
  } catch (error) {
    console.error('✗ Errore durante l\'aggiornamento di package.json:', error);
  }
}

// Principale
async function main() {
  console.log('Iniziando la pulizia dei file Jest...');
  
  // Rimuovi i file di configurazione
  await removeJestConfigFiles();
  
  // Trova e stampa la lista dei file di test Jest
  const testFiles = await findJestTestFiles(path.join(process.cwd(), 'src'));
  console.log(`Trovati ${testFiles.length} file di test Jest da convertire:`);
  
  testFiles.forEach(file => {
    console.log(`- ${path.relative(process.cwd(), file)}`);
  });
  
  // Aggiorna package.json
  await updatePackageJson();
  
  console.log('Operazione completata. Per convertire i test da Jest a Vitest, esegui:');
  console.log('pnpm exec jscodeshift -t node_modules/jest-migrate/lib/transforms/jest-globals-transform.js <file>');
}

main().catch(console.error); 