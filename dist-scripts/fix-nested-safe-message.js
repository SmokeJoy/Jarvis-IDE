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
const utils_js_1 = require("./utils.js"); // Uso .js per import relativo tra moduli TS compilati
// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path_1.default.join(ROOT_DIR, 'tsconfig.json');
// Modalità dry run (controlla senza applicare modifiche)
const isDryRun = process.argv.includes('--check');
const targetDir = process.argv[2] || '';
console.log(`Project root: ${ROOT_DIR}`);
console.log(`Using tsconfig: ${TSCONFIG_PATH}`);
console.log(`Target directory: ${targetDir || 'all'}`);
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
const filesToTransform = fast_glob_1.default.sync(pattern, {
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
    cwd: ROOT_DIR,
});
console.log(`Trovati ${filesToTransform.length} file da analizzare`);
let fixedCount = 0;
let affectedFileCount = 0;
// Cerca le chiamate annidate a createSafeMessage
function processSourceFile(sourceFile, filePath, dryRun) {
    let modified = false;
    let transformCount = 0;
    try {
        // Trova tutte le chiamate a createSafeMessage
        const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
        const transformOperations = [];
        for (const callExpr of callExpressions) {
            if (callExpr.wasForgotten())
                continue;
            // Verifica se è una chiamata a createSafeMessage
            try {
                const expr = (0, utils_js_1.safeGetExpression)(callExpr);
                if (!expr || (0, utils_js_1.safeGetText)(expr) !== 'createSafeMessage')
                    continue;
                // Controlla gli argomenti
                const args = callExpr.getArguments();
                if (args.length !== 1)
                    continue;
                const arg = args[0];
                if (arg.wasForgotten())
                    continue;
                // Se l'argomento stesso è una chiamata a createSafeMessage
                if ((0, utils_js_1.safeIsKind)(arg, ts_morph_1.SyntaxKind.CallExpression)) {
                    const nestedCall = arg;
                    if (nestedCall.wasForgotten())
                        continue;
                    try {
                        const nestedExpr = (0, utils_js_1.safeGetExpression)(nestedCall);
                        if (!nestedExpr || (0, utils_js_1.safeGetText)(nestedExpr) !== 'createSafeMessage')
                            continue;
                        // Ottieni l'argomento interno
                        const nestedArgs = nestedCall.getArguments();
                        if (nestedArgs.length === 0 || nestedArgs[0].wasForgotten())
                            continue;
                        const nestedArg = nestedArgs[0];
                        const nestedArgText = (0, utils_js_1.safeGetText)(nestedArg); // Usa safeGetText
                        if (dryRun) {
                            console.log(chalk_1.default.yellow(`\nNested createSafeMessage in ${filePath}:`));
                            console.log(chalk_1.default.red(`  - From: ${(0, utils_js_1.safeGetText)(callExpr)}`)); // Usa safeGetText
                            console.log(chalk_1.default.green(`  - To:   createSafeMessage(${nestedArgText})`));
                        }
                        else {
                            // Salva l'operazione di sostituzione per eseguirla dopo
                            transformOperations.push({
                                node: callExpr,
                                replacement: `createSafeMessage(${nestedArgText})`
                            });
                            modified = true;
                            transformCount++;
                        }
                    }
                    catch (error) {
                        console.error(`Errore nell'analizzare chiamata annidata in ${filePath}:`, error);
                    }
                }
            }
            catch (error) {
                console.error(`Errore nell'elaborare ${(0, utils_js_1.safeGetText)(callExpr) || 'una chiamata'} in ${filePath}:`, error);
            }
        }
        // Applica le modifiche dopo aver completato l'analisi
        if (!dryRun && transformOperations.length > 0) {
            // Applica le sostituzioni in ordine inverso per evitare di invalidare gli indici
            for (let i = transformOperations.length - 1; i >= 0; i--) {
                const op = transformOperations[i];
                if (!op.node.wasForgotten()) {
                    try {
                        op.node.replaceWithText(op.replacement);
                    }
                    catch (error) {
                        console.error(`Errore nel sostituire ${(0, utils_js_1.safeGetText)(op.node) || 'un nodo'} in ${filePath}:`, error);
                        transformCount--;
                    }
                }
                else {
                    console.warn(`Nodo dimenticato prima della sostituzione in ${filePath}`);
                    transformCount--;
                }
            }
        }
        if (modified && !dryRun) {
            try {
                sourceFile.saveSync();
                console.log(`Aggiornato: ${filePath} (${transformCount} correzioni)`);
            }
            catch (error) {
                console.error(`Errore nel salvare ${filePath}:`, error);
                modified = false;
            }
        }
        return modified;
    }
    catch (error) {
        console.error(`Errore nell'elaborare il file ${filePath}:`, error);
        return false;
    }
}
// Elabora tutti i file
for (const filePath of filesToTransform) {
    try {
        const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
        const fileModified = processSourceFile(sourceFile, filePath, isDryRun);
        if (fileModified) {
            affectedFileCount++;
            fixedCount += 1; // Incrementiamo per ogni file, non per ogni fix
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Errore nell'elaborare ${filePath}:`), error);
    }
}
// Stampa risultato finale
if (isDryRun) {
    console.log(chalk_1.default.cyanBright(`\nCheck completato. Trovate ${fixedCount} chiamate nidificate in ${affectedFileCount} file.\n`));
    if (fixedCount > 0) {
        console.log(chalk_1.default.yellow(`Per correggere automaticamente, esegui senza --check`));
        process.exit(1);
    }
    else {
        console.log(chalk_1.default.green(`✅ Nessuna chiamata nidificata trovata!\n`));
        process.exit(0);
    }
}
else {
    console.log(chalk_1.default.cyanBright(`\n🏁 Correzione completata. Sistemati ${fixedCount} file con chiamate nidificate.\n`));
}
