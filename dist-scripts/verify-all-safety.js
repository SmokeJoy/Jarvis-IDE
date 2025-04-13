#!/usr/bin/env ts-node
"use strict";
/**
 * Verify All Safety Script
 *
 * This script performs comprehensive safety checks for message objects:
 * 1. Detects nested calls to createSafeMessage
 * 2. Detects missing imports of createSafeMessage
 * 3. Detects raw message objects that are not wrapped in createSafeMessage
 *
 * Usage: ts-node scripts/refactor/verify-all-safety.ts
 * Output: JSON report in the reports directory
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utils_js_1 = require("./utils.js"); // Uso .js
// Initialize a ts-morph project
const project = new ts_morph_1.Project({
    tsConfigFilePath: path_1.default.join(process.cwd(), 'tsconfig.json'),
    // Rimuovo compilerOptions interne, usa tsconfig.json
    // compilerOptions: {
    //   target: 'ES2020',
    // }
});
// Directories to include
const includeDirs = ['src', 'test', 'scripts'];
// Directories to exclude
const excludeDirs = ['node_modules', 'dist', 'build', '.git'];
// Add source files to the project
for (const dir of includeDirs) {
    const dirPath = path_1.default.join(process.cwd(), dir);
    if (fs_1.default.existsSync(dirPath)) {
        const files = project.addSourceFilesAtPaths([
            path_1.default.join(dirPath, '**/*.ts'),
            path_1.default.join(dirPath, '**/*.tsx')
        ]);
        console.log(`Added ${files.length} files from ${dir}`);
    }
}
// Collect all safety issues
const safetyIssues = [];
// Check 1: Find nested calls to createSafeMessage
function checkNestedCalls(sourceFile) {
    const filePath = sourceFile.getFilePath();
    sourceFile.forEachDescendant((node) => {
        if ((0, utils_js_1.safeIsKind)(node, ts_morph_1.SyntaxKind.CallExpression)) {
            const callExpr = node;
            const expression = (0, utils_js_1.safeGetExpression)(callExpr);
            if (expression && (0, utils_js_1.safeGetText)(expression).includes('createSafeMessage')) {
                const args = (0, utils_js_1.safeGetArguments)(callExpr);
                for (const arg of args) {
                    if ((0, utils_js_1.safeIsKind)(arg, ts_morph_1.SyntaxKind.CallExpression)) {
                        const nestedCall = arg;
                        const nestedExpr = (0, utils_js_1.safeGetExpression)(nestedCall);
                        if (nestedExpr && (0, utils_js_1.safeGetText)(nestedExpr).includes('createSafeMessage')) {
                            const line = (0, utils_js_1.safeGetLineNumber)(sourceFile, node);
                            safetyIssues.push({
                                type: 'nested-call',
                                file: filePath,
                                line,
                                code: (0, utils_js_1.safeGetText)(node),
                                message: 'Nested call to createSafeMessage detected'
                            });
                        }
                    }
                }
            }
        }
    });
}
// Check 2: Verify if files using createSafeMessage have the import
function checkMissingImports(sourceFile) {
    const filePath = sourceFile.getFilePath();
    let usesCreateSafeMessage = false;
    let hasImport = false;
    // Pattern for createSafeMessage import (adattato per CommonJS e ESM imports)
    const importRegex = /import(?:\s+type)?\s+\{[^}]*createSafeMessage[^}]*\}\s*from\s+['"](.+)['"]|require\(['"](?:.*[\/])?utils(?:\.js)?['"]\)/;
    // Check if file uses createSafeMessage
    sourceFile.forEachDescendant((node) => {
        if ((0, utils_js_1.safeIsKind)(node, ts_morph_1.SyntaxKind.CallExpression)) {
            const callExpr = node;
            const expression = (0, utils_js_1.safeGetExpression)(callExpr);
            if (expression && (0, utils_js_1.safeGetText)(expression).includes('createSafeMessage')) {
                usesCreateSafeMessage = true;
            }
        }
    });
    // Skip if file doesn't use createSafeMessage
    if (!usesCreateSafeMessage) {
        return;
    }
    // Check if file has the import
    const fileContent = sourceFile.getFullText();
    hasImport = importRegex.test(fileContent);
    if (!hasImport) {
        safetyIssues.push({
            type: 'missing-import',
            file: filePath,
            line: 1,
            message: 'Missing import for createSafeMessage'
        });
    }
}
// Check 3: Find raw message objects
function checkRawMessages(sourceFile) {
    const filePath = sourceFile.getFilePath();
    sourceFile.forEachDescendant((node) => {
        if ((0, utils_js_1.safeIsKind)(node, ts_morph_1.SyntaxKind.ObjectLiteralExpression)) {
            const obj = node;
            const { hasRole, hasContent } = (0, utils_js_1.extractMessageProperties)(obj);
            if (hasRole && hasContent) {
                // Check if this object is an argument to createSafeMessage
                let isCreateSafeMessageArg = false;
                let parent = obj.getParent();
                while (parent && !parent.wasForgotten()) {
                    if ((0, utils_js_1.safeIsKind)(parent, ts_morph_1.SyntaxKind.CallExpression)) {
                        const callExpr = parent;
                        const expression = (0, utils_js_1.safeGetExpression)(callExpr);
                        if (expression && (0, utils_js_1.safeGetText)(expression).includes('createSafeMessage')) {
                            isCreateSafeMessageArg = true;
                            break;
                        }
                    }
                    // Only check up to 3 levels to avoid false positives
                    // Rivediamo la logica di risalita per essere più robusta
                    let current = parent;
                    for (let i = 0; i < 3; i++) {
                        if (!current)
                            break;
                        if ((0, utils_js_1.safeIsKind)(current, ts_morph_1.SyntaxKind.CallExpression)) {
                            const callExpr = current;
                            const expression = (0, utils_js_1.safeGetExpression)(callExpr);
                            if (expression && (0, utils_js_1.safeGetText)(expression).includes('createSafeMessage')) {
                                isCreateSafeMessageArg = true;
                                break;
                            }
                        }
                        current = current.getParent();
                    }
                    if (isCreateSafeMessageArg)
                        break; // Esce dal while se trovato
                    // Se non trovato dopo 3 livelli, esci dal while
                    break;
                }
                if (!isCreateSafeMessageArg) {
                    const line = (0, utils_js_1.safeGetLineNumber)(sourceFile, node);
                    safetyIssues.push({
                        type: 'raw-message',
                        file: filePath,
                        line,
                        code: (0, utils_js_1.safeGetText)(node),
                        message: 'Raw message object not wrapped in createSafeMessage'
                    });
                }
            }
        }
    });
}
// Run all checks
console.log('Running safety checks...');
const sourceFiles = project.getSourceFiles();
let totalFiles = 0;
for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    let shouldSkip = false;
    // Skip excluded directories
    for (const excludeDir of excludeDirs) {
        if (filePath.includes(excludeDir)) {
            shouldSkip = true;
            break;
        }
    }
    if (shouldSkip) {
        continue;
    }
    totalFiles++;
    checkNestedCalls(sourceFile);
    checkMissingImports(sourceFile);
    checkRawMessages(sourceFile);
}
// Generate and save report
const report = (0, utils_js_1.generateSafetyReport)(safetyIssues, totalFiles);
const reportPath = (0, utils_js_1.saveReportToFile)(report);
// Export CSV report if there are issues
if (report.issues.length > 0) {
    const csvPath = (0, utils_js_1.exportCsvReport)(report.issues, path_1.default.join(process.cwd(), 'reports', `safety-report-${path_1.default.basename(reportPath, '.json')}.csv`));
    if (csvPath) {
        console.log(`\nDetailed CSV report saved to: ${csvPath}`);
    }
}
// Print summary
console.log('\nSafety Check Summary:');
console.log(`- Total files analyzed: ${report.totalFiles}`);
console.log(`- Files with issues: ${report.filesWithIssues}`);
console.log(`- Total issues found: ${report.issues.length}`);
console.log(`  - Nested calls: ${report.issues.filter((i) => i.type === 'nested-call').length}`);
console.log(`  - Missing imports: ${report.issues.filter((i) => i.type === 'missing-import').length}`);
console.log(`  - Raw messages: ${report.issues.filter((i) => i.type === 'raw-message').length}`);
console.log(`\nDetailed report saved to: ${reportPath}`);
// Exit with error if issues found
if (report.issues.length > 0) {
    process.exit(1);
}
else {
    console.log('\nNo safety issues found!');
    process.exit(0);
}
