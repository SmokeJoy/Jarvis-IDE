import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * Trova cast pericolosi in tutta la codebase ("as any", "as unknown as ...")
 * e salva il risultato in scripts/logs/unsafe-casts.log
 */

const root = path.resolve(__dirname, '../');

const TS_GLOB_PATTERNS = ['**/*.ts', '**/*.tsx'];
const UNSAFE_PATTERNS = [/as\s+any/, /as\s+unknown\s+as/];

const results: string[] = [];

for (const pattern of TS_GLOB_PATTERNS) {
  const files = globSync(pattern, {
    cwd: root,
    ignore: ['node_modules/**', 'dist/**', 'scripts/logs/**']
  });

  for (const file of files) {
    const abs = path.isAbsolute(file) ? file : path.join(root, file);
    const content = fs.readFileSync(abs, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      UNSAFE_PATTERNS.forEach((regex) => {
        if (regex.test(line)) {
          results.push(`${file}:${idx + 1} → ${line.trim()}`);
        }
      });
    });
  }
}

// Ensure log dir exists
const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });

const logPath = path.join(logDir, 'unsafe-casts.log');
if (results.length === 0) {
  fs.writeFileSync(logPath, '✅ Nessun cast pericoloso trovato.');
} else {
  fs.writeFileSync(logPath, results.join('\n'));
}

console.log(`🔍 Analisi completa: ${results.length} cast pericolosi trovati. Output: ${path.relative(process.cwd(), logPath)}`); 