import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * Verifica che il barrel dei messaggi (`src/shared/messages/index.ts` o
 * `src/shared/types/messages-barrel.ts`) contenga tutti i tipi chiave.
 * Salva il risultato in scripts/logs/missing-barrel-exports.log
 */

const BARREL_PATHS = [
  path.resolve(__dirname, '../src/shared/types/messages-barrel.ts'),
  path.resolve(__dirname, '../src/shared/messages/index.ts')
];

// Tipi/nomi che vogliamo assicurare siano esportati dal barrel principale
const REQUIRED_EXPORTS = [
  'WebviewMessage',
  'WebviewMessageType',
  'ExtensionMessage',
  'Message',
  'AuthMessageUnion',
  'WebSocketMessageType',
  'WebSocketMessageUnion'
];

const missingGlobal: string[] = [];

BARREL_PATHS.forEach((barrel) => {
  if (!fs.existsSync(barrel)) {
    console.warn(`⚠️  Barrel non trovato: ${barrel}`);
    missingGlobal.push(...REQUIRED_EXPORTS.map((n) => `${n} (barrel assente)`));
    return;
  }

  const content = fs.readFileSync(barrel, 'utf8');
  const missing = REQUIRED_EXPORTS.filter((name) => !content.includes(name));
  if (missing.length > 0) {
    missing.forEach((m) => missingGlobal.push(`${path.relative(process.cwd(), barrel)} → manca ${m}`));
  }
});

// Create logs directory
const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'missing-barrel-exports.log');

if (missingGlobal.length === 0) {
  fs.writeFileSync(logPath, '✅ Tutti i tipi richiesti sono esportati.');
  console.log('✅ check-barrel-exports – Nessuna mancanza nello/gli barrel.');
} else {
  fs.writeFileSync(logPath, missingGlobal.join('\n'));
  console.log(`❌ check-barrel-exports – Mancano ${missingGlobal.length} esportazioni. Vedi ${path.relative(process.cwd(), logPath)}`);
} 