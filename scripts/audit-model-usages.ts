import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * Cerca accessi diretti a proprietà sensibili (.modelId, .payload, .context, .agentId)
 * senza apparente narrowing. Questo è un check best‑effort basato su semplice grep.
 * Salva i risultati in scripts/logs/model-usage-audit.log
 */

const root = path.resolve(__dirname, '../');
const PROPS = ['.modelId', '.payload', '.context', '.agentId'];
const matches: string[] = [];

const files = globSync('**/*.ts*', {
  cwd: root,
  ignore: ['node_modules/**', 'dist/**', 'scripts/logs/**']
});

for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const content = fs.readFileSync(abs, 'utf8');
  PROPS.forEach((prop) => {
    if (content.includes(prop)) {
      matches.push(`${file} → contiene ${prop}`);
    }
  });
}

const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'model-usage-audit.log');
if (matches.length === 0) {
  fs.writeFileSync(logPath, '✅ Nessun accesso sospetto trovato.');
} else {
  fs.writeFileSync(logPath, matches.join('\n'));
}

console.log(`🔎 audit-model-usages – ${matches.length} potenziali accessi non protetti trovati. Output: ${path.relative(process.cwd(), logPath)}`); 