import { Project, SyntaxKind, Node } from "ts-morph"; // Importo anche Node
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  // Aggiungo skipAddingFilesFromTsConfig per caricare solo i file richiesti
  skipAddingFilesFromTsConfig: true,
});

// Aggiungo i file sorgente manualmente per maggior controllo
project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

const SOURCE_IMPORT_MAP: Record<string, string> = {
  "types/chat.types": "shared/types/chat.types",
  "types/ChatMessage": "shared/types/chat.types", // Aggiungo mapping per vecchio file ChatMessage.ts
  "types/message.types": "shared/types/chat.types", // Accorpato in chat.types
  "types/llm.types": "shared/types/llm.types",
  "types/api.types": "shared/types/api.types",
  "types/providers.types": "shared/types/providers.types",
  "types/common": "shared/types/common",
  "types/global": "shared/types/global", // Mappo anche global
  "shared/types/message": "shared/types/chat.types", // Mappo vecchio message.ts a chat.types per createChatMessage
};

const IMPORT_RENAME: Record<string, string> = {
  createSafeMessage: "createChatMessage",
};

const log = (msg: string) => console.log(`\x1b[36m🔧 ${msg}\x1b[0m`); // Aggiungo colore per leggibilità
const logError = (msg: string) => console.error(`\x1b[31m❌ ${msg}\x1b[0m`);

let changedFiles = 0;
let processedFiles = 0;

log("Inizio refactoring import e chiamate...");

project.getSourceFiles().forEach((sourceFile) => {
  processedFiles++;
  let didModify = false;
  const filePath = sourceFile.getFilePath();

  try {
    // 1. Replace import paths
    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const oldModuleSpecifier = importDecl.getModuleSpecifierValue();
      let newModuleSpecifier = oldModuleSpecifier;

      for (const [oldPathFragment, newPathFragment] of Object.entries(SOURCE_IMPORT_MAP)) {
        // Cerco corrispondenze relative e assolute (con /src/ o senza)
        const relativeOldPath = `/${oldPathFragment}`;
        const absoluteOldPath = `/src/${oldPathFragment}`;
        const relativeNewPath = `/src/${newPathFragment}`;

        if (newModuleSpecifier.includes(relativeOldPath) || newModuleSpecifier.includes(absoluteOldPath)) {
            // Provo a costruire un path relativo corretto
            const targetPath = path.resolve(project.getRootDirectories()[0].getPath(), `src/${newPathFragment}.ts`);
            const relativePath = path.relative(path.dirname(filePath), targetPath).replace(/\\/g, '/').replace(/\.ts$/, '');
            const finalNewPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

            log(`🔄 [${sourceFile.getBaseName()}] Aggiorno import: "${oldModuleSpecifier}" -> "${finalNewPath}"`);
            importDecl.setModuleSpecifier(finalNewPath);
            newModuleSpecifier = finalNewPath; // Aggiorno per controlli successivi
            didModify = true;
            break; // Esco dal loop interno una volta trovato un match
        }
      }

      // 2. Rename named imports (createSafeMessage → createChatMessage)
      importDecl.getNamedImports().forEach((namedImport) => {
        const name = namedImport.getName();
        if (IMPORT_RENAME[name]) {
          const alias = namedImport.getAliasNode()?.getText();
          const newName = IMPORT_RENAME[name];
          if (alias) {
             log(`✏️ [${sourceFile.getBaseName()}] Rinomino alias import: ${alias} (era ${name}) -> ${newName}`);
             namedImport.setName(newName); // Rinomino l'import originale
             // L'alias rimane lo stesso ma punta al nuovo nome
          } else {
             log(`✏️ [${sourceFile.getBaseName()}] Rinomino import: ${name} -> ${newName}`);
             namedImport.renameAlias(newName); // Aggiungo alias per sicurezza se il nome è usato altrove
             namedImport.setName(newName);
          }
          didModify = true;

          // Assicurati che l'import di createChatMessage punti al file corretto
          if (newName === 'createChatMessage' && !newModuleSpecifier.includes('shared/types/chat.types')) {
            const targetPath = path.resolve(project.getRootDirectories()[0].getPath(), `src/shared/types/chat.types.ts`);
            const relativePath = path.relative(path.dirname(filePath), targetPath).replace(/\\/g, '/').replace(/\.ts$/, '');
            const finalNewPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
            log(` Forced import path for ${newName} to: ${finalNewPath}`);
            importDecl.setModuleSpecifier(finalNewPath);
          }
        }
      });
    });

    // 3. Replace function calls (createSafeMessage → createChatMessage)
    sourceFile.forEachDescendant((node) => {
      if (Node.isCallExpression(node)) {
        const expression = node.getExpression();
        if (Node.isIdentifier(expression)) {
          const name = expression.getText();
          if (IMPORT_RENAME[name]) {
            const newName = IMPORT_RENAME[name];
            log(`📞 [${sourceFile.getBaseName()}] Aggiorno chiamata funzione: ${name}() -> ${newName}() (Linea: ${node.getStartLineNumber()})`);
            expression.replaceWithText(newName);
            didModify = true;
          }
        }
      }
    });

    // 4. Save if any changes made
    if (didModify) {
      sourceFile.saveSync();
      changedFiles++;
      log(`💾 [${sourceFile.getBaseName()}] Salvato.`);
    }
  } catch (error: unknown) {
     logError(`Errore durante processamento ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
     // Considera se fermare lo script o continuare
  }
});

log(`✅ Refactoring completato! ${processedFiles} file processati, ${changedFiles} file modificati.`); 