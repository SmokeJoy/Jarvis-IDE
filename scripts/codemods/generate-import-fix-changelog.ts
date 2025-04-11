#!/usr/bin/env ts-node

/**
 * @file generate-import-fix-changelog.ts
 * @description Genera un changelog Markdown a partire dal report JSON di import-type-fixes
 */

import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'docs/build/import-type-fixes.json');
const changelogPath = path.join(process.cwd(), 'docs/build/import-type-fixes.md');

if (!fs.existsSync(reportPath)) {
  console.error(`❌ Report non trovato: ${reportPath}`);
  process.exit(1);
}

const fixes: Array<{
  file: string;
  line: number;
  original: string;
  fixed: string;
  imports: string[];
}> = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Raggruppa per file
const grouped = fixes.reduce((acc, fix) => {
  if (!acc[fix.file]) acc[fix.file] = [];
  acc[fix.file].push(fix);
  return acc;
}, {} as Record<string, typeof fixes>);

let md = `# 📦 Import Type Fixes – Changelog\n\n`;
md += `> Questo changelog è stato generato automaticamente da \`generate-import-fix-changelog.ts\`\n\n`;
md += `Totale file modificati: **${Object.keys(grouped).length}**\n`;
md += `Totale fix applicati: **${fixes.length}**\n\n`;

for (const [file, fixes] of Object.entries(grouped)) {
  md += `## 🔧 ${file}\n`;
  for (const fix of fixes) {
    md += `- [riga ${fix.line}] **${fix.imports.join(', ')}** usati come valore:\n`;
    md += `  - 🔸 \`${fix.original.trim()}\`\n`;
    md += `  - 🔹 \`${fix.fixed.trim()}\`\n`;
  }
  md += `\n`;
}

fs.writeFileSync(changelogPath, md, 'utf-8');
console.log(`✅ Changelog generato: ${changelogPath}`); 