#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const fast_glob_1 = __importDefault(require("fast-glob"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
// Determine the root path of the project 
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path_1.default.join(ROOT_DIR, 'tsconfig.json');
// Controlla se è in modalità check (dry run)
const isDryRun = process.argv.includes('--check');
console.log(`Project root: ${ROOT_DIR}`);
console.log(`Using tsconfig: ${TSCONFIG_PATH}`);
// Verifica che il file tsconfig.json esista
if (!fs_1.default.existsSync(TSCONFIG_PATH)) {
    console.error(chalk_1.default.red(`Il file tsconfig.json non è stato trovato in ${TSCONFIG_PATH}`));
    process.exit(1);
}
// 1. Setup progetto
const project = new ts_morph_1.Project({
    tsConfigFilePath: TSCONFIG_PATH,
});
// 2. Trova i file candidati
const filesToTransform = process.argv.includes('--test-only')
    ? [path_1.default.join(ROOT_DIR, 'test/test-messages.ts')]
    : fast_glob_1.default.sync(['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'], {
        ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
        cwd: ROOT_DIR,
    });
console.log(`Found ${filesToTransform.length} files to analyze`);
let transformedCount = 0;
let issuesFound = 0;
// Funzione per trasformare un oggetto letterale in createSafeMessage
function transformObjectLiteral(objLiteral) {
    // Check for message objects with role and content properties
    const properties = objLiteral.getProperties()
        .filter(p => p.getKind() === ts_morph_1.SyntaxKind.PropertyAssignment);
    // Extract role and content properties
    const role = properties.find(p => p.getName() === 'role');
    const content = properties.find(p => p.getName() === 'content');
    // Check if this looks like a chat message (has role and content)
    if (!role || !content) {
        return undefined;
    }
    // Get the text values
    const roleText = role.getInitializer()?.getText();
    const contentText = content.getInitializer()?.getText();
    if (!roleText || !contentText) {
        return undefined;
    }
    // Create options object from remaining properties
    const remainingProps = properties
        .filter(p => p.getName() !== 'role' && p.getName() !== 'content')
        .map(p => `${p.getName()}: ${p.getInitializer()?.getText()}`);
    return `createSafeMessage({role: ${roleText}, content: ${contentText}${remainingProps.length ? ', ' + remainingProps.join(', ') : ''}})`;
}
async function processFiles(sourceFiles, isDryRun) {
    let modifiedCount = 0;
    let errorCount = 0;
    for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        try {
            const modified = processSourceFile(sourceFile, filePath, isDryRun);
            if (modified) {
                modifiedCount++;
            }
        }
        catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            errorCount++;
        }
    }
    console.log(`\nProcess completed:`);
    console.log(`${modifiedCount} files ${isDryRun ? 'would be' : 'were'} modified`);
    if (errorCount > 0) {
        console.log(`${errorCount} files had errors`);
    }
}
function processSourceFile(sourceFile, filePath, dryRun) {
    let modified = false;
    let transformCount = 0;
    try {
        // Take a snapshot of all object literals first
        const objectLiterals = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
        // Convert to array of objects with their text and position to avoid reference issues
        const literals = objectLiterals.map(objLiteral => ({
            text: objLiteral.getText(),
            pos: objLiteral.getPos(),
            end: objLiteral.getEnd(),
            node: objLiteral
        }));
        // Process each literal
        for (const literal of literals) {
            try {
                const replacement = transformObjectLiteral(literal.node);
                if (replacement) {
                    if (dryRun) {
                        console.log(`Would transform in ${filePath}:`);
                        console.log(`  - From: ${literal.text}`);
                        console.log(`  - To:   ${replacement}`);
                    }
                    else {
                        literal.node.replaceWithText(replacement);
                    }
                    modified = true;
                    transformCount++;
                }
            }
            catch (error) {
                console.error(`Error transforming literal in ${filePath}:`, error instanceof Error ? error.message : error);
                console.error(`Literal text: ${literal.text}`);
            }
        }
        // If modifications were made, add the createSafeMessage import if needed
        if (modified && !dryRun) {
            // Check if we need to add an import statement
            const hasCreateSafeMessageImport = sourceFile.getImportDeclarations().some(importDecl => {
                const namedImports = importDecl.getNamedImports();
                return namedImports.some(namedImport => namedImport.getName() === 'createSafeMessage');
            });
            if (!hasCreateSafeMessageImport) {
                // Add the import at the top of the file
                // Need to determine the correct relative path based on the file's location
                const fileDirname = path_1.default.dirname(filePath);
                const relativePath = path_1.default.relative(fileDirname, path_1.default.join(ROOT_DIR, 'src/shared/types'));
                const moduleSpecifier = relativePath.replace(/\\/g, '/') + '/message';
                try {
                    sourceFile.addImportDeclaration({
                        moduleSpecifier,
                        namedImports: [{ name: 'createSafeMessage' }]
                    });
                    console.log(`Added createSafeMessage import to ${filePath}`);
                }
                catch (error) {
                    console.error(`Failed to add import to ${filePath}:`, error);
                }
            }
            try {
                sourceFile.saveSync();
                console.log(`Updated: ${filePath} (${transformCount} transformations)`);
            }
            catch (error) {
                console.error(`Failed to save ${filePath}:`, error);
                modified = false;
            }
        }
        if (modified) {
            transformationCount += transformCount;
        }
        return modified;
    }
    catch (error) {
        console.error(`Error processing file ${filePath}:`, error instanceof Error ? error.message : error);
        return false;
    }
}
// Processa tutti i file
let successCount = 0;
let failureCount = 0;
let transformationCount = 0;
for (const filePath of filesToTransform) {
    try {
        const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
        const fileModified = processSourceFile(sourceFile, filePath, isDryRun);
        if (fileModified) {
            successCount++;
        }
        if (isDryRun && fileModified) {
            issuesFound++;
            console.log(chalk_1.default.yellow('⚠️ Needs refactoring:'), path_1.default.relative(process.cwd(), filePath));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error processing ${filePath}:`), error instanceof Error ? error.message : error);
        failureCount++;
    }
}
// Stampa risultato finale
if (isDryRun) {
    console.log(chalk_1.default.cyanBright(`\n🔍 Check completato. File che necessitano refactoring: ${issuesFound}\n`));
    if (issuesFound > 0) {
        console.log(chalk_1.default.yellow(`Per eseguire il refactoring, rimuovi il flag --check ed esegui:`));
        console.log(`  pnpm refactor:chat\n`);
        process.exit(1); // Fallisci in modalità check se ci sono problemi
    }
    else {
        console.log(chalk_1.default.green(`✅ Nessun refactoring necessario!\n`));
        process.exit(0);
    }
}
else {
    console.log(chalk_1.default.cyanBright(`\n🏁 Refactoring completato. File modificati: ${successCount}, trasformazioni: ${transformationCount}\n`));
    if (failureCount > 0) {
        console.log(chalk_1.default.yellow(`⚠️ ${failureCount} file hanno generato errori durante il processo`));
    }
}
