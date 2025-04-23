#!/usr/bin/env ts-node

import fg from 'fast-glob';
import fs from 'fs/promises';

const isTypeImport = (line: string) =>
  line.includes('import') && line.includes('{') && !line.includes('type') &&
  line.includes('from') &&
  !line.includes('.css') &&
  !line.includes('.scss');

async function run() {
  const files = await fg(['src/**/*.ts', 'src/**/*.tsx', 'webview-ui/**/*.ts', 'webview-ui/**/*.tsx'], {
    ignore: ['**/*.d.ts', '**/__tests__/**', '**/node_modules/**']
  });

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n');

    let changed = false;
    const updated = lines.map(line => {
      if (isTypeImport(line)) {
        const modified = line.replace('import {', 'import type {');
        if (modified !== line) {
          changed = true;
          return modified;
        }
      }
      return line;
    });

    if (changed) {
      await fs.writeFile(file, updated.join('\n'), 'utf8');
      console.log(`✅ Updated: ${file}`);
    }
  }

  console.log('✨ Done: Type import conversion complete.');
}

run().catch(err => {
  console.error('❌ Error during script execution:', err);
  process.exit(1);
}); 