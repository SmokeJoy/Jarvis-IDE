/**
 * Script per importare i risultati dei test nel sistema di storage dei benchmark
 * 
 * Uso:
 *   npx tsx scripts/import-benchmark.ts [directory-risultati] [descrizione]
 * 
 * Esempio:
 *   npx tsx scripts/import-benchmark.ts results "Test dei provider OpenAI e Groq"
 */

import { BenchmarkStorage } from '../src/benchmark/BenchmarkStorage';
import path from 'path';

async function importResults() {
  try {
    // Inizializza lo storage dei benchmark
    console.log('🔍 Inizializzazione storage benchmark...');
    const storage = new BenchmarkStorage();
    await storage.initialize();
    
    // Recupera i parametri dalla riga di comando
    const resultsDir = process.argv[2] || 'results';
    const description = process.argv[3] || `Benchmark importati il ${new Date().toLocaleString()}`;
    
    // Controlla se la directory esiste
    const fullPath = path.join(process.cwd(), resultsDir);
    console.log(`📂 Importazione da: ${fullPath}`);
    console.log(`📝 Descrizione: ${description}`);
    
    // Importa i risultati
    console.log('\n🔄 Importazione in corso...');
    const sessionId = await storage.importFromResultsDir(resultsDir, description);
    
    // Recupera la sessione appena creata
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error('Errore: sessione non trovata dopo l\'importazione');
    }
    
    // Visualizza un riepilogo
    console.log('\n✅ Importazione completata con successo!');
    console.log('='.repeat(50));
    console.log('📊 RIEPILOGO IMPORTAZIONE');
    console.log('-'.repeat(50));
    console.log(`ID Sessione: ${session.id}`);
    console.log(`Data: ${new Date(session.date).toLocaleString()}`);
    console.log(`Descrizione: ${session.description}`);
    console.log(`Ambiente: ${session.environment}`);
    console.log(`Risultati importati: ${session.results.length}`);
    
    // Conta i provider unici e i tipi di test
    const providers = new Set<string>();
    let callTests = 0;
    let streamTests = 0;
    
    for (const result of session.results) {
      providers.add(result.provider);
      if (result.type === 'call') callTests++;
      if (result.type === 'stream') streamTests++;
    }
    
    console.log(`Provider inclusi: ${Array.from(providers).join(', ')}`);
    console.log(`Test sincroni (call): ${callTests}`);
    console.log(`Test in streaming: ${streamTests}`);
    console.log('-'.repeat(50));
    
    // Offri opzioni per ulteriori azioni
    console.log('\n🔍 Cosa fare adesso:');
    console.log('1. Eseguire un\'analisi con: npx tsx scripts/analyze-benchmark.ts');
    console.log('2. Esportare i dati con: npx tsx scripts/export-benchmark.ts');
    console.log('3. Visualizzare i risultati nel dashboard web (se disponibile)');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error(`❌ ERRORE: ${error.message}`);
    process.exit(1);
  }
}

// Esegui l'importazione
importResults(); 