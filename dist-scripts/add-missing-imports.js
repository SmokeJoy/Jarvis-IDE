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
const utils_js_1 = require("./utils.js");
// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path_1.default.join(ROOT_DIR, 'tsconfig.json');
const SHARED_TYPES_PATH = path_1.default.join(ROOT_DIR, 'src/shared/types');
// Modalità dry run (controlla senza applicare modifiche)
const isDryRun = process.argv.includes('--check');
const targetDir = process.argv[2] || '';
console.log(`Project root: ${ROOT_DIR}`);
console.log(`Using tsconfig: ${TSCONFIG_PATH}`);
console.log(`Shared types path: ${SHARED_TYPES_PATH}`);
console.log(`Target directory: ${targetDir || 'all'}`);
console.log(`Mode: ${isDryRun ? 'check only' : 'fix'}`);
// Verifica il tsconfig
if (!fs_1.default.existsSync(TSCONFIG_PATH)) {
    console.error(chalk_1.default.red(`tsconfig.json non trovato in ${TSCONFIG_PATH}`));
    process.exit(1);
}
// Setup progetto
const project = new ts_morph_1.Project({
    tsConfigFilePath: TSCONFIG_PATH,
});
// Pattern glob per la ricerca
const pattern = targetDir
    ? [`${targetDir}/**/*.ts`, `${targetDir}/**/*.tsx`]
    : ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'];
// Trova i file
const filesToCheck = fast_glob_1.default.sync(pattern, {
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
    cwd: ROOT_DIR,
});
console.log(`Trovati ${filesToCheck.length} file da analizzare\n`);
let fixedCount = 0;
let errorsCount = 0;
const errorFiles = [];
// Aggiungi l'import mancante
function addMissingImport(sourceFile, filePath, dryRun) {
    try {
        // Verifica se il file usa createSafeMessage
        const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
        const hasCreateSafeMessageCall = callExpressions.some(call => {
            if (call.wasForgotten())
                return false;
            try {
                const expr = (0, utils_js_1.safeGetExpression)(call);
                return expr && (0, utils_js_1.safeGetText)(expr) === 'createSafeMessage';
            }
            catch (error) {
                console.error(`Errore nell'analizzare una chiamata in ${filePath}:`, error);
                return false;
            }
        });
        if (!hasCreateSafeMessageCall)
            return false;
        // Verifica se l'import è già presente
        const hasImport = sourceFile.getImportDeclarations().some(importDecl => {
            return importDecl.getNamedImports().some(namedImport => namedImport.getName() === 'createSafeMessage');
        });
        if (hasImport)
            return false;
        // Calcola il percorso relativo per l'import
        const fileDirname = path_1.default.dirname(filePath);
        const absoluteSharedTypesPath = path_1.default.join(ROOT_DIR, 'src', 'shared', 'types');
        const relativePath = path_1.default.relative(fileDirname, absoluteSharedTypesPath).replace(/\\/g, '/');
        const moduleSpecifier = (relativePath.startsWith('.') ? relativePath : `./${relativePath}`) + '/message.js';
        if (dryRun) {
            console.log(chalk_1.default.yellow(`\nMissing import in ${filePath}:`));
            console.log(chalk_1.default.green(`  Would add: import { createSafeMessage } from "${moduleSpecifier}";`));
            return true;
        }
        // Aggiungi l'import
        try {
            sourceFile.addImportDeclaration({
                moduleSpecifier,
                namedImports: [{ name: 'createSafeMessage' }]
            });
            sourceFile.saveSync();
            console.log(chalk_1.default.green(`✅ Added import to ${filePath}`));
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red(`⚠️ Errore nell'aggiungere l'import a ${filePath}:`), error);
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`⚠️ Errore nell'elaborare ${filePath}:`), error instanceof Error ? error.message : error);
        errorFiles.push(filePath);
        errorsCount++;
        return false;
    }
}
// Elabora tutti i file
for (const filePath of filesToCheck) {
    try {
        const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
        if (addMissingImport(sourceFile, filePath, isDryRun)) {
            fixedCount++;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`⚠️ Errore nell'elaborare ${filePath}:`), error instanceof Error ? error.message : error);
        errorFiles.push(filePath);
        errorsCount++;
    }
}
// Stampa risultato finale
if (isDryRun) {
    console.log(chalk_1.default.cyanBright(`\n🔍 Check completato. Trovati ${fixedCount} file senza import.\n`));
    if (fixedCount > 0) {
        console.log(chalk_1.default.yellow(`Per aggiungere gli import mancanti, esegui senza --check`));
    }
    else {
        console.log(chalk_1.default.green(`✅ Tutti i file hanno l'import corretto!\n`));
    }
}
else {
    console.log(chalk_1.default.cyanBright(`\n🏁 Correzione completata. Aggiunti ${fixedCount} import mancanti.\n`));
    if (errorsCount > 0) {
        console.log(chalk_1.default.red(`⚠️ ${errorsCount} file hanno generato errori durante il processo`));
        console.log(chalk_1.default.red(`I primi 5 file con errori:`));
        errorFiles.slice(0, 5).forEach(file => {
            console.log(chalk_1.default.red(`  - ${file}`));
        });
    }
}
