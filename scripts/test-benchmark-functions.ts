/**
 * Script di test per le funzionalità di benchmark
 */
import path from 'path';
import fs from 'fs';
import { BenchmarkStorage } from '../src/benchmark/BenchmarkStorage';

async function main() {
  try {
    console.log('🧪 Test delle funzionalità di benchmark');
    console.log('==================================================');
    
    // Inizializza lo storage
    const storage = new BenchmarkStorage();
    await storage.initialize();
    console.log('✅ Storage inizializzato');
    
    // Crea una nuova sessione
    const sessionId = await storage.createSession('Test benchmark automatico', 'test');
    console.log(`✅ Nuova sessione creata: ${sessionId}`);
    
    // Importa file dalla directory results
    const resultsDir = path.join(process.cwd(), 'results');
    if (fs.existsSync(resultsDir)) {
      const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
      console.log(`📊 Trovati ${files.length} file JSON nella directory results`);
      
      if (files.length > 0) {
        // Importa il primo file
        const firstFile = path.join(resultsDir, files[0]);
        console.log(`📥 Importazione file: ${firstFile}`);
        
        const importedSessionId = await storage.importFromJSON(firstFile, 'Test importazione singola');
        console.log(`✅ File importato, sessione: ${importedSessionId}`);
        
        // Verifica che la sessione esista
        const session = storage.getSession(importedSessionId);
        if (session) {
          console.log(`✅ Sessione importata contiene ${session.results.length} risultati`);
        }
      }
      
      // Prova a importare tutti i file
      console.log(`📥 Importazione di tutti i file dalla directory results...`);
      const bulkSessionId = await storage.importFromResultsDir();
      console.log(`✅ Directory importata, sessione: ${bulkSessionId}`);
      
      // Ottieni statistiche
      console.log(`📊 Statistiche provider ultimi 30 giorni:`);
      const stats = storage.getProviderStats(30);
      console.log(JSON.stringify(stats, null, 2));
      
      // Ottieni timeline per un provider
      if (stats && Object.keys(stats).length > 0) {
        const firstProvider = Object.keys(stats)[0];
        console.log(`📈 Timeline per provider ${firstProvider}:`);
        const timeline = storage.getPerformanceTimeline(firstProvider);
        console.log(JSON.stringify(timeline, null, 2));
      }
    } else {
      console.log('⚠️ Directory results non trovata');
    }
    
    console.log('==================================================');
    console.log('✅ Test completati con successo');
    
  } catch (error) {
    console.error(`❌ Errore durante i test: ${error.message}`);
    process.exit(1);
  }
}

main(); 