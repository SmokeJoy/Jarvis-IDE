#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script semplificato per testare l'agente Jarvis da riga di comando
 */
async function main() {
  console.log('🤖 Jarvis Agent CLI - Test semplificato');
  console.log('--------------------------------------------------');
  
  try {
    // Prompt utente
    const userPrompt = process.argv[2] || 'Crea un file di test TypeScript';
    console.log(`📝 Prompt: "${userPrompt}"`);
    
    // Percorso del workspace
    const workspacePath = process.cwd();
    
    // Leggi alcuni file TypeScript per contestualizzare (simulazione semplificata)
    const projectContext = await readProjectFiles(workspacePath);
    console.log(`📂 Letti ${projectContext.numFiles} file per il contesto`);
    
    // Crea un file di test di esempio (simulando la risposta dell'LLM)
    const testFilePath = path.join(workspacePath, 'src', 'test', 'AgentTest.ts');
    const testFileContent = `
/**
 * File di test creato dall'agente Jarvis
 * Prompt: ${userPrompt}
 * Data: ${new Date().toISOString()}
 */
import { describe, it, expect } from 'vitest';

describe('Jarvis Agent Test', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });
  
  it('should correctly add numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
`;
    
    // Assicura che la directory esista
    const testDir = path.dirname(testFilePath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Scrivi il file
    fs.writeFileSync(testFilePath, testFileContent, 'utf-8');
    
    console.log('\n✅ Test completato!');
    console.log('--------------------------------------------------');
    console.log(`📄 File creato: ${testFilePath}`);
    console.log('\nContenuto:');
    console.log(testFileContent);
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione del test:', error);
    process.exit(1);
  }
}

/**
 * Legge alcuni file del progetto per simulare il contesto
 */
async function readProjectFiles(dir: string): Promise<{numFiles: number}> {
  try {
    let numFiles = 0;
    
    // Funzione ricorsiva per attraversare le directory
    const processDirectory = (currentDir: string, depth = 0) => {
      if (depth > 2) return; // Limita la profondità di ricorsione
      
      if (
        currentDir.includes('node_modules') ||
        currentDir.includes('.git') ||
        currentDir.includes('dist')
      ) {
        return;
      }
      
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            processDirectory(fullPath, depth + 1);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            // Conta solo i file TypeScript/TSX
            numFiles++;
          }
        }
      } catch (error) {
        console.error(`Errore nell'accesso alla directory ${currentDir}:`, error);
      }
    };
    
    // Inizia la ricorsione
    processDirectory(dir);
    
    return { numFiles };
  } catch (error) {
    console.error('Errore nella lettura dei file del progetto:', error);
    return { numFiles: 0 };
  }
}

// Esegui lo script
main().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
}); 