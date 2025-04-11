# Documentazione Master TypeScript per AI

## Indice Generale
1. [Introduzione a TypeScript](#introduzione)
2. [Tipi Primitivi](#tipi-primitivi)
3. [Tipi Avanzati](#tipi-avanzati)
4. [Funzioni Tipizzate](#funzioni)
5. [Oggetti e Strutture Complesse](#oggetti)
6. [Classi e OOP](#classi)
7. [Generics](#generics)
8. [Utility Types](#utility-types)
9. [Type Guards](#type-guards)
10. [Moduli e Namespace](#moduli)
11. [Decoratori](#decoratori)
12. [Configurazione](#configurazione)
13. [Interoperabilità JS](#interoperabilità)
14. [Best Practices](#best-practices)
15. [Errori Comuni](#errori)
16. [Tooling](#tooling)
17. [Testing](#testing)
18. [Framework](#framework)
19. [AI Integration](#ai-integration)
20. [Glossario](#glossario)

## 1. Introduzione a TypeScript <a name="introduzione"></a>
TypeScript estende JavaScript aggiungendo:
- Tipizzazione statica opzionale
- Supporto OOP avanzato
- Tooling migliorato

**Esempio progetto esistente:**
```ts
// Esempio reale dal progetto (fix-imports.ts)
interface ImportCorrection {
  oldPath: string;
  newPath: string;
  lineNumber: number;
  errorType: 'missing_extension' | 'type_import' | 'double_extension';
}

// Esempio di funzione tipizzata con generics
export function parseArguments<T extends ProgramOptions>(args: string[]): T {
  const options: Partial<T> = {};
  // Implementazione completa con validazione tipo-safe
}
```

## 2. Tipi Primitivi <a name="tipi-primitivi"></a>
```ts
// Allineato alla policy di type safety
declare let fileName: string;
declare let errorCount: number;
declare let isMigrationComplete: boolean;
```

## 14. Best Practices <a name="best-practices"></a>
- Usare `strict: true` in tsconfig.json
- Preferire interfacce rispetto a type alias per gli oggetti
- Utilizzare utility types per manipolazioni complesse

## 19. AI Integration <a name="ai-integration"></a>
### Pattern per comprensione del codice:
```ts
interface CodeAnalysisContext {
  ast: ASTNode;
  typeChecker: TypeChecker;
  semanticPatterns: Record<string, TypePattern>;
}

function analyzeTypeScript(code: string): CodeAnalysisContext {
  // Implementazione reale da fix-imports.ts
export async function processFile(
  filePath: string,
  checkOnly: boolean,
  verbose: boolean
): Promise<FileResult> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let newContent = content;
    
    // Regex con type annotation
    const IMPORT_REGEX: RegExp = /from\s+['"]([^'"]*?)(?:\.js)?['"]/g;
    
    // Elaborazione type-safe
    return {
      path: filePath,
      modified: !checkOnly && newContent !== content,
      importFixCount: /*...*/,
      typeImportFixCount: /*...*/,
      doubleJsFixCount: /*...*/
    };
  } catch (error) {
    throw new Error(`Errore processando ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
}
```

[Vedi Politiche Script](../scripts/script-policy.md) | [Esempi Pratici](../src/scripts/fix-imports.ts)