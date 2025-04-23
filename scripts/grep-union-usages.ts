import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * Cerca l'uso di union legacy (WebviewMessageUnion, AgentMessageUnion, ExtensionMessageUnion)
 * e salva il risultato in scripts/logs/legacy-unions.log
 */

const root = path.resolve(__dirname, '../');
const unions = ['WebviewMessageUnion', 'AgentMessageUnion', 'ExtensionMessageUnion'];
const matches: string[] = [];

const files = globSync('**/*.{ts,tsx}', {
  cwd: root,
  ignore: ['node_modules/**', 'dist/**', 'scripts/logs/**']
});

for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const content = fs.readFileSync(abs, 'utf8');
  unions.forEach((union) => {
    if (content.includes(union)) {
      matches.push(`${file} → contiene ${union}`);
    }
  });
}

const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'legacy-unions.log');
if (matches.length === 0) {
  fs.writeFileSync(logPath, '✅ Nessuna union legacy trovata.');
} else {
  fs.writeFileSync(logPath, matches.join('\n'));
}

console.log(`📚 grep-union-usages – ${matches.length} occorrenze di union legacy trovate. Output: ${path.relative(process.cwd(), logPath)}`); 