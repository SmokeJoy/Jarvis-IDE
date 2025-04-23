import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPTS = [
  'find-unsafe-casts.ts',
  'check-barrel-exports.ts',
  'grep-union-usages.ts',
  'audit-model-usages.ts'
];

console.log('🚀 Avvio refactor-assistant...');

SCRIPTS.forEach((script) => {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n▶️  Eseguo ${script} ...`);
  try {
    execSync(`ts-node ${scriptPath}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Errore durante l'esecuzione di ${script}:`, err);
  }
});

console.log('\n🏁 Refactor-assistant completato. Controlla la cartella scripts/logs per i report.'); 