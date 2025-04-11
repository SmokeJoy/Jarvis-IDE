/**
 * Script per importare i dati di benchmark da un file JSON
 */
import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkStorage } from '../storage/benchmark/BenchmarkStorage.js';

// Controlla gli argomenti
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Errore: Specifica il percorso del file JSON da importare.');
  console.log('Utilizzo: npm run benchmark:import -- <percorso/del/file.json>');
  process.exit(1);
}

const filePath = args[0];

// Controlla se il file esiste
if (!fs.existsSync(filePath)) {
  console.error(`Errore: Il file "${filePath}" non esiste.`);
  process.exit(1);
}

// Controlla se è un file JSON
if (!filePath.toLowerCase().endsWith('.json')) {
  console.error('Errore: Il file deve essere in formato JSON.');
  process.exit(1);
}

// Importa il file
try {
  const storage = new BenchmarkStorage();
  const sessionId = storage.importSession(filePath);
  
  console.log(`Sessione di benchmark importata con successo! ID: ${sessionId}`);
  console.log(`File: ${path.resolve(filePath)}`);
} catch (error) {
  console.error('Errore durante l\'importazione:', error.message);
  process.exit(1);
} 