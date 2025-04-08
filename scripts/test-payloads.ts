/**
 * Validatore CLI standalone per payload JSON
 * ➤ Permette di validare un file JSON contro uno schema TypeScript generato
 * ➤ Usa i validatori definiti in src/shared/validators.ts
 * 
 * Uso:
 *   pnpm ts-node scripts/test-payloads.ts --file path/to/example.json --type ChatMessage
 */

import fs from 'fs';
import path from 'path';
import { argv } from 'process';
import {
  isValidChatMessage,
  getChatMessageErrors,
  isValidChatMessageArray,
  isValidChatSettings,
  getChatSettingsErrors,
  isValidApiConfiguration,
  getApiConfigurationErrors,
  isValidChatSession,
  getChatSessionErrors,
  isValidChatSessionArray,
  getChatSessionArrayErrors
} from '../src/shared/validators.js';

type SupportedType = 'ChatMessage' | 'ChatMessage[]' | 'ChatSettings' | 'ApiConfiguration' | 'ChatSession' | 'ChatSession[]';

const argFile = argv.find(arg => arg.startsWith('--file='));
const argType = argv.find(arg => arg.startsWith('--type='));

if (!argFile || !argType) {
  console.error('❌ Usa: pnpm ts-node scripts/test-payloads.ts --file=FILE.json --type=TYPE');
  console.log('   Tipi supportati: ChatMessage, ChatMessage[], ChatSettings, ApiConfiguration, ChatSession, ChatSession[]');
  process.exit(1);
}

const filePath = argFile.split('=')[1];
const typeName = argType.split('=')[1] as SupportedType;

// Carica e valida il file
try {
  const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const json = JSON.parse(fileContent);

  let isValid = false;
  let errors: string[] | null = null;

  switch (typeName) {
    case 'ChatMessage':
      isValid = isValidChatMessage(json);
      errors = getChatMessageErrors(json);
      break;
    case 'ChatMessage[]':
      isValid = isValidChatMessageArray(json);
      errors = json.map(getChatMessageErrors).flat().filter(Boolean);
      break;
    case 'ChatSettings':
      isValid = isValidChatSettings(json);
      errors = getChatSettingsErrors(json);
      break;
    case 'ApiConfiguration':
      isValid = isValidApiConfiguration(json);
      errors = getApiConfigurationErrors(json);
      break;
    case 'ChatSession':
      isValid = isValidChatSession(json);
      errors = getChatSessionErrors(json);
      break;
    case 'ChatSession[]':
      isValid = isValidChatSessionArray(json);
      errors = getChatSessionArrayErrors(json);
      break;
    default:
      console.error(`❌ Tipo non supportato: ${typeName}`);
      process.exit(1);
  }

  if (isValid) {
    console.log(`✅ Payload valido per tipo: ${typeName}`);
  } else {
    console.error(`❌ Payload NON valido per tipo: ${typeName}`);
    if (errors && errors.length > 0) {
      console.error('🔍 Errori di validazione:');
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
    } else {
      console.error('⚠️ Nessun dettaglio disponibile (fallback attivo o schema non caricato)');
    }
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Errore durante il parsing o la validazione:', error);
  process.exit(1);
} 