/**
 * Script per analizzare i risultati dei test dei provider LLM
 * 
 * Legge tutti i file JSON nella cartella 'results/' e genera un report comparativo
 * con metriche come tempi di risposta, lunghezza del contenuto, ecc.
 * 
 * Uso:
 *   npx tsx scripts/analyze-results.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { PROVIDER_NAMES } from '../src/providers/LLMRouter';

// Interfacce per i tipi di risultati
interface TestResult {
  provider: string;
  model: string;
  duration: number;
  prompt: any[];
  response: string;
  timestamp: string;
  responseLength?: number;
  error?: string;
}

interface CallResult extends TestResult {}

interface StreamResult extends TestResult {
  responseLength: number;
}

interface ProviderStats {
  provider: string;
  model: string;
  callTests: number;
  streamTests: number;
  avgCallDuration: number;
  avgStreamDuration: number;
  avgCallLength: number;
  avgStreamLength: number;
  minCallDuration: number;
  maxCallDuration: number;
  minStreamDuration: number;
  maxStreamDuration: number;
  successRate: number;
  errors: string[];
}

// Funzione principale
async function analyzeResults() {
  try {
    console.log('🔍 Analisi dei risultati dei test dei provider LLM...\n');
    
    // Ottieni tutti i file nella directory results
    const resultsDir = path.join(process.cwd(), 'results');
    let files: string[];
    
    try {
      files = await fs.readdir(resultsDir);
    } catch (err) {
      console.error(`❌ Errore nella lettura della directory 'results': ${err.message}`);
      console.log('Assicurati di aver eseguito i test con l\'opzione --export-json');
      return;
    }
    
    // Filtra solo i file JSON
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('❌ Nessun file di risultati trovato. Esegui prima i test con l\'opzione --export-json.');
      return;
    }
    
    console.log(`📊 Trovati ${jsonFiles.length} file di risultati.\n`);
    
    // Leggi tutti i file JSON
    const results: { call: CallResult[], stream: StreamResult[] } = {
      call: [],
      stream: []
    };
    
    for (const file of jsonFiles) {
      const filePath = path.join(resultsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      try {
        const data = JSON.parse(content);
        
        // Determina il tipo di test (call o stream) dal nome del file
        if (file.includes('_call_')) {
          results.call.push(data);
        } else if (file.includes('_stream_')) {
          results.stream.push(data);
        }
      } catch (err) {
        console.warn(`⚠️ Errore nel parsing del file ${file}: ${err.message}`);
      }
    }
    
    // Raggruppa i risultati per provider
    const providers = new Map<string, ProviderStats>();
    
    // Analizza i risultati delle chiamate sincrone
    for (const result of results.call) {
      const providerName = result.provider;
      
      if (!providers.has(providerName)) {
        providers.set(providerName, createEmptyStats(providerName, result.model));
      }
      
      const stats = providers.get(providerName)!;
      stats.callTests++;
      
      // Aggiungi i dati di durata
      if (!isNaN(result.duration)) {
        if (stats.avgCallDuration === -1) {
          stats.avgCallDuration = result.duration;
          stats.minCallDuration = result.duration;
          stats.maxCallDuration = result.duration;
        } else {
          // Calcola la media incrementale
          stats.avgCallDuration = (stats.avgCallDuration * (stats.callTests - 1) + result.duration) / stats.callTests;
          stats.minCallDuration = Math.min(stats.minCallDuration, result.duration);
          stats.maxCallDuration = Math.max(stats.maxCallDuration, result.duration);
        }
      }
      
      // Calcola la lunghezza della risposta
      const responseLength = result.response ? result.response.length : 0;
      if (stats.avgCallLength === -1) {
        stats.avgCallLength = responseLength;
      } else {
        stats.avgCallLength = (stats.avgCallLength * (stats.callTests - 1) + responseLength) / stats.callTests;
      }
      
      // Registra eventuali errori
      if (result.error) {
        stats.errors.push(result.error);
      }
    }
    
    // Analizza i risultati delle chiamate in streaming
    for (const result of results.stream) {
      const providerName = result.provider;
      
      if (!providers.has(providerName)) {
        providers.set(providerName, createEmptyStats(providerName, result.model));
      }
      
      const stats = providers.get(providerName)!;
      stats.streamTests++;
      
      // Aggiungi i dati di durata
      if (!isNaN(result.duration)) {
        if (stats.avgStreamDuration === -1) {
          stats.avgStreamDuration = result.duration;
          stats.minStreamDuration = result.duration;
          stats.maxStreamDuration = result.duration;
        } else {
          // Calcola la media incrementale
          stats.avgStreamDuration = (stats.avgStreamDuration * (stats.streamTests - 1) + result.duration) / stats.streamTests;
          stats.minStreamDuration = Math.min(stats.minStreamDuration, result.duration);
          stats.maxStreamDuration = Math.max(stats.maxStreamDuration, result.duration);
        }
      }
      
      // Calcola la lunghezza della risposta
      const responseLength = result.responseLength || (result.response ? result.response.length : 0);
      if (stats.avgStreamLength === -1) {
        stats.avgStreamLength = responseLength;
      } else {
        stats.avgStreamLength = (stats.avgStreamLength * (stats.streamTests - 1) + responseLength) / stats.streamTests;
      }
      
      // Registra eventuali errori
      if (result.error) {
        stats.errors.push(result.error);
      }
    }
    
    // Calcola il tasso di successo
    for (const stats of providers.values()) {
      const totalTests = stats.callTests + stats.streamTests;
      stats.successRate = totalTests > 0 ? ((totalTests - stats.errors.length) / totalTests) * 100 : 0;
    }
    
    // Genera il report
    generateReport(Array.from(providers.values()));
    
  } catch (err) {
    console.error(`❌ Errore nell'analisi dei risultati: ${err.message}`);
  }
}

// Crea un oggetto di statistiche vuoto per un provider
function createEmptyStats(provider: string, model: string): ProviderStats {
  return {
    provider,
    model,
    callTests: 0,
    streamTests: 0,
    avgCallDuration: -1,
    avgStreamDuration: -1,
    avgCallLength: -1,
    avgStreamLength: -1,
    minCallDuration: Infinity,
    maxCallDuration: -1,
    minStreamDuration: Infinity,
    maxStreamDuration: -1,
    successRate: 0,
    errors: []
  };
}

// Genera un report formattato
function generateReport(stats: ProviderStats[]) {
  console.log('📊 REPORT COMPARATIVO DEI PROVIDER LLM 📊');
  console.log('='.repeat(100));
  console.log('Provider'.padEnd(15), '| Modello'.padEnd(25), '| Tempo Medio (s)'.padEnd(25), '| Lunghezza Media'.padEnd(25), '| Tasso di Successo');
  console.log('-'.repeat(100));
  
  // Ordina i provider per velocità di risposta (call)
  const sortedByCallSpeed = [...stats].filter(s => s.avgCallDuration > 0).sort((a, b) => a.avgCallDuration - b.avgCallDuration);
  
  // Stampa la tabella principale
  for (const stat of stats) {
    const callTime = stat.avgCallDuration > 0 ? stat.avgCallDuration.toFixed(2) + 's' : 'N/A';
    const streamTime = stat.avgStreamDuration > 0 ? stat.avgStreamDuration.toFixed(2) + 's' : 'N/A';
    const callLength = stat.avgCallLength > 0 ? Math.round(stat.avgCallLength).toString() : 'N/A';
    const streamLength = stat.avgStreamLength > 0 ? Math.round(stat.avgStreamLength).toString() : 'N/A';
    
    console.log(
      stat.provider.padEnd(15),
      `| ${stat.model.substring(0, 22).padEnd(23)}`,
      `| Call: ${callTime.padEnd(8)} Stream: ${streamTime.padEnd(8)}`,
      `| Call: ${callLength.padEnd(8)} Stream: ${streamLength.padEnd(8)}`,
      `| ${stat.successRate.toFixed(1)}%`
    );
  }
  
  console.log('='.repeat(100));
  
  // Provider più veloci (call)
  if (sortedByCallSpeed.length > 0) {
    console.log('\n🏆 PROVIDER PIÙ VELOCI (CALL)');
    console.log('-'.repeat(50));
    
    for (let i = 0; i < Math.min(3, sortedByCallSpeed.length); i++) {
      const stat = sortedByCallSpeed[i];
      console.log(`${i + 1}. ${stat.provider} (${stat.model}): ${stat.avgCallDuration.toFixed(2)}s`);
    }
  }
  
  // Provider con risposte più lunghe
  const sortedByLength = [...stats].filter(s => s.avgCallLength > 0).sort((a, b) => b.avgCallLength - a.avgCallLength);
  
  if (sortedByLength.length > 0) {
    console.log('\n📝 PROVIDER CON RISPOSTE PIÙ DETTAGLIATE');
    console.log('-'.repeat(50));
    
    for (let i = 0; i < Math.min(3, sortedByLength.length); i++) {
      const stat = sortedByLength[i];
      console.log(`${i + 1}. ${stat.provider} (${stat.model}): ${Math.round(stat.avgCallLength)} caratteri`);
    }
  }
  
  // Provider con errori
  const withErrors = stats.filter(s => s.errors.length > 0);
  
  if (withErrors.length > 0) {
    console.log('\n⚠️ PROVIDER CON ERRORI');
    console.log('-'.repeat(50));
    
    for (const stat of withErrors) {
      console.log(`${stat.provider} (${stat.model}): ${stat.errors.length} errori`);
      for (let i = 0; i < Math.min(2, stat.errors.length); i++) {
        console.log(`  - ${stat.errors[i].substring(0, 100)}${stat.errors[i].length > 100 ? '...' : ''}`);
      }
      if (stat.errors.length > 2) {
        console.log(`  - ... e altri ${stat.errors.length - 2} errori`);
      }
    }
  }
  
  // Statistiche generali
  console.log('\n📈 STATISTICHE GENERALI');
  console.log('-'.repeat(50));
  console.log(`Provider analizzati: ${stats.length}`);
  console.log(`Test di chiamata totali: ${stats.reduce((sum, s) => sum + s.callTests, 0)}`);
  console.log(`Test di streaming totali: ${stats.reduce((sum, s) => sum + s.streamTests, 0)}`);
  
  const avgSuccessRate = stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length;
  console.log(`Tasso di successo medio: ${avgSuccessRate.toFixed(1)}%`);
  
  // Suggerimenti
  if (avgSuccessRate < 80) {
    console.log('\n⚠️ SUGGERIMENTI');
    console.log('-'.repeat(50));
    console.log('- Verifica le API key e le configurazioni dei provider con errori');
    console.log('- Controlla che i servizi locali (Ollama, LM Studio, ecc.) siano in esecuzione');
    console.log('- Verifica che i modelli specificati siano disponibili nei provider');
  }
  
  console.log('\n✅ Analisi completata!');
}

// Esegui l'analisi
analyzeResults(); 