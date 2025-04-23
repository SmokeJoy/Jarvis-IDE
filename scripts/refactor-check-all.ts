import { execSync } from 'child_process';
import fs from 'fs';

const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

console.log('▶️  Running ESLint lint-report...');
execSync('pnpm tsx scripts/lint-report.ts > logs/eslint-lint-report.txt', { stdio: 'inherit' });

console.log('▶️  Checking barrel consistency...');
execSync('pnpm tsx scripts/check-barrel-consistency.ts > logs/barrel-consistency.txt', { stdio: 'inherit' });

console.log('▶️  Finding unsafe message usage...');
execSync('pnpm tsx scripts/find-unsafe-message.ts > logs/unsafe-messages.txt', { stdio: 'inherit' });

console.log('✅  Tutti i check sono stati eseguiti. Controlla la cartella logs/ per i report.'); 