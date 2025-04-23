import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * Trova i literal 'any' nelle annotazioni di tipo (": any" o "as any")
 * Scrive il risultato in scripts/logs/any-literals.log
 */

const root = path.resolve(__dirname, '../');
const results: string[] = [];

const files = globSync('**/*.{ts,tsx}', {
  cwd: root,
  ignore: ['node_modules/**', 'dist/**', 'scripts/logs/**']
});

for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/(\sas\s+any|:\s+any(\s|;|,|$))/.test(line)) {
      results.push(`${file}:${idx + 1} → ${line.trim()}`);
    }
  });
}

const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'any-literals.log');
if (results.length === 0) {
  fs.writeFileSync(logPath, '✅ Nessuna occorrenza trovata.');
} else {
  fs.writeFileSync(logPath, results.join('\n'));
}

console.log(`🟡 find-any-literals – ${results.length} occorrenze trovate. Output: ${path.relative(process.cwd(), logPath)}`); 