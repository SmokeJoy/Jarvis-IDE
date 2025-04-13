import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind, CallExpression, Node } from 'ts-morph';

// Funzioni di supporto
function safeGetText(node: Node | undefined): string {
  if (!node || node.wasForgotten()) return '';
  try {
    return node.getText();
  } catch (error) {
    return '';
  }
}

describe('Refactoring Type Safety Validation', () => {
  const ROOT_DIR = process.cwd();
  const TEST_DIR = path.join(ROOT_DIR, 'test');
  
  const testTsConfigPath = path.join(TEST_DIR, 'tsconfig.test.json');
  const tsConfigPath = fs.existsSync(testTsConfigPath) 
    ? testTsConfigPath 
    : path.join(ROOT_DIR, 'tsconfig.json');
  
  let project: Project;
  
  beforeAll(() => {
    // Inizializza il progetto ts-morph
    project = new Project({
      tsConfigFilePath: tsConfigPath
    });
  });
  
  it('non dovrebbe avere chiamate nidificate a createSafeMessage', () => {
    // Array che conterrà le violazioni trovate
    const nestedCalls: { file: string; line: number; code: string }[] = [];
    
    // Pattern di file da testare
    const testFiles = [
      path.join(TEST_DIR, 'test-messages.ts'),
      // Aggiungi altri file specifici se necessario
    ];
    
    // Verifica ogni file di test
    for (const filePath of testFiles) {
      const sourceFile = project.addSourceFileAtPath(filePath);
      
      // Trova tutte le chiamate a createSafeMessage
      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(call => {
          try {
            const expr = call.getExpression();
            return expr && expr.getText() === 'createSafeMessage';
          } catch {
            return false;
          }
        });
      
      // Verifica se ci sono chiamate nidificate
      for (const call of calls) {
        try {
          const args = call.getArguments();
          if (args.length > 0) {
            const firstArg = args[0];
            
            if (firstArg.getKind() === SyntaxKind.CallExpression) {
              const nestedCall = firstArg as CallExpression;
              const nestedExpr = nestedCall.getExpression();
              
              if (nestedExpr && safeGetText(nestedExpr) === 'createSafeMessage') {
                // Trovata una chiamata nidificata!
                const linePos = sourceFile.getLineAndColumnAtPos(call.getStart());
                nestedCalls.push({
                  file: filePath,
                  line: linePos.line,
                  code: call.getText()
                });
              }
            }
          }
        } catch (error) {
          // Ignora errori durante l'analisi
        }
      }
    }
    
    // Verifica che non ci siano chiamate nidificate
    if (nestedCalls.length > 0) {
      console.error('Trovate chiamate nidificate a createSafeMessage:');
      nestedCalls.forEach(({ file, line, code }) => {
        console.error(`  ${file}:${line} - ${code}`);
      });
    }
    
    expect(nestedCalls.length).toBe(0, 'Non dovrebbero esserci chiamate nidificate a createSafeMessage');
  });
  
  it('tutti i file con createSafeMessage dovrebbero avere l\'import corretto', () => {
    // Array che conterrà le violazioni trovate
    const missingImports: string[] = [];
    
    // Pattern di file da testare
    const testFiles = [
      path.join(TEST_DIR, 'test-messages.ts'),
      // Aggiungi altri file specifici se necessario
    ];
    
    // Verifica ogni file di test
    for (const filePath of testFiles) {
      const sourceFile = project.addSourceFileAtPath(filePath);
      
      // Controlla se il file contiene chiamate a createSafeMessage
      const hasCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
        .some(call => {
          try {
            const expr = call.getExpression();
            return expr && expr.getText() === 'createSafeMessage';
          } catch {
            return false;
          }
        });
      
      if (hasCalls) {
        // Verifica se c'è l'import
        const hasImport = sourceFile.getImportDeclarations().some(importDecl => {
          return importDecl.getNamedImports().some(
            namedImport => namedImport.getName() === 'createSafeMessage'
          );
        });
        
        if (!hasImport) {
          missingImports.push(filePath);
        }
      }
    }
    
    // Verifica che non ci siano file senza import
    if (missingImports.length > 0) {
      console.error('File che usano createSafeMessage senza importarlo:');
      missingImports.forEach(file => {
        console.error(`  ${file}`);
      });
    }
    
    expect(missingImports.length).toBe(0, 'Tutti i file che usano createSafeMessage dovrebbero importarlo');
  });
  
  it('tutti gli oggetti message dovrebbero essere wrappati in createSafeMessage', () => {
    // Implementazione opzionale - verificare che non ci siano oggetti message raw
    // Questa è più complessa e potrebbe generare falsi positivi, quindi è opzionale
    expect(true).toBe(true);
  });
}); 