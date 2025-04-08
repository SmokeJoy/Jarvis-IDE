#!/usr/bin/env node

/**
 * Script per testare il salvataggio e il caricamento delle impostazioni
 * 
 * Uso:
 *   node scripts/test-settings.js [--reset] [--set key=value] [--get key] [--prompt "contenuto del prompt"] [--load-prompt]
 * 
 * Opzioni:
 *   --reset          Ripristina le impostazioni ai valori predefiniti
 *   --set key=value  Imposta un valore per una chiave specifica
 *   --get key        Ottiene il valore di una chiave specifica
 *   --prompt "..."   Salva un nuovo system prompt
 *   --load-prompt    Carica e visualizza il system prompt attuale
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Ottieni il percorso del file corrente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso del global storage (simulato per i test)
const globalStoragePath = path.join(os.homedir(), '.jarvis-ide');
const configDir = path.join(globalStoragePath, 'config');
const settingsPath = path.join(configDir, 'settings.json');
const systemPromptPath = path.join(configDir, 'system_prompt.md');

// Valori di default per le impostazioni
const DEFAULT_SETTINGS = {
  use_docs: false,
  coder_mode: true,
  contextPrompt: '',
  selectedModel: '',
  multi_agent: false,
};

// Assicurati che le directory esistano
try {
  if (!fs.existsSync(globalStoragePath)) {
    fs.mkdirSync(globalStoragePath, { recursive: true });
    console.log(`✅ Directory ${globalStoragePath} creata`);
  }
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`✅ Directory ${configDir} creata`);
  }
} catch (error) {
  console.error(`❌ Errore nella creazione delle directory: ${error.message}`);
  process.exit(1);
}

// Carica le impostazioni esistenti o crea un file vuoto
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...settings };
    } else {
      // Se il file non esiste, crea un file vuoto con le impostazioni predefinite
      saveSettings(DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS };
    }
  } catch (error) {
    console.error(`❌ Errore nel caricamento delle impostazioni: ${error.message}`);
    return { ...DEFAULT_SETTINGS };
  }
}

// Salva le impostazioni su disco
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`✅ Impostazioni salvate in ${settingsPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore nel salvataggio delle impostazioni: ${error.message}`);
    return false;
  }
}

// Carica il system prompt
function loadSystemPrompt() {
  try {
    if (fs.existsSync(systemPromptPath)) {
      return fs.readFileSync(systemPromptPath, 'utf8');
    } else {
      return '';
    }
  } catch (error) {
    console.error(`❌ Errore nel caricamento del system prompt: ${error.message}`);
    return '';
  }
}

// Salva il system prompt
function saveSystemPrompt(content) {
  try {
    fs.writeFileSync(systemPromptPath, content, 'utf8');
    console.log(`✅ System prompt salvato in ${systemPromptPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore nel salvataggio del system prompt: ${error.message}`);
    return false;
  }
}

// Gestione degli argomenti della riga di comando
const args = process.argv.slice(2);

if (args.length === 0) {
  // Se non ci sono argomenti, mostra le impostazioni correnti
  const settings = loadSettings();
  console.log('Impostazioni correnti:');
  console.log(JSON.stringify(settings, null, 2));
  
  // Mostra anche informazioni sul system prompt
  const promptExists = fs.existsSync(systemPromptPath);
  console.log(`\nSystem prompt: ${promptExists ? 'Presente' : 'Non presente'}`);
  if (promptExists) {
    const stats = fs.statSync(systemPromptPath);
    console.log(`Dimensione: ${stats.size} bytes`);
    console.log(`Ultima modifica: ${stats.mtime}`);
  }
} else {
  // Processa gli argomenti
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--reset') {
      // Ripristina le impostazioni ai valori predefiniti
      saveSettings(DEFAULT_SETTINGS);
      console.log('✅ Impostazioni ripristinate ai valori predefiniti');
    } else if (arg === '--set') {
      // Imposta un valore per una chiave specifica
      const keyValue = args[++i];
      if (!keyValue || !keyValue.includes('=')) {
        console.error('❌ Formato non valido. Usa --set key=value');
        continue;
      }
      
      const [key, valueStr] = keyValue.split('=');
      
      if (!(key in DEFAULT_SETTINGS)) {
        console.error(`❌ Chiave "${key}" non valida. Chiavi valide: ${Object.keys(DEFAULT_SETTINGS).join(', ')}`);
        continue;
      }
      
      // Converti il valore nel tipo corretto
      let value;
      if (valueStr === 'true') {
        value = true;
      } else if (valueStr === 'false') {
        value = false;
      } else if (!isNaN(Number(valueStr))) {
        value = Number(valueStr);
      } else {
        value = valueStr;
      }
      
      const settings = loadSettings();
      settings[key] = value;
      saveSettings(settings);
      console.log(`✅ Impostazione "${key}" aggiornata a "${value}"`);
    } else if (arg === '--get') {
      // Ottiene il valore di una chiave specifica
      const key = args[++i];
      if (!key) {
        console.error('❌ Chiave non specificata');
        continue;
      }
      
      const settings = loadSettings();
      if (key in settings) {
        console.log(`${key}=${settings[key]}`);
      } else {
        console.error(`❌ Chiave "${key}" non trovata`);
      }
    } else if (arg === '--prompt') {
      // Salva un nuovo system prompt
      const content = args[++i];
      if (!content) {
        console.error('❌ Contenuto del prompt non specificato');
        continue;
      }
      
      saveSystemPrompt(content);
    } else if (arg === '--load-prompt') {
      // Carica e visualizza il system prompt attuale
      const prompt = loadSystemPrompt();
      if (prompt) {
        console.log('System prompt:');
        console.log('---------------------------------------------------');
        console.log(prompt);
        console.log('---------------------------------------------------');
      } else {
        console.log('System prompt non presente o vuoto');
      }
    } else {
      console.error(`❌ Argomento sconosciuto: ${arg}`);
    }
  }
} 