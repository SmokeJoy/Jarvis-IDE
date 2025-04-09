/**
 * Script per generare automaticamente JSON Schema a partire dai tipi discriminati
 * Usato per DeepSeek o validazione runtime di WebviewMessage / ExtensionMessage
 * 
 * Richiede:
 * - `ts-json-schema-generator` installato come devDependency
 *   ➤ `pnpm add -D ts-json-schema-generator`
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configurazione dello schema
const config = {
  path: './src/shared/WebviewMessage.ts',
  tsconfig: './tsconfig.json',
  type: 'WebviewMessage',
  expose: 'export',
  topRef: true,
  skipTypeCheck: false
};

// Percorso output
const outputFile = path.resolve(__dirname, '../docs/schemas/WebviewMessage.schema.json');

// Comando CLI
const cmd = `npx ts-json-schema-generator ${Object.entries(config)
  .map(([key, val]) => `--${key} ${val}`)
  .join(' ')}`;

try {
  // Assicurati che la directory di output esista
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const schema = execSync(cmd, { encoding: 'utf-8' });
  fs.writeFileSync(outputFile, schema, 'utf-8');
  console.log(`✅ Schema generato con successo in: ${outputFile}`);
} catch (err) {
  console.error('❌ Errore durante la generazione dello schema:', err);
  process.exit(1);
}

/**
 * TODO: Estendere per generare schema anche per ExtensionMessage
 * 
 * Esempio:
 * generateSchema('WebviewMessage', './src/shared/WebviewMessage.ts');
 * generateSchema('ExtensionMessage', './src/shared/ExtensionMessage.ts');
 * 
 * Function generateSchema(typeName, sourcePath) {
 *   // ...implementazione...
 * }
 */ 