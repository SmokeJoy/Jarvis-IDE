#!/usr/bin/env ts-node

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

import { Project, SourceFile, SyntaxKind, Node, CallExpression, ObjectLiteralExpression } from 'ts-morph';
import path from 'path';
import fs from 'fs';
import {
  safeGetText,
  safeIsKind,
  safeGetExpression,
  safeGetLineNumber,
  safeGetArguments,
  SafetyIssue,
  generateSafetyReport,
  saveReportToFile,
  extractMessageProperties,
  exportCsvReport
} from './utils.js'; // Uso .js

// Initialize a ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'), 
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
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    const files = project.addSourceFilesAtPaths([
      path.join(dirPath, '**/*.ts'),
      path.join(dirPath, '**/*.tsx')
    ]);
    console.log(`Added ${files.length} files from ${dir}`);
  }
}

// Collect all safety issues
const safetyIssues: SafetyIssue[] = [];

// Check 1: Find nested calls to createSafeMessage
function checkNestedCalls(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath();
  
  sourceFile.forEachDescendant((node: Node) => { // Uso Node da ts-morph
    if (safeIsKind(node, SyntaxKind.CallExpression)) {
      const callExpr = node as CallExpression;
      const expression = safeGetExpression(callExpr);
      
      if (expression && safeGetText(expression).includes('createSafeMessage')) {
        const args = safeGetArguments(callExpr);
        
        for (const arg of args) {
          if (safeIsKind(arg, SyntaxKind.CallExpression)) {
            const nestedCall = arg as CallExpression;
            const nestedExpr = safeGetExpression(nestedCall);
            
            if (nestedExpr && safeGetText(nestedExpr).includes('createSafeMessage')) {
              const line = safeGetLineNumber(sourceFile, node);
              
              safetyIssues.push({
                type: 'nested-call',
                file: filePath,
                line,
                code: safeGetText(node),
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
function checkMissingImports(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath();
  let usesCreateSafeMessage = false;
  let hasImport = false;
  
  // Pattern for createSafeMessage import (adattato per CommonJS e ESM imports)
  const importRegex = /import(?:\s+type)?\s+\{[^}]*createSafeMessage[^}]*\}\s*from\s+['"](.+)['"]|require\(['"](?:.*[\/])?utils(?:\.js)?['"]\)/;

  // Check if file uses createSafeMessage
  sourceFile.forEachDescendant((node: Node) => {
    if (safeIsKind(node, SyntaxKind.CallExpression)) {
      const callExpr = node as CallExpression;
      const expression = safeGetExpression(callExpr);
      
      if (expression && safeGetText(expression).includes('createSafeMessage')) {
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
function checkRawMessages(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath();
  
  sourceFile.forEachDescendant((node: Node) => {
    if (safeIsKind(node, SyntaxKind.ObjectLiteralExpression)) {
      const obj = node as ObjectLiteralExpression;
      const { hasRole, hasContent } = extractMessageProperties(obj);
      
      if (hasRole && hasContent) {
        // Check if this object is an argument to createSafeMessage
        let isCreateSafeMessageArg = false;
        let parent = obj.getParent();
        
        while (parent && !parent.wasForgotten()) {
          if (safeIsKind(parent, SyntaxKind.CallExpression)) {
            const callExpr = parent as CallExpression;
            const expression = safeGetExpression(callExpr);
            
            if (expression && safeGetText(expression).includes('createSafeMessage')) {
              isCreateSafeMessageArg = true;
              break;
            }
          }
          
          // Only check up to 3 levels to avoid false positives
          // Rivediamo la logica di risalita per essere più robusta
          let current: Node | undefined = parent;
          for (let i = 0; i < 3; i++) {
             if (!current) break;
             if (safeIsKind(current, SyntaxKind.CallExpression)) {
                const callExpr = current as CallExpression;
                const expression = safeGetExpression(callExpr);
                 if (expression && safeGetText(expression).includes('createSafeMessage')) {
                   isCreateSafeMessageArg = true;
                   break;
                 }
             }
             current = current.getParent();
          }
          if(isCreateSafeMessageArg) break; // Esce dal while se trovato
          
          // Se non trovato dopo 3 livelli, esci dal while
          break; 
        }
        
        if (!isCreateSafeMessageArg) {
          const line = safeGetLineNumber(sourceFile, node);
          
          safetyIssues.push({
            type: 'raw-message',
            file: filePath,
            line,
            code: safeGetText(node),
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
const report = generateSafetyReport(safetyIssues, totalFiles);
const reportPath = saveReportToFile(report);

// Export CSV report if there are issues
if (report.issues.length > 0) {
  const csvPath = exportCsvReport(report.issues, path.join(process.cwd(), 'reports', `safety-report-${path.basename(reportPath, '.json')}.csv`));
  if (csvPath) {
    console.log(`\nDetailed CSV report saved to: ${csvPath}`);
  }
}

// Print summary
console.log('\nSafety Check Summary:');
console.log(`- Total files analyzed: ${report.totalFiles}`);
console.log(`- Files with issues: ${report.filesWithIssues}`);
console.log(`- Total issues found: ${report.issues.length}`);
console.log(`  - Nested calls: ${report.issues.filter((i: SafetyIssue) => i.type === 'nested-call').length}`);
console.log(`  - Missing imports: ${report.issues.filter((i: SafetyIssue) => i.type === 'missing-import').length}`);
console.log(`  - Raw messages: ${report.issues.filter((i: SafetyIssue) => i.type === 'raw-message').length}`);
console.log(`\nDetailed report saved to: ${reportPath}`);

// Exit with error if issues found
if (report.issues.length > 0) {
  process.exit(1);
} else {
  console.log('\nNo safety issues found!');
  process.exit(0);
} 