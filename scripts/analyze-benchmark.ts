/**
 * Script per analizzare i dati storici dei benchmark LLM
 * 
 * Uso:
 *   npx tsx scripts/analyze-benchmark.ts [provider] [giorni]
 * 
 * Esempio:
 *   npx tsx scripts/analyze-benchmark.ts openai 30
 *   npx tsx scripts/analyze-benchmark.ts all 90
 */

import { BenchmarkStorage } from '../src/benchmark/BenchmarkStorage';
import fs from 'fs/promises';
import path from 'path';

// Funzione principale
async function analyzeBenchmarkData() {
  try {
    // Inizializza lo storage dei benchmark
    console.log('🔍 Inizializzazione storage benchmark...');
    const storage = new BenchmarkStorage();
    await storage.initialize();
    
    // Recupera i parametri dalla riga di comando
    const providerFilter = process.argv[2]?.toLowerCase() || 'all';
    const daysBack = parseInt(process.argv[3] || '30', 10);
    
    if (isNaN(daysBack) || daysBack <= 0) {
      throw new Error('Il parametro "giorni" deve essere un numero positivo');
    }
    
    console.log(`📊 Analisi benchmark per: ${providerFilter === 'all' ? 'Tutti i provider' : providerFilter}`);
    console.log(`📅 Periodo: ultimi ${daysBack} giorni`);
    console.log('='.repeat(80));
    
    // Ottieni le sessioni recenti
    const sessions = storage.getSessions();
    const recentSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      return sessionDate >= cutoffDate;
    });
    
    console.log(`📚 Sessioni trovate: ${sessions.length}`);
    console.log(`📚 Sessioni recenti (${daysBack} giorni): ${recentSessions.length}`);
    
    if (recentSessions.length === 0) {
      console.log('\n⚠️ Nessuna sessione trovata nel periodo specificato.');
      return;
    }
    
    // Analisi per provider
    const providerStats = storage.getProviderStats(daysBack);
    
    if (Object.keys(providerStats).length === 0) {
      console.log('\n⚠️ Nessun dato trovato per il periodo specificato.');
      return;
    }
    
    // Filtra per provider specifico se richiesto
    let statsToShow = providerStats;
    if (providerFilter !== 'all') {
      statsToShow = {};
      for (const provider in providerStats) {
        if (provider.toLowerCase() === providerFilter.toLowerCase()) {
          statsToShow[provider] = providerStats[provider];
        }
      }
      
      if (Object.keys(statsToShow).length === 0) {
        throw new Error(`Nessun dato trovato per il provider "${providerFilter}"`);
      }
    }
    
    // Visualizza le statistiche
    console.log('\n📊 STATISTICHE COMPLESSIVE PER PROVIDER');
    console.log('-'.repeat(80));
    console.log('Provider'.padEnd(15), '| Modelli'.padEnd(25), '| Test'.padEnd(10), '| Durata Media (s)'.padEnd(25), '| Risposte Media (char)'.padEnd(25), '| Successo');
    console.log('-'.repeat(80));
    
    for (const [provider, stats] of Object.entries(statsToShow)) {
      const models = stats.models.length > 2 
        ? `${stats.models.slice(0, 2).join(', ')}... (${stats.models.length})`
        : stats.models.join(', ');
        
      const callDuration = stats.avgCallDuration ? stats.avgCallDuration.toFixed(2) + 's' : 'N/A';
      const streamDuration = stats.avgStreamDuration ? stats.avgStreamDuration.toFixed(2) + 's' : 'N/A';
      const callLength = stats.avgCallLength ? Math.round(stats.avgCallLength) : 'N/A';
      const streamLength = stats.avgStreamLength ? Math.round(stats.avgStreamLength) : 'N/A';
      
      console.log(
        provider.padEnd(15),
        `| ${models.substring(0, 23).padEnd(23)}`,
        `| ${stats.totalTests}`.padEnd(10),
        `| Call: ${callDuration.padEnd(8)} Stream: ${streamDuration.padEnd(8)}`,
        `| Call: ${String(callLength).padEnd(8)} Stream: ${String(streamLength).padEnd(8)}`,
        `| ${stats.successRate.toFixed(1)}%`
      );
    }
    
    // Se è selezionato un provider specifico, analizza la performance nel tempo
    if (providerFilter !== 'all') {
      const timeStats = storage.getPerformanceTimeline(providerFilter, 'day');
      
      if (timeStats.length > 0) {
        console.log('\n📈 TREND DI PERFORMANCE NEL TEMPO');
        console.log('-'.repeat(80));
        console.log('Data'.padEnd(12), '| Test'.padEnd(10), '| Durata Media (s)'.padEnd(25), '| Errori'.padEnd(15));
        console.log('-'.repeat(80));
        
        for (const stat of timeStats) {
          const callDuration = stat.avgCallDuration ? stat.avgCallDuration.toFixed(2) + 's' : 'N/A';
          const streamDuration = stat.avgStreamDuration ? stat.avgStreamDuration.toFixed(2) + 's' : 'N/A';
          
          console.log(
            stat.period.padEnd(12),
            `| ${stat.totalTests}`.padEnd(10),
            `| Call: ${callDuration.padEnd(8)} Stream: ${streamDuration.padEnd(8)}`,
            `| ${stat.errors} (${stat.errorRate.toFixed(1)}%)`
          );
        }
        
        // Salva i dati per visualizzazione grafica
        await savePlotData(providerFilter, timeStats);
      }
    }
    
    // Visualizza i provider più veloci e con risposte più lunghe
    if (providerFilter === 'all') {
      // Provider più veloci (call)
      const fastestProviders = Object.entries(providerStats)
        .filter(([_, stats]) => stats.avgCallDuration > 0)
        .sort((a, b) => a[1].avgCallDuration - b[1].avgCallDuration)
        .slice(0, 3);
      
      if (fastestProviders.length > 0) {
        console.log('\n🏆 PROVIDER PIÙ VELOCI (CALL)');
        console.log('-'.repeat(50));
        
        for (let i = 0; i < fastestProviders.length; i++) {
          const [provider, stats] = fastestProviders[i];
          console.log(`${i + 1}. ${provider}: ${stats.avgCallDuration.toFixed(2)}s`);
        }
      }
      
      // Provider con risposte più lunghe
      const verboseProviders = Object.entries(providerStats)
        .filter(([_, stats]) => stats.avgCallLength > 0)
        .sort((a, b) => b[1].avgCallLength - a[1].avgCallLength)
        .slice(0, 3);
      
      if (verboseProviders.length > 0) {
        console.log('\n📝 PROVIDER CON RISPOSTE PIÙ DETTAGLIATE');
        console.log('-'.repeat(50));
        
        for (let i = 0; i < verboseProviders.length; i++) {
          const [provider, stats] = verboseProviders[i];
          console.log(`${i + 1}. ${provider}: ${Math.round(stats.avgCallLength)} caratteri`);
        }
      }
      
      // Provider con miglior tasso di successo
      const reliableProviders = Object.entries(providerStats)
        .filter(([_, stats]) => stats.totalTests >= 5) // Almeno 5 test
        .sort((a, b) => b[1].successRate - a[1].successRate)
        .slice(0, 3);
      
      if (reliableProviders.length > 0) {
        console.log('\n🔒 PROVIDER PIÙ AFFIDABILI');
        console.log('-'.repeat(50));
        
        for (let i = 0; i < reliableProviders.length; i++) {
          const [provider, stats] = reliableProviders[i];
          console.log(`${i + 1}. ${provider}: ${stats.successRate.toFixed(1)}% successo (${stats.totalTests} test)`);
        }
      }
    }
    
    console.log('\n✅ Analisi completata!');
    
  } catch (error) {
    console.error(`❌ ERRORE: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Salva i dati per il plotting
 */
async function savePlotData(provider: string, timeStats: any[]): Promise<void> {
  try {
    const plotDir = path.join(process.cwd(), 'benchmark', 'plots');
    await fs.mkdir(plotDir, { recursive: true });
    
    const plotData = {
      provider,
      timestamps: timeStats.map(s => s.period),
      callDurations: timeStats.map(s => s.avgCallDuration || null),
      streamDurations: timeStats.map(s => s.avgStreamDuration || null),
      errorRates: timeStats.map(s => s.errorRate || 0),
      testCounts: timeStats.map(s => s.totalTests || 0)
    };
    
    const fileName = `${provider}_trend_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(plotDir, fileName);
    
    await fs.writeFile(
      filePath,
      JSON.stringify(plotData, null, 2),
      'utf8'
    );
    
    console.log(`\n📊 Dati per i grafici salvati in: ${filePath}`);
    console.log('Puoi utilizzarli con i tool di visualizzazione o nel dashboard web.');
  } catch (err) {
    console.warn(`⚠️ Errore nel salvataggio dei dati di plotting: ${err.message}`);
  }
}

// Esegui l'analisi
analyzeBenchmarkData(); 