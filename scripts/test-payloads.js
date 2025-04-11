/**
 * Validatore CLI standalone per payload JSON
 * ➤ Permette di validare un file JSON contro uno schema TypeScript generato
 * ➤ Usa i validatori definiti in src/shared/validators.ts
 * 
 * Uso:
 *   node scripts/test-payloads.ts path/to/example.json ChatMessage
 */

const fs = require('fs');
const path = require('path');
const validators = require('../src/shared/validators');

// Recupera i parametri dalla riga di comando
const [,, filePath, typeName] = process.argv;

// Tipi supportati
const supportedTypes = ['ChatMessage', 'ChatMessage[]', 'ChatSettings', 'ApiConfiguration', 'ChatSession', 'ChatSession[]'];

if (!filePath || !typeName || !supportedTypes.includes(typeName)) {
  console.error('❌ Usa: node scripts/test-payloads.ts FILE.json TYPE');
  console.log(`   Tipi supportati: ${supportedTypes.join(', ')}`);
  process.exit(1);
}

// Carica e valida il file
try {
  console.log(`🔍 Validazione file: ${filePath} come tipo: ${typeName}`);
  
  const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const json = JSON.parse(fileContent);

  let isValid = false;
  let errors = null;

  switch (typeName) {
    case 'ChatMessage':
      isValid = validators.isValidChatMessage(json);
      errors = validators.getChatMessageErrors ? validators.getChatMessageErrors(json) : null;
      break;
    case 'ChatMessage[]':
      isValid = validators.isValidChatMessageArray(json);
      if (validators.getChatMessageErrors && Array.isArray(json)) {
        errors = json.map(item => validators.getChatMessageErrors(item)).flat().filter(Boolean);
      }
      break;
    case 'ChatSettings':
      isValid = validators.isValidChatSettings(json);
      errors = validators.getChatSettingsErrors ? validators.getChatSettingsErrors(json) : null;
      break;
    case 'ApiConfiguration':
      isValid = validators.isValidApiConfiguration(json);
      errors = validators.getApiConfigurationErrors ? validators.getApiConfigurationErrors(json) : null;
      break;
    case 'ChatSession':
      isValid = validators.isValidChatSession ? validators.isValidChatSession(json) : false;
      errors = validators.getChatSessionErrors ? validators.getChatSessionErrors(json) : null;
      break;
    case 'ChatSession[]':
      isValid = validators.isValidChatSessionArray ? validators.isValidChatSessionArray(json) : false;
      errors = validators.getChatSessionArrayErrors ? validators.getChatSessionArrayErrors(json) : null;
      break;
  }

  if (isValid) {
    console.log(`✅ Payload valido per tipo: ${typeName}`);
    
    // Stampa una rappresentazione del payload per conferma
    console.log('\n📄 Sommario payload:');
    if (Array.isArray(json)) {
      console.log(`  Array con ${json.length} elementi`);
      if (json.length > 0) {
        console.log('  Esempio del primo elemento:');
        printObjectSummary(json[0], '    ');
      }
    } else {
      printObjectSummary(json, '  ');
    }
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

// Utility per stampare un riepilogo di un oggetto
function printObjectSummary(obj, indent = '') {
  if (!obj || typeof obj !== 'object') {
    console.log(`${indent}${obj}`);
    return;
  }
  
  const keys = Object.keys(obj);
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 50) {
      console.log(`${indent}${key}: ${value.substring(0, 47)}...`);
    } else if (typeof value === 'object' && value !== null) {
      console.log(`${indent}${key}: [Oggetto]`);
    } else {
      console.log(`${indent}${key}: ${value}`);
    }
  }
} 