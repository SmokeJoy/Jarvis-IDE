/**
 * Script di test rapido per generare file JSON esempio
 */

import fs from 'fs/promises';
import path from 'path';

async function createSampleResults() {
  // Crea la directory results se non esiste
  const resultsDir = path.join(process.cwd(), 'results');
  try {
    await fs.mkdir(resultsDir, { recursive: true });
    console.log(`✅ Directory 'results' creata o già esistente`);
  } catch (err) {
    console.error(`❌ Errore nella creazione della directory 'results': ${err.message}`);
    return;
  }

  // Crea alcuni risultati di esempio
  const providers = ['openai', 'anthropic', 'groq', 'mistral', 'ollama'];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Genera risultati per chiamate sincrone
  for (const provider of providers) {
    const callResult = {
      provider,
      model: getModelForProvider(provider),
      duration: getRandomDuration(),
      prompt: [
        { role: 'system', content: 'Sei un assistente AI utile, conciso e amichevole.' },
        { role: 'user', content: 'Ciao! Chi sei e cosa puoi fare? Rispondi brevemente in italiano.' }
      ],
      response: generateSampleResponse(provider),
      timestamp: new Date().toISOString()
    };

    const filename = `results/${provider}_call_${timestamp}.json`;
    try {
      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(callResult, null, 2),
        'utf8'
      );
      console.log(`✅ File creato: ${filename}`);
    } catch (err) {
      console.error(`❌ Errore nella creazione del file ${filename}: ${err.message}`);
    }
  }

  // Genera risultati per chiamate in streaming
  for (const provider of providers) {
    const streamResult = {
      provider,
      model: getModelForProvider(provider),
      duration: getRandomDuration() * 1.2, // Lo streaming è tipicamente più lento
      prompt: [
        { role: 'system', content: 'Sei un assistente AI utile, conciso e amichevole.' },
        { role: 'user', content: 'Ciao! Chi sei e cosa puoi fare? Rispondi brevemente in italiano.' }
      ],
      response: generateSampleResponse(provider),
      responseLength: generateSampleResponse(provider).length,
      timestamp: new Date().toISOString()
    };

    const filename = `results/${provider}_stream_${timestamp}.json`;
    try {
      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(streamResult, null, 2),
        'utf8'
      );
      console.log(`✅ File creato: ${filename}`);
    } catch (err) {
      console.error(`❌ Errore nella creazione del file ${filename}: ${err.message}`);
    }
  }

  // Aggiungi un risultato con errore
  const errorResult = {
    provider: 'gguf',
    model: 'llama3',
    duration: 0,
    prompt: [
      { role: 'system', content: 'Sei un assistente AI utile, conciso e amichevole.' },
      { role: 'user', content: 'Ciao! Chi sei e cosa puoi fare? Rispondi brevemente in italiano.' }
    ],
    response: '',
    error: 'GGUFProvider richiede ggufConfig con binaryPath e modelsPath',
    timestamp: new Date().toISOString()
  };

  const errorFilename = `results/gguf_call_${timestamp}.json`;
  try {
    await fs.writeFile(
      path.join(process.cwd(), errorFilename),
      JSON.stringify(errorResult, null, 2),
      'utf8'
    );
    console.log(`✅ File creato: ${errorFilename}`);
  } catch (err) {
    console.error(`❌ Errore nella creazione del file ${errorFilename}: ${err.message}`);
  }

  console.log('\n✅ Generazione di esempi completata!');
  console.log('Ora puoi eseguire: npm run analyze:results');
}

// Helper per generare durate casuali realistiche
function getRandomDuration(): number {
  const providers = {
    openai: { min: 0.8, max: 2.5 },
    anthropic: { min: 1.2, max: 3.0 },
    groq: { min: 0.5, max: 1.5 },
    mistral: { min: 0.9, max: 2.2 },
    ollama: { min: 1.5, max: 4.0 }
  };
  
  // Durata casuale tra 0.8 e 4 secondi
  return Math.random() * 3.2 + 0.8;
}

// Helper per ottenere il modello corretto per provider
function getModelForProvider(provider: string): string {
  const models = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307',
    groq: 'llama3-70b-8192',
    mistral: 'mistral-small-latest',
    ollama: 'llama3',
    gguf: 'llama3'
  };
  
  return models[provider] || 'default';
}

// Helper per generare risposte di esempio
function generateSampleResponse(provider: string): string {
  const responses = {
    openai: "Ciao! Sono GPT, un assistente AI sviluppato da OpenAI. Posso aiutarti con informazioni, spiegazioni, suggerimenti creativi, e molto altro. Sono qui per rispondere alle tue domande in modo chiaro e utile.",
    anthropic: "Ciao! Sono Claude, un assistente AI creato da Anthropic. Posso aiutarti con ricerche, scrittura, analisi di testi, suggerimenti creativi e altro ancora. Sono progettato per essere utile, innocuo e onesto nelle mie risposte.",
    groq: "Ciao! Sono un assistente AI basato su Llama di Meta, ottimizzato per l'inferenza rapida tramite Groq. Posso aiutarti con varie attività come rispondere a domande, fornire informazioni e assistere in compiti creativi o analitici.",
    mistral: "Ciao! Sono un assistente AI di Mistral AI. Posso aiutarti con la scrittura di testi, la risposta a domande, l'analisi di informazioni e molte altre attività. Sono progettato per essere utile, accurato e rispettoso.",
    ollama: "Ciao! Sono un assistente AI basato su Llama, eseguito localmente tramite Ollama. Posso aiutarti con informazioni, spiegazioni e suggerimenti su vari argomenti, mantenendo la tua privacy poiché funziono completamente sul tuo dispositivo."
  };
  
  return responses[provider] || "Ciao! Sono un assistente AI. Posso aiutarti a rispondere a domande e fornire informazioni su vari argomenti.";
}

// Esegui la generazione dei campioni
createSampleResults(); 