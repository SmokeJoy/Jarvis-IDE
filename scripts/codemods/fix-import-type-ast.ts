#!/usr/bin/env ts-node

import * as ts from 'typescript';
import fs from 'fs';
import path from 'path';

const report: {
  file: string;
  line: number;
  original: string;
  fixed: string;
  imports: string[];
}[] = [];

function isTypeOnlyImport(node: ts.ImportDeclaration): boolean {
  return node.importClause?.isTypeOnly || false;
}

function processFile(filePath: string): void {
  const sourceText = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true
  );

  let changed = false;
  let newText = sourceText;

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && isTypeOnlyImport(node)) {
      const importClause = node.importClause;
      if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) return;

      const names = importClause.namedBindings.elements.map(n => n.name.getText());
      const original = node.getFullText();
      const fixed = original.replace('import type', 'import');
      
      report.push({
        file: filePath,
        line: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).line + 1,
        original,
        fixed,
        imports: names
      });

      newText = newText.replace(original, fixed);
      changed = true;
      console.log(`✔️  Fixed import in ${path.basename(filePath)}:${ts.getLineAndCharacterOfPosition(sourceFile, node.pos).line + 1} – ${names.join(', ')}`);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (changed) {
    fs.writeFileSync(filePath, newText, 'utf-8');
  }
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

const srcDir = path.join(process.cwd(), 'src');
scanDirectory(srcDir);

const outputDir = path.join(process.cwd(), "docs/build");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, "import-type-fixes.json");
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

console.log(`\n✅ Report salvato in ${outputPath}`); 