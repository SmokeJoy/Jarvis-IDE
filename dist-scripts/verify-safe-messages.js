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
// Percorsi
const ROOT_DIR = process.cwd();
const TSCONFIG_PATH = path_1.default.join(ROOT_DIR, 'tsconfig.json');
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
const filesToCheck = fast_glob_1.default.sync(pattern, {
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/out/**'],
    cwd: ROOT_DIR,
});
console.log(`Trovati ${filesToCheck.length} file da analizzare\n`);
// Statistiche
let totalCalls = 0;
let suspiciousCalls = 0;
let importsCount = 0;
let filesWithCalls = 0;
let filesWithoutImport = 0;
const suspiciousCallsList = [];
const missingImportFiles = [];
// Verifica la correttezza delle chiamate a createSafeMessage
function analyzeCreateSafeMessageCalls(sourceFile, filePath) {
    // 1. Conta le chiamate a createSafeMessage
    const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    const createSafeMsgCalls = callExpressions.filter(call => {
        if (call.wasForgotten())
            return false;
        const expr = call.getExpression();
        return expr && expr.getText() === 'createSafeMessage';
    });
    if (createSafeMsgCalls.length === 0)
        return;
    filesWithCalls++;
    totalCalls += createSafeMsgCalls.length;
    // 2. Verifica se l'import è presente
    const hasImport = sourceFile.getImportDeclarations().some(importDecl => {
        return importDecl.getNamedImports().some(namedImport => namedImport.getName() === 'createSafeMessage');
    });
    if (!hasImport) {
        filesWithoutImport++;
        missingImportFiles.push(filePath);
    }
    else {
        importsCount++;
    }
    // 3. Analizza le chiamate per problemi
    for (const call of createSafeMsgCalls) {
        if (call.wasForgotten())
            continue;
        const linePos = sourceFile.getLineAndColumnAtPos(call.getStart());
        const lineNumber = linePos.line;
        // Verifica se ci sono argomenti
        const args = call.getArguments();
        if (args.length === 0) {
            suspiciousCalls++;
            suspiciousCallsList.push({
                file: filePath,
                code: call.getText(),
                reason: "Nessun argomento fornito",
                line: lineNumber,
                suggestion: "createSafeMessage({role: 'unknown', content: ''})"
            });
            continue;
        }
        // Verifica la struttura dell'argomento
        const firstArg = args[0];
        if (firstArg.wasForgotten())
            continue;
        // Se è una chiamata annidata a createSafeMessage
        if (firstArg.getKind() === ts_morph_1.SyntaxKind.CallExpression) {
            const nestedCall = firstArg;
            if (nestedCall.wasForgotten())
                continue;
            try {
                const nestedExpr = nestedCall.getExpression();
                if (nestedExpr && nestedExpr.getText() === 'createSafeMessage') {
                    suspiciousCalls++;
                    let suggestion = '';
                    // Recupera l'argomento interno in modo sicuro
                    if (nestedCall.getArguments().length > 0 && !nestedCall.getArguments()[0].wasForgotten()) {
                        suggestion = `createSafeMessage(${nestedCall.getArguments()[0].getText()})`;
                    }
                    suspiciousCallsList.push({
                        file: filePath,
                        code: call.getText(),
                        reason: "Chiamata annidata",
                        line: lineNumber,
                        suggestion
                    });
                }
            }
            catch (error) {
                console.error(`Errore nell'analizzare chiamata annidata in ${filePath}:`, error);
            }
            continue;
        }
        // Se non è un oggetto
        if (firstArg.getKind() !== ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
            suspiciousCalls++;
            suspiciousCallsList.push({
                file: filePath,
                code: call.getText(),
                reason: "Argomento non è un oggetto",
                line: lineNumber
            });
            continue;
        }
        // Verifica le proprietà dell'oggetto in modo sicuro
        try {
            const objText = firstArg.getText();
            if (!objText.includes('role:') || !objText.includes('content:')) {
                suspiciousCalls++;
                suspiciousCallsList.push({
                    file: filePath,
                    code: call.getText(),
                    reason: "Mancano role o content",
                    line: lineNumber
                });
            }
        }
        catch (error) {
            console.error(`Errore nell'analizzare le proprietà dell'oggetto in ${filePath}:`, error);
        }
    }
}
// Elabora tutti i file
for (const filePath of filesToCheck) {
    try {
        const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
        analyzeCreateSafeMessageCalls(sourceFile, filePath);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Errore nell'analizzare ${filePath}:`), error);
    }
}
// Stampa report
console.log(chalk_1.default.cyanBright(`\n📊 REPORT CREATESSAFEMESSAGE`));
console.log(chalk_1.default.white(`=========================\n`));
console.log(chalk_1.default.white(`Totale chiamate: ${totalCalls} in ${filesWithCalls} file`));
console.log(chalk_1.default.white(`File con import: ${importsCount}`));
console.log(chalk_1.default.white(`File senza import: ${filesWithoutImport}`));
console.log(chalk_1.default.white(`Chiamate sospette: ${suspiciousCalls}`));
if (suspiciousCalls > 0) {
    console.log(chalk_1.default.yellow(`\n⚠️ CHIAMATE SOSPETTE PER TIPO:`));
    // Raggruppa per tipo di problema
    const problemsByType = {};
    suspiciousCallsList.forEach(call => {
        problemsByType[call.reason] = (problemsByType[call.reason] || 0) + 1;
    });
    // Mostra i problemi raggruppati
    Object.entries(problemsByType).forEach(([reason, count]) => {
        console.log(chalk_1.default.yellow(`  - ${reason}: ${count}`));
    });
    // Mostra le prime 10 chiamate problematiche come esempio
    console.log(chalk_1.default.yellow(`\n⚠️ ESEMPI DI CHIAMATE PROBLEMATICHE:`));
    const examples = suspiciousCallsList.slice(0, 10);
    examples.forEach((call, index) => {
        console.log(chalk_1.default.white(`\nEsempio #${index + 1} - ${call.reason}`));
        console.log(chalk_1.default.white(`File: ${call.file}:${call.line}`));
        console.log(chalk_1.default.red(`Codice: ${call.code}`));
        if (call.suggestion) {
            console.log(chalk_1.default.green(`Suggerimento: ${call.suggestion}`));
        }
    });
}
if (filesWithoutImport > 0) {
    console.log(chalk_1.default.yellow(`\n⚠️ FILE SENZA IMPORT CREATESSAFEMESSAGE:`));
    missingImportFiles.slice(0, 10).forEach(file => {
        console.log(chalk_1.default.white(`  - ${file}`));
    });
    if (missingImportFiles.length > 10) {
        console.log(chalk_1.default.white(`  - ...e altri ${missingImportFiles.length - 10} file`));
    }
}
console.log(chalk_1.default.cyanBright(`\n✅ PROSSIMI PASSI:`));
console.log(chalk_1.default.white(`1. Esegui fix-nested-safe-message.ts per risolvere le chiamate annidate`));
console.log(chalk_1.default.white(`2. Aggiungi gli import mancanti`));
console.log(chalk_1.default.white(`3. Controlla e correggi le chiamate sospette`));
