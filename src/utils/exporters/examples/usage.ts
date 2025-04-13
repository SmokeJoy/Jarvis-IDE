/**
 * Esempi di utilizzo del sistema di esportazione unificato
 * @module utils/exporters/examples
 */

import { exportSession, exportSessionToFile } from '../index';
import { ExportableSession, ExportFormat } from '../types';
import { createSafeMessage } from "../../../shared/types/message";

// Esempio di sessione di chat
const sessionExample: ExportableSession = {
  messages: [
    createSafeMessage({role: 'system', content: 'Sei un assistente AI disponibile in italiano.'}),
    createSafeMessage({role: 'user', content: "Ciao, come funziona l'esportazione?"}),
    createSafeMessage({role: 'assistant', content: "L'esportazione permette di salvare la conversazione in vari formati come JSON o YAML. È utile per il backup o la condivisione dei dati."}),
  ],
  settings: {
    temperature: 0.7,
    model: 'gpt-4',
    maxTokens: 1000,
  },
  systemPrompt: 'Sei un assistente AI disponibile in italiano.',
  contextFiles: ['README.md', 'documentation.md'],
  modelId: 'gpt-4',
  timestamp: Date.now(),
};

/**
 * Esempio 1: Esportazione semplice in JSON
 */
function esportazioneJSON() {
  try {
    // Opzione base, esporta in JSON
    const result = exportSession(sessionExample);
    console.log('Contenuto JSON:', result.content);
    console.log('Timestamp esportazione:', new Date(result.timestamp).toISOString());

    return result;
  } catch (error) {
    console.error("Errore nell'esempio di esportazione JSON:", error);
  }
}

/**
 * Esempio 2: Esportazione in YAML con opzioni di sanitizzazione
 */
function esportazioneYAML() {
  try {
    // Esporta in YAML con opzioni di sanitizzazione
    const result = exportSession(sessionExample, 'YAML', {
      pretty: true,
      removeNull: true,
      removeUndefined: true,
      maxStringLength: 50, // Limita lunghezza stringhe
      maxArrayLength: 5, // Limita numero elementi negli array
      maxDepth: 3, // Limita profondità oggetti
    });

    console.log('Contenuto YAML:', result.content);
    return result;
  } catch (error) {
    console.error("Errore nell'esempio di esportazione YAML:", error);
  }
}

/**
 * Esempio 3: Esportazione e salvataggio su file
 */
async function esportazioneSuFile() {
  try {
    // Definisci il formato e il percorso
    const formato: ExportFormat = 'JSON';
    const percorso = './output/sessione-chat.json';

    // Esporta e salva su file
    const filePath = await exportSessionToFile(sessionExample, percorso, formato, {
      pretty: true,
      removeNull: true,
    });

    console.log(`File salvato in: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Errore nell'esempio di esportazione su file:", error);
  }
}

// Esegui gli esempi
async function eseguiEsempi() {
  console.log('=== ESEMPIO 1: ESPORTAZIONE JSON ===');
  esportazioneJSON();

  console.log('\n=== ESEMPIO 2: ESPORTAZIONE YAML ===');
  esportazioneYAML();

  console.log('\n=== ESEMPIO 3: ESPORTAZIONE SU FILE ===');
  await esportazioneSuFile();
}

// Esegui gli esempi se questo script viene eseguito direttamente
if (require.main === module) {
  eseguiEsempi()
    .then(() => console.log('Tutti gli esempi completati.'))
    .catch((err) => console.error("Errore durante l'esecuzione degli esempi:", err));
}
