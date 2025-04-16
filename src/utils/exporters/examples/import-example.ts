/**
 * Esempi di utilizzo del sistema di importazione
 * @module utils/exporters/examples
 */

import {
  importSession,
  importFromString,
  importFromBuffer,
  detectFormatFromExtension,
  convertFormat,
  exportSession,
} from '../index';
import { ExportFormat } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { createChatMessage } from "../../../src/shared/types/chat.types";

/**
 * Esempio 1: Importazione da file
 */
async function importFromFile() {
  try {
    // Importa da un file JSON
    const jsonFilePath = path.join(__dirname, 'examples', 'sessione.json');
    const session = await importSession(jsonFilePath);

    console.log('Sessione importata da JSON:');
    console.log(`- ${session.messages?.length || 0} messaggi`);
    console.log(`- Modello: ${session.modelId || 'non specificato'}`);

    return session;
  } catch (error) {
    console.error("Errore nell'importazione da file:", error);
  }
}

/**
 * Esempio 2: Rilevamento automatico del formato
 */
function detectFormat() {
  try {
    // Rileva il formato da vari tipi di file
    const files = [
      'conversazione.json',
      'prompt.yaml',
      'documento.md',
      'dati.csv',
      'report.html',
      'sconosciuto.xyz',
    ];

    console.log('Rilevamento formato dai nomi file:');
    for (const file of files) {
      const format = detectFormatFromExtension(file);
      console.log(`- ${file}: ${format || 'Formato sconosciuto'}`);
    }
  } catch (error) {
    console.error('Errore nel rilevamento formato:', error);
  }
}

/**
 * Esempio 3: Importazione da stringa
 */
function importString() {
  try {
    // String in formato Markdown
    const markdownContent = `# Sessione di esempio

**Modello**: gpt-4  
**Data**: ${new Date().toLocaleDateString()}  

## 💬 Conversazione

### 👤 Utente

Come funziona l'importazione?

### 🤖 Assistente

L'importazione permette di caricare sessioni da vari formati come JSON, YAML, Markdown, CSV e HTML.
`;

    // Importa dalla stringa Markdown
    const session = importFromString(markdownContent, 'Markdown');

    console.log('Sessione importata da Markdown:');
    console.log(`- ${session.messages?.length || 0} messaggi`);
    console.log(`- Primo messaggio: ${session.messages?.[0].content.slice(0, 30)}...`);

    return session;
  } catch (error) {
    console.error("Errore nell'importazione da stringa:", error);
  }
}

/**
 * Esempio 4: Conversione tra formati
 */
function convertBetweenFormats() {
  try {
    // String in formato CSV
    const csvContent = `timestamp,role,content
2023-04-12T10:00:00Z,system,Sei un assistente AI
2023-04-12T10:01:00Z,user,Puoi convertire tra formati?
2023-04-12T10:02:00Z,assistant,"Certo, posso convertire tra JSON, YAML, Markdown, CSV e HTML."`;

    // Converti da CSV a JSON
    const jsonContent = convertFormat(csvContent, 'CSV', 'JSON', { pretty: true });
    console.log('\nConversione da CSV a JSON:');
    console.log(jsonContent);

    // Converti da CSV a Markdown
    const markdownContent = convertFormat(csvContent, 'CSV', 'Markdown');
    console.log('\nConversione da CSV a Markdown:');
    console.log(markdownContent.slice(0, 200) + '...');

    // Converti da CSV a YAML
    const yamlContent = convertFormat(csvContent, 'CSV', 'YAML');
    console.log('\nConversione da CSV a YAML:');
    console.log(yamlContent.slice(0, 200) + '...');

    return { jsonContent, markdownContent, yamlContent };
  } catch (error) {
    console.error('Errore nella conversione tra formati:', error);
  }
}

/**
 * Esempio 5: Ciclo completo export-import
 */
function fullCycle() {
  try {
    // Crea una sessione di esempio
    const originalSession = {
      messages: [
        createChatMessage({role: 'system', content: 'Sei un assistente AI italiano.',
            timestamp: Date.now()
        }),
        createChatMessage({role: 'user', content: 'Puoi mostrare un ciclo completo di export-import?',
            timestamp: Date.now()
        }),
        createChatMessage({role: 'assistant', content: 'Certo! Ecco come funziona:\n\n1. Esportazione in Markdown\n2. Importazione dal Markdown\n3. Verifica che i dati siano corretti',
            timestamp: Date.now()
        }),
      ],
      settings: {
        temperature: 0.7,
        model: 'gpt-4',
        modelId: 'gpt-4',
      },
      systemPrompt: 'Sei un assistente AI italiano.',
      modelId: 'gpt-4',
      timestamp: Date.now(),
    };

    // Esporta in Markdown
    const markdownResult = exportSession(originalSession, 'Markdown');

    // Importa dal Markdown generato
    const importedSession = importFromString(markdownResult.content, 'Markdown');

    // Verifica che i dati corrispondano
    console.log('\nCiclo completo export-import:');
    console.log(`- Messaggi originali: ${originalSession.messages.length}`);
    console.log(`- Messaggi importati: ${importedSession.messages?.length || 0}`);

    // Verifica che i contenuti siano gli stessi
    const originFirstMsg = originalSession.messages[1].content;
    const importFirstMsg = importedSession.messages?.[0].content;

    console.log(
      `- Corrispondenza primo messaggio: ${importFirstMsg?.includes(originFirstMsg.slice(0, 20)) ? 'OK' : 'NON corrispondente'}`
    );

    return { originalSession, markdownResult, importedSession };
  } catch (error) {
    console.error('Errore nel ciclo completo:', error);
  }
}

/**
 * Esempio di importazione con validazione attiva
 */
async function importWithValidation() {
  console.log('\n--- Esempio: Importazione con validazione ---');

  // Sessione valida
  const validSession = JSON.stringify({
    messages: [createChatMessage({role: 'user', content: 'Esempio di messaggio valido',
        timestamp: Date.now()
    })],
  });

  // Sessione non valida (ruolo non stringa)
  const invalidSession = JSON.stringify({
    messages: [createChatMessage({role: 123, content: 'Questo non passerà la validazione',
        timestamp: Date.now()
    })],
  });

  try {
    // Importazione con validazione abilitata (default)
    const session = importFromString(validSession, 'JSON');
    console.log(`✅ Sessione valida importata: ${session.messages.length} messaggi`);

    // Tentiamo di importare una sessione non valida
    console.log('Tentativo di importare una sessione non valida...');
    importFromString(invalidSession, 'JSON');
  } catch (error) {
    console.log(
      `✅ Errore gestito correttamente: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    // Importazione senza validazione
    console.log('Importazione senza validazione di una sessione non valida...');
    const session = importFromString(invalidSession, 'JSON', { validate: false });
    console.log(`✅ Sessione importata senza validazione: ${JSON.stringify(session.messages[0])}`);
  } catch (error) {
    console.log(`❌ Errore inaspettato: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Esegui gli esempi
async function eseguiEsempi() {
  try {
    await importFromFile();
    detectFormat();
    importString();
    convertBetweenFormats();
    await fullCycle();
    await importWithValidation();
    console.log('\n✅ Tutti gli esempi eseguiti con successo');
  } catch (error) {
    console.error(
      `❌ Errore durante l'esecuzione degli esempi: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Esegui gli esempi se questo script viene eseguito direttamente
if (require.main === module) {
  eseguiEsempi()
    .then(() => console.log('\nTutti gli esempi completati.'))
    .catch((err) => console.error("Errore durante l'esecuzione degli esempi:", err));
}
