"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeGetText = safeGetText;
exports.safeIsKind = safeIsKind;
exports.safeGetExpression = safeGetExpression;
exports.safeGetLineNumber = safeGetLineNumber;
exports.safeReplaceWithText = safeReplaceWithText;
exports.safeGetArguments = safeGetArguments;
exports.generateSafetyReport = generateSafetyReport;
exports.saveReportToFile = saveReportToFile;
exports.extractMessageProperties = extractMessageProperties;
exports.exportCsvReport = exportCsvReport;
/**
 * Utilities per lavorare in modo sicuro con ts-morph
 */
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const json2csv_1 = require("json2csv");
// Esportazioni CommonJS per compatibilità
// Quando questo file viene compilato in .js, questi export funzioneranno
module.exports = {
    safeGetText,
    safeIsKind,
    safeGetExpression,
    safeGetLineNumber,
    safeReplaceWithText,
    safeGetArguments,
    generateSafetyReport,
    saveReportToFile,
    extractMessageProperties,
    exportCsvReport
};
/**
 * Ottiene in modo sicuro il testo di un nodo
 * @param node Il nodo da cui estrarre il testo
 * @param defaultValue Valore predefinito in caso di errore
 * @returns Il testo del nodo o il valore predefinito
 */
function safeGetText(node, defaultValue = '') {
    if (!node || node.wasForgotten())
        return defaultValue;
    try {
        return node.getText();
    }
    catch (error) {
        console.warn('Errore nel recuperare il testo del nodo:', error);
        return defaultValue;
    }
}
/**
 * Verifica in modo sicuro se un nodo è del tipo specificato
 * @param node Il nodo da verificare
 * @param kind Il tipo di nodo da verificare
 * @returns true se il nodo è del tipo specificato, false altrimenti
 */
function safeIsKind(node, kind) {
    if (!node || node.wasForgotten())
        return false;
    try {
        return node.getKind() === kind;
    }
    catch (error) {
        console.warn('Errore nel recuperare il tipo del nodo:', error);
        return false;
    }
}
/**
 * Ottiene in modo sicuro l'espressione di una chiamata
 * @param callExpr La chiamata da cui estrarre l'espressione
 * @returns L'espressione della chiamata o null
 */
function safeGetExpression(callExpr) {
    if (!callExpr || callExpr.wasForgotten()) {
        return null;
    }
    try {
        return callExpr.getExpression();
    }
    catch (error) {
        console.warn('Errore nel recuperare l\'espressione della chiamata:', error);
        return null;
    }
}
/**
 * Ottiene in modo sicuro il numero di linea di un nodo
 * @param sourceFile Il file sorgente
 * @param node Il nodo di cui ottenere il numero di linea
 * @returns Il numero di linea o -1 in caso di errore
 */
function safeGetLineNumber(sourceFile, node) {
    if (!node || node.wasForgotten() || !sourceFile || sourceFile.wasForgotten())
        return -1;
    try {
        const pos = node.getStart();
        const { line } = sourceFile.getLineAndColumnAtPos(pos);
        return line;
    }
    catch (error) {
        console.warn('Errore nel recuperare il numero di linea:', error);
        return -1;
    }
}
/**
 * Sostituisce in modo sicuro un nodo con un testo
 * @param node Il nodo da sostituire
 * @param text Il testo con cui sostituire il nodo
 * @returns true se la sostituzione è avvenuta con successo, false altrimenti
 */
function safeReplaceWithText(node, text) {
    if (!node || node.wasForgotten())
        return false;
    try {
        node.replaceWithText(text);
        return true;
    }
    catch (error) {
        console.warn('Errore nel sostituire il nodo con il testo:', error);
        return false;
    }
}
/**
 * Ottiene in modo sicuro gli argomenti di una chiamata
 * @param callExpr La chiamata da cui estrarre gli argomenti
 * @returns Gli argomenti della chiamata o un array vuoto
 */
function safeGetArguments(callExpr) {
    if (!callExpr || callExpr.wasForgotten())
        return [];
    try {
        return callExpr.getArguments();
    }
    catch (error) {
        console.warn('Errore nel recuperare gli argomenti della chiamata:', error);
        return [];
    }
}
function generateSafetyReport(issues, totalFiles) {
    const report = {
        timestamp: new Date().toISOString(),
        totalFiles,
        filesWithIssues: [...new Set(issues.map(issue => issue.file))].length,
        issues
    };
    return report;
}
function saveReportToFile(report, outputPath) {
    const reportsDir = path_1.default.join(process.cwd(), 'reports');
    // Ensure reports directory exists
    if (!fs_1.default.existsSync(reportsDir)) {
        fs_1.default.mkdirSync(reportsDir, { recursive: true });
    }
    // Generate filename with timestamp if not provided
    const filename = outputPath || path_1.default.join(reportsDir, `safety-report-${Date.now()}.json`);
    // Write report to file
    fs_1.default.writeFileSync(filename, JSON.stringify(report, null, 2));
    return filename;
}
// Function to extract role and content from a message object literal
function extractMessageProperties(obj) {
    let role;
    let content;
    let hasRole = false;
    let hasContent = false;
    try {
        if (!obj || obj.wasForgotten()) {
            return { hasRole: false, hasContent: false };
        }
        const properties = obj.getProperties();
        for (const prop of properties) {
            if (prop.wasForgotten() || !safeIsKind(prop, ts_morph_1.SyntaxKind.PropertyAssignment)) {
                continue;
            }
            const propAssignment = prop;
            const propName = safeGetText(propAssignment.getNameNode());
            if (propName === 'role') {
                hasRole = true;
                const initializer = propAssignment.getInitializer();
                if (initializer && !initializer.wasForgotten()) {
                    role = safeGetText(initializer);
                }
            }
            else if (propName === 'content') {
                hasContent = true;
                const initializer = propAssignment.getInitializer();
                if (initializer && !initializer.wasForgotten()) {
                    content = safeGetText(initializer);
                }
            }
        }
    }
    catch (error) {
        // Error handling
    }
    return { role, content, hasRole, hasContent };
}
/**
 * Esporta il report in formato CSV
 * @param data Array di oggetti SafetyIssue da esportare
 * @param outputPath Percorso del file CSV da generare
 * @returns Percorso del file CSV generato o stringa vuota in caso di errore
 */
function exportCsvReport(data, outputPath) {
    if (!data || data.length === 0) {
        console.log('📄 Nessun problema da esportare in CSV.');
        return '';
    }
    try {
        // Determina i campi da includere nel CSV, assicurando l'ordine
        const fields = ['file', 'line', 'type', 'message', 'code'];
        // Genera il CSV
        const csv = (0, json2csv_1.parse)(data, { fields });
        // Crea cartella reports se non esiste
        const reportsDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(reportsDir)) {
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        }
        // Scrive il file CSV
        fs_1.default.writeFileSync(outputPath, csv, 'utf-8');
        console.log(`📄 Report CSV esportato con successo in: ${outputPath}`);
        return outputPath;
    }
    catch (err) {
        console.error('❌ Errore durante l\'esportazione CSV:', err);
        return '';
    }
}
