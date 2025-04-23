import fs from 'fs';
import path from 'path';

const TYPES_DIR = path.resolve('src/shared/types');
const BARREL = path.resolve('src/shared/messages/index.ts');

const barrelHasWildcard = fs.readFileSync(BARREL, 'utf-8').includes("export * from '../types'");

const allTypes = fs
  .readdirSync(TYPES_DIR)
  .filter((f) => f.endsWith('.ts') && !f.startsWith('index') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts'))
  .map((f) => f.replace('.ts', ''));

if (barrelHasWildcard) {
  console.log('✅ Barrel shared/messages esporta wildcard: nessun check necessario');
  process.exit(0);
}

const barrelContent = fs.readFileSync(BARREL, 'utf-8');

const missingExports = allTypes.filter((file) => !barrelContent.includes(file));

if (missingExports.length === 0) {
  console.log('✅ Barrel shared/messages completo: nessun export mancante');
} else {
  console.log('🚨 Missing exports in barrel shared/messages:');
  missingExports.forEach((file) => console.log(' →', file));
  process.exitCode = 1;
} 