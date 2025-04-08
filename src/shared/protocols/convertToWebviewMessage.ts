/**
 * @file convertToWebviewMessage.ts
 * @description Funzione di conversione per messaggi di WebView
 */

import { WebviewMessage, OutgoingWebviewMessage, LegacyWebviewMessage } from './webview.protocol.js';
import { validateWebviewMessage } from './validateWebviewMessage.test.js';

// Tipo per i messaggi legacy che potrebbero arrivare dall'estensione
interface LegacyExtensionMessage {
  type: string;
  payload?: Record<string, unknown>;
  action?: string;
  error?: string;
  apiConfiguration?: unknown;
  state?: Record<string, unknown>;
  id?: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Converte un messaggio legacy dell'estensione in un messaggio WebView standard
 * @param message Il messaggio da convertire
 * @returns Un messaggio WebView valido o null se la conversione fallisce
 */
export function convertToWebviewMessage(message: unknown): WebviewMessage | null {
  // Validazione iniziale
  if (!message || typeof message !== 'object') {
    console.warn('Conversione fallita: il messaggio non è un oggetto valido');
    return null;
  }

  // Cast al tipo legacy
  const legacyMessage = message as LegacyExtensionMessage;

  // Verifica che il tipo sia una stringa
  if (typeof legacyMessage.type !== 'string' || legacyMessage.type.trim() === '') {
    console.warn('Conversione fallita: il tipo del messaggio non è una stringa valida');
    return null;
  }

  // Inizializza il nuovo messaggio
  // Utilizziamo any per evitare problemi di tipizzazione durante la fase di migrazione
  const newMessage: any = {
    type: legacyMessage.type,
    source: 'extension',
  };

  // Se esiste un payload, lo copia
  if (legacyMessage.payload !== undefined) {
    newMessage.payload = legacyMessage.payload || {};
  } 
  // Se non esiste, crea un oggetto vuoto
  else {
    newMessage.payload = {};
  }

  // Copia l'ID se esiste
  if (legacyMessage.id) {
    newMessage.requestId = String(legacyMessage.id);
  }

  // Gestione campi speciali
  if (legacyMessage.error) {
    newMessage.error = String(legacyMessage.error);
    
    // Aggiunge anche al payload per compatibilità
    if (newMessage.payload) {
      newMessage.payload.error = legacyMessage.error;
    }
  }

  // Gestione stato
  if (legacyMessage.state && typeof legacyMessage.state === 'object') {
    if (newMessage.payload) {
      newMessage.payload = { ...newMessage.payload, ...legacyMessage.state };
    }

    // Gestione configurazione API nello stato
    if (legacyMessage.state.apiConfiguration) {
      if (newMessage.payload) {
        newMessage.payload.apiConfiguration = legacyMessage.state.apiConfiguration;
      }
    }
  }

  // Gestione diretta di apiConfiguration
  if (legacyMessage.apiConfiguration) {
    if (newMessage.payload) {
      newMessage.payload.apiConfiguration = legacyMessage.apiConfiguration;
    }
  }

  // Copia altri campi legacy nel payload (per retrocompatibilità)
  const skipFields = ['type', 'payload', 'id', 'requestId', 'source', 'error', 'state'];
  for (const key in legacyMessage) {
    if (Object.prototype.hasOwnProperty.call(legacyMessage, key) && !skipFields.includes(key)) {
      if (newMessage.payload) {
        newMessage.payload[key] = legacyMessage[key];
      }
    }
  }

  // Copia campi diretti per retrocompatibilità
  newMessage.key = legacyMessage.key;
  newMessage.value = legacyMessage.value;
  newMessage.content = legacyMessage.content;
  newMessage.settings = legacyMessage.settings;
  newMessage.text = legacyMessage.text;
  newMessage.apiConfiguration = legacyMessage.apiConfiguration;

  // Conversione finale al tipo WebviewMessage
  // Utilizziamo una cast diretta per superare le restrizioni del sistema di tipi durante la migrazione
  return newMessage as WebviewMessage;
} 