/**
 * @file track-vitest-migration.ts
 * @description Script per tracciare la migrazione dei test da Jest a Vitest
 * @author AI1 | Jarvis MAS v1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// Test già migrati con successo
const migratedTests = [
  'webview-ui/src/__tests__/components/RetryPanel.test.tsx',
  'webview-ui/src/__tests__/components/AgentTogglePanel.test.tsx',
  'webview-ui/src/__tests__/components/MASMemoryPanel.test.tsx',
  'src/mas/agent/__tests__/mas-dispatcher.toggle.test.ts',
  'src/__tests__/mas/provider-score-manager.test.ts'
];

// Directories principali dove cercare i test
const testDirectories = [
  'src/__tests__',
  'src/mas',
  'src/providers/__tests__',
  'webview-ui/src/__tests__',
  'src/test'
];

// Elenco di pattern che indicano l'uso di Jest
const jestPatterns = [
  /jest\.\w+\(/,
  /import.*from ['"](jest|@jest)/,
  /beforeAll\(/,
  /afterAll\(/
];

// Elenco di pattern che indicano l'uso di Vitest
const vitestPatterns = [
  /import.*from ['"]vitest['"]/,
  /import.*\{ ?vi ?.*\}.*from/,
];

// Ricerca dei file di test in modo sincrono
function findTestFiles(directories: string[]): string[] {
  const testFiles: string[] = [];
  
  function searchDir(dir: string): void {
    try {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        
        try {
          const stats = fs.statSync(entryPath);
          
          if (stats.isDirectory()) {
            if (!entry.includes('node_modules') && 
                !entry.includes('dist') && 
                !entry.includes('.git')) {
              searchDir(entryPath);
            }
          } else if (entry.endsWith('.test.ts') || 
                    entry.endsWith('.test.tsx') ||
                    entry.endsWith('.test.js') ||
                    entry.endsWith('.spec.ts')) {
            testFiles.push(entryPath);
          }
        } catch (err) {
          console.error(`Errore accedendo a ${entryPath}`);
        }
      }
    } catch (err) {
      console.error(`Errore nella lettura della directory ${dir}`);
    }
  }
  
  for (const dir of directories) {
    searchDir(dir);
  }
  
  return testFiles;
}

// Analizza un singolo file in modo sincrono
function analyzeTestFile(filePath: string): { isJest: boolean, isVitest: boolean } | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const hasJestCode = jestPatterns.some(pattern => pattern.test(content));
    const hasVitestCode = vitestPatterns.some(pattern => pattern.test(content));
    
    if (!hasJestCode && !hasVitestCode) {
      // Cerca import di funzioni di test per determinare il tipo
      if (content.includes('import') && 
          (content.includes('describe') || content.includes('test') || content.includes('expect'))) {
        // Se importa funzioni ma non specifica jest o vitest, assumiamo jest per sicurezza
        return { isJest: true, isVitest: false };
      }
      return null;
    }
    
    return {
      isJest: hasJestCode && !hasVitestCode,
      isVitest: hasVitestCode,
    };
  } catch (err) {
    console.error(`Errore nell'analisi di ${filePath}`);
    return null;
  }
}

// Metodo principale
function main() {
  console.log('Ricerca dei file di test nelle directory principali...');
  const testFiles = findTestFiles(testDirectories);
  console.log(`Trovati ${testFiles.length} file di test`);
  
  // Visualizza un progress bar semplice
  console.log('Analisi dei file in corso...');
  
  const results = [];
  let jestCount = 0;
  let vitestCount = 0;
  let hybridCount = 0;
  let progressCounter = 0;
  
  for (const file of testFiles) {
    progressCounter++;
    if (progressCounter % 10 === 0) {
      process.stdout.write(`\rAnalizzati ${progressCounter}/${testFiles.length} file...`);
    }
    
    const result = analyzeTestFile(file);
    if (!result) continue;
    
    if (result.isJest && !result.isVitest) {
      jestCount++;
      results.push({ path: file, type: 'jest' });
    } else if (result.isVitest && !result.isJest) {
      vitestCount++;
      results.push({ path: file, type: 'vitest' });
    } else if (result.isJest && result.isVitest) {
      hybridCount++;
      results.push({ path: file, type: 'hybrid' });
    }
  }
  
  console.log('\n\n===== RIEPILOGO MIGRAZIONE JEST → VITEST =====');
  console.log(`✅ File Vitest: ${vitestCount}`);
  console.log(`❌ File Jest: ${jestCount}`);
  console.log(`⚠️ File ibridi: ${hybridCount}`);
  console.log(`📈 Progresso: ${Math.round(vitestCount / (vitestCount + jestCount + hybridCount) * 100)}%`);
  
  // Esempi di file Jest da migrare (mostra max 10)
  const jestFiles = results.filter(r => r.type === 'jest');
  console.log('\n----- ESEMPIO FILE JEST DA MIGRARE -----');
  jestFiles.slice(0, 10).forEach(f => console.log(`❌ ${f.path}`));
  
  // File ibridi
  const hybridFiles = results.filter(r => r.type === 'hybrid');
  if (hybridFiles.length > 0) {
    console.log('\n----- FILE IBRIDI DA VERIFICARE -----');
    hybridFiles.forEach(f => console.log(`⚠️ ${f.path}`));
  }
  
  // Scrive un report in formato Markdown
  const reportContent = `# Report Migrazione Jest → Vitest

## Riepilogo
- ✅ File Vitest: ${vitestCount}
- ❌ File Jest: ${jestCount}
- ⚠️ File ibridi: ${hybridCount}
- 📈 Progresso: ${Math.round(vitestCount / (vitestCount + jestCount + hybridCount) * 100)}%

## File Jest da migrare
${jestFiles.map(f => `- ${f.path}`).join('\n')}

## File ibridi da verificare
${hybridFiles.map(f => `- ${f.path}`).join('\n')}
`;

  const reportFileName = 'vitest-migration-report.md';
  fs.writeFileSync(reportFileName, reportContent, 'utf-8');
  console.log(`\nReport completo scritto su ${reportFileName}`);
  
  console.log('\n===== COMANDO SUGGERITO =====');
  console.log('Esegui questo comando per convertire i file Jest in Vitest:');
  console.log('pnpm exec jscodeshift -t node_modules/jest-migrate/lib/transforms/jest-globals-transform.js <file>');
}

main(); 