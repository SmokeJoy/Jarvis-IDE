import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import chalk from 'chalk';

const ROOT = 'src';
const TYPES_IMPORT_PATH = '@/types';
const typeNames = new Set<string>();

// Tipi centrali già migrati
const centralTypes = [
  'ModelInfo',
  'LLMProviderHandler',
  'ProviderStats',
  'LLMEventPayload',
  'ChatMessage',
  'WebviewMessage',
  'TelemetryEvent',
  'ApiConfiguration',
  'FallbackStrategy'
];

// Riempie il set
centralTypes.forEach(type => typeNames.add(type));

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      walk(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Regex: match './xxx.js' o '../xxx.js'
  const fixed = content.replace(/(from\s+['"]\.{1,2}\/[^'"]+)\.js(['"])/g, '$1$2');

  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
    console.log(`🛠️ Fix: ${filePath}`);
  }
}

function run() {
  console.log(chalk.blue('\n🔍 Inizio correzione import `.js` nei file `.ts`...\n'));
  const files = walk(ROOT);
  files.forEach(fixFile);
  console.log(chalk.green('\n✅ Completato: ' + files.length + ' file modificati.\n'));
}

run(); 