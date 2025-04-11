/**
 * Script di test per i provider LLM
 * 
 * Istruzioni per l'uso:
 * 1. Imposta le variabili d'ambiente per i provider da testare:
 *    - TEST_API_KEY: API key per provider remoti (OpenAI, Anthropic, ecc.)
 *    - TEST_BASE_URL: URL base per provider locali/remoti (opzionale)
 * 
 * 2. Esegui:
 *    npx tsx scripts/test-providers.ts [nome-provider] [opzioni]
 *    
 *    Se non specifichi un provider, verranno testati tutti.
 *    Esempio: npx tsx scripts/test-providers.ts openai
 *    
 *    Opzioni disponibili:
 *    --silent, --no-stream: Salta la richiesta interattiva per il test di streaming
 *    --only-stream: Esegue solo il test di streaming (salta la chiamata sincrona)
 *    --export-json: Salva i risultati in JSON nella cartella results/
 */

import { getProvider, PROVIDER_NAMES, SUPPORTED_PROVIDERS, isProviderSupported } from '../src/providers/LLMRouter';
import { LLMMessage } from '../src/providers/BaseLLMProvider';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

// Prompt di test standard
const TEST_PROMPT: LLMMessage[] = [
  { role: 'system', content: 'Sei un assistente AI utile, conciso e amichevole.' },
  { role: 'user', content: 'Ciao! Chi sei e cosa puoi fare? Rispondi brevemente in italiano.' }
];

// Configurazioni specifiche per ogni provider
const providerConfigs: Record<string, any> = {
  [PROVIDER_NAMES.OLLAMA]: {
    baseUrl: process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434',
    model: 'llama3'
  },
  [PROVIDER_NAMES.LM_STUDIO]: {
    baseUrl: process.env['LM_STUDIO_BASE_URL'] || 'http://localhost:1234/v1',
    model: 'default'
  },
  [PROVIDER_NAMES.GGUF]: {
    ggufConfig: {
      binaryPath: process.env['GGUF_BINARY_PATH'] || './bin/llm',
      modelsPath: process.env['GGUF_MODELS_PATH'] || './models',
      model: 'llama3'
    },
    model: 'llama3'
  },
  [PROVIDER_NAMES.LM_DEPLOY]: {
    baseUrl: process.env['LM_DEPLOY_BASE_URL'] || 'http://localhost:23333/v1',
    model: 'default'
  },
  [PROVIDER_NAMES.OPENAI]: {
    apiKey: process.env['OPENAI_API_KEY'] || process.env['TEST_API_KEY'],
    baseUrl: process.env['OPENAI_BASE_URL'],
    model: 'gpt-3.5-turbo'
  },
  [PROVIDER_NAMES.ANTHROPIC]: {
    apiKey: process.env['ANTHROPIC_API_KEY'] || process.env['TEST_API_KEY'],
    baseUrl: process.env['ANTHROPIC_BASE_URL'],
    model: 'claude-3-haiku-20240307'
  },
  [PROVIDER_NAMES.MISTRAL]: {
    apiKey: process.env['MISTRAL_API_KEY'] || process.env['TEST_API_KEY'],
    baseUrl: process.env['MISTRAL_BASE_URL'],
    model: 'mistral-small-latest'
  },
  [PROVIDER_NAMES.GROQ]: {
    apiKey: process.env['GROQ_API_KEY'] || process.env['TEST_API_KEY'],
    baseUrl: process.env['GROQ_BASE_URL'],
    model: 'llama3-70b-8192'
  },
  [PROVIDER_NAMES.GOOGLE_AI]: {
    apiKey: process.env['GOOGLE_AI_API_KEY'] || process.env['TEST_API_KEY'],
    baseUrl: process.env['GOOGLE_AI_BASE_URL'],
    model: 'gemini-pro'
  }
};

// Parsa gli argomenti della CLI
const silentMode = process.argv.includes('--silent') || process.argv.includes('--no-stream');
const onlyStream = process.argv.includes('--only-stream');
const exportJson = process.argv.includes('--export-json');

/**
 * Garantisce che la directory dei risultati esista
 */
async function ensureResultsDir(): Promise<void> {
  if (exportJson) {
    const resultsDir = path.join(process.cwd(), 'results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      console.warn(`⚠️ Impossibile creare la directory 'results': ${err.message}`);
    }
  }
}

/**
 * Esporta i risultati del test in un file JSON
 */
async function exportResults(providerName: string, type: 'call' | 'stream', data: any): Promise<void> {
  if (!exportJson) return;
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `results/${providerName}_${type}_${timestamp}.json`;
    
    await fs.writeFile(
      path.join(process.cwd(), filename),
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    console.log(`📊 Risultati esportati in: ${filename}`);
  } catch (err) {
    console.warn(`⚠️ Errore nell'esportazione dei risultati: ${err.message}`);
  }
}

/**
 * Test sincrono (call) di un provider
 */
async function testCall(providerName: string, config: any): Promise<boolean> {
  console.log(`\n📞 Test chiamata sincrona per ${providerName}...`);
  
  try {
    const provider = getProvider(providerName, config);
    const startTime = Date.now();
    
    const response = await provider.call(TEST_PROMPT, { model: config.model });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Risposta (${duration}s):`);
    console.log(`${response}`);
    
    if (exportJson) {
      await exportResults(providerName, 'call', {
        provider: providerName,
        model: config.model,
        duration: parseFloat(duration),
        prompt: TEST_PROMPT,
        response,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Errore nella chiamata sincrona: ${error.message}`);
    return false;
  }
}

/**
 * Test in streaming (stream) di un provider
 */
async function testStream(providerName: string, config: any): Promise<boolean> {
  console.log(`\n📡 Test streaming per ${providerName}...`);
  
  try {
    const provider = getProvider(providerName, config);
    const startTime = Date.now();
    
    process.stdout.write('Risposta: ');
    const stream = provider.stream(TEST_PROMPT, { model: config.model });
    
    let responseText = '';
    for await (const chunk of stream) {
      responseText += chunk;
      process.stdout.write(chunk);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Stream completato (${duration}s), ${responseText.length} caratteri`);
    
    if (exportJson) {
      await exportResults(providerName, 'stream', {
        provider: providerName,
        model: config.model,
        duration: parseFloat(duration),
        prompt: TEST_PROMPT,
        response: responseText,
        responseLength: responseText.length,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Errore nello streaming: ${error.message}`);
    return false;
  }
}

/**
 * Test completo di un provider
 */
async function testProvider(providerName: string): Promise<void> {
  console.log(`\n\n🔍 TESTANDO PROVIDER: ${providerName.toUpperCase()} 🔍`);
  console.log('='.repeat(50));
  
  const config = providerConfigs[providerName];
  
  if (!config) {
    console.error(`❌ Configurazione mancante per il provider: ${providerName}`);
    return;
  }
  
  // Gestione opzione --only-stream
  if (onlyStream) {
    console.log('ℹ️ Modalità solo streaming attiva, la chiamata sincrona verrà saltata');
    await testStream(providerName, config);
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Test di streaming completato per ${providerName}`);
    return;
  }
  
  // Test di entrambi i metodi
  let callSuccess = false;
  
  try {
    callSuccess = await testCall(providerName, config);
    
    if (callSuccess) {
      if (silentMode) {
        console.log('⚠️ Test di streaming saltato per modalità silenziosa.');
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        // Chiedi all'utente se vuole procedere con il test di streaming
        const answer = await new Promise<string>(resolve => {
          rl.question('\nVuoi procedere con il test di streaming? (s/n) ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase().startsWith('s')) {
          await testStream(providerName, config);
        } else {
          console.log('Test di streaming saltato.');
        }
      }
    }
  } catch (error) {
    console.error(`❌ Errore generale nel test del provider ${providerName}:`, error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`${callSuccess ? '✅' : '❌'} Test completato per ${providerName}`);
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🧪 Script di test per provider LLM');
  console.log('='.repeat(50));
  
  // Verifica opzioni
  if (silentMode) console.log('ℹ️ Modalità silenziosa attiva');
  if (onlyStream) console.log('ℹ️ Modalità solo streaming attiva');
  if (exportJson) console.log('ℹ️ Esportazione JSON risultati attiva');
  
  // Crea directory per risultati se necessario
  await ensureResultsDir();
  
  // Controlla se è stato specificato un provider specifico
  const specificProvider = process.argv.find(arg => !arg.startsWith('--') && !arg.includes('test-providers') && !arg.includes('tsx'))?.toLowerCase();
  
  if (specificProvider) {
    if (!isProviderSupported(specificProvider)) {
      console.error(`❌ Provider non supportato: ${specificProvider}`);
      console.log(`Provider supportati: ${SUPPORTED_PROVIDERS.join(', ')}`);
      process.exit(1);
    }
    
    await testProvider(specificProvider);
  } else {
    // Test di tutti i provider
    console.log('🚀 Avvio test di tutti i provider...');
    
    for (const providerName of SUPPORTED_PROVIDERS) {
      await testProvider(providerName);
    }
    
    console.log('\n✅ Test completati per tutti i provider!');
  }
}

// Avvia lo script
main().catch(error => {
  console.error('❌ Errore generale:', error);
  process.exit(1);
}); 