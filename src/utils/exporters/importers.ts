/**
 * Modulo per l'importazione di sessioni da vari formati
 * @module utils/exporters/importers
 */

import { fromJSON, fromYAML } from './serializers';
import { ExportFormat, ExportableSession, ExportError } from './types';
import { Logger } from '../logger';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { createChatMessage } from "../../src/shared/types/chat.types";

const readFileAsync = promisify(fs.readFile);
const logger = Logger.getInstance('importers');

/**
 * Opzioni per l'importazione di sessioni
 */
export interface ImportOptions {
  /**
   * Codifica del file da importare
   * @default 'utf-8'
   */
  encoding?: string;

  /**
   * Se true, valida la sessione importata secondo lo schema appropriato
   * @default true
   */
  validate?: boolean;

  /**
   * Se true, applica la sanitizzazione alla sessione importata
   * @default true
   */
  sanitize?: boolean;

  /**
   * Formato di importazione. Se non specificato, viene determinato dall'estensione del file
   */
  format?: ExportFormat;
}

/**
 * Aggiungo l'interfaccia per la sessione esportabile
 */
export interface ExportableSession {
  messages: Array<{
    role: string;
    content: string;
    [key: string]: any;
  }>;
  settings?: Record<string, any>;
  contextFiles?: Array<{
    name: string;
    content: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Valida una sessione esportabile secondo le regole minime previste
 * @param session La sessione da validare
 * @returns true se la sessione è valida, false altrimenti
 */
export function validateExportableSession(session: unknown): session is ExportableSession {
  if (!session || typeof session !== 'object') return false;

  const typedSession = session as ExportableSession;

  // Verifica che messages sia un array
  if (!Array.isArray(typedSession.messages)) {
    Logger.debug('Validazione fallita: messages non è un array');
    return false;
  }

  // Verifica che ogni messaggio abbia un ruolo e un contenuto validi
  for (const msg of typedSession.messages) {
    if (!msg || typeof msg !== 'object') {
      Logger.debug('Validazione fallita: messaggio non è un oggetto');
      return false;
    }

    if (typeof msg.role !== 'string' || !msg.role.trim()) {
      Logger.debug('Validazione fallita: ruolo mancante o non valido');
      return false;
    }

    if (typeof msg.content !== 'string') {
      Logger.debug('Validazione fallita: contenuto non è una stringa');
      return false;
    }
  }

  // Verifica settings se presente
  if (
    typedSession.settings !== undefined &&
    (typeof typedSession.settings !== 'object' || typedSession.settings === null)
  ) {
    Logger.debug('Validazione fallita: settings non è un oggetto');
    return false;
  }

  // Verifica contextFiles se presente
  if (typedSession.contextFiles !== undefined) {
    if (!Array.isArray(typedSession.contextFiles)) {
      Logger.debug('Validazione fallita: contextFiles non è un array');
      return false;
    }

    for (const file of typedSession.contextFiles) {
      if (!file || typeof file !== 'object') {
        Logger.debug('Validazione fallita: file di contesto non è un oggetto');
        return false;
      }

      if (typeof file.name !== 'string' || !file.name.trim()) {
        Logger.debug('Validazione fallita: nome file di contesto mancante o non valido');
        return false;
      }

      if (typeof file.content !== 'string') {
        Logger.debug('Validazione fallita: contenuto file di contesto non è una stringa');
        return false;
      }
    }
  }

  return true;
}

/**
 * Determina il formato di esportazione in base all'estensione del file
 *
 * @param filePath - Percorso del file
 * @returns Formato di esportazione, o null se non riconosciuto
 */
export function detectFormatFromExtension(filePath: string): ExportFormat | null {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.json':
      return 'JSON';
    case '.yaml':
    case '.yml':
      return 'YAML';
    case '.md':
    case '.markdown':
      return 'Markdown';
    case '.csv':
      return 'CSV';
    case '.html':
    case '.htm':
      return 'HTML';
    default:
      return null;
  }
}

/**
 * Importa una sessione da una stringa nel formato specificato
 * @param content Il contenuto da importare
 * @param format Il formato del contenuto
 * @param options Opzioni per l'importazione
 * @returns La sessione importata
 */
export function importFromString(
  content: string,
  format: ExportFormat,
  options: Partial<ImportOptions> = {}
): ExportableSession {
  const defaultOptions: ImportOptions = {
    encoding: 'utf8',
    format,
    validate: true, // Validazione abilitata di default
  };

  const mergedOptions = { ...defaultOptions, ...options };
  let session: ExportableSession;

  try {
    switch (format) {
      case 'JSON':
        session = fromJSON(content);
        break;
      case 'YAML':
        session = fromYAML(content);
        break;
      case 'Markdown':
        session = importFromMarkdown(content);
        break;
      case 'CSV':
        session = importFromCSV(content);
        break;
      case 'HTML':
        session = importFromHTML(content);
        break;
      default:
        throw new ExportError(`Formato di importazione '${format}' non supportato`);
    }

    // Validazione della sessione importata
    if (mergedOptions.validate && !validateExportableSession(session)) {
      throw new ExportError(`La sessione importata non è valida secondo lo schema previsto`);
    }

    Logger.debug(`Importazione da ${format} completata con successo`);
    return session;
  } catch (error) {
    Logger.error(
      `Errore nell'importazione da ${format}: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error instanceof ExportError
      ? error
      : new ExportError(
          `Errore nell'importazione da ${format}: ${error instanceof Error ? error.message : String(error)}`
        );
  }
}

/**
 * Importa una sessione da un file
 *
 * @param filePath - Percorso del file da importare
 * @param options - Opzioni di importazione
 * @returns Promise che si risolve con la sessione importata
 * @throws {ExportError} Se l'importazione fallisce
 */
export async function importSession(
  filePath: string,
  options: ImportOptions = {}
): Promise<ExportableSession> {
  try {
    logger.debug(`Importazione da file: ${filePath}`);

    // Verifica che il file esista
    if (!fs.existsSync(filePath)) {
      throw new ExportError(`Il file non esiste: ${filePath}`);
    }

    // Determina il formato, se non specificato
    let format = options.format;
    if (!format) {
      format = detectFormatFromExtension(filePath);
      if (!format) {
        throw new ExportError(`Impossibile determinare il formato dal file: ${filePath}`);
      }
    }

    // Leggi il file
    const encoding = options.encoding || 'utf-8';
    const content = await readFileAsync(filePath, { encoding: encoding as BufferEncoding });

    // Importa dalla stringa
    const session = importFromString(content, format);

    logger.info(`Importazione da file ${filePath} completata con successo`);
    return session;
  } catch (error) {
    logger.error(`Errore durante l'importazione da file ${filePath}`, { cause: error });
    throw new ExportError(
      `Errore durante l'importazione da file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Importa una sessione da un buffer nel formato specificato
 * @param buffer Il buffer da importare
 * @param format Il formato del buffer
 * @param options Opzioni per l'importazione
 * @returns La sessione importata
 */
export function importFromBuffer(
  buffer: Buffer,
  format: ExportFormat,
  options: Partial<ImportOptions> = {}
): ExportableSession {
  const defaultOptions: ImportOptions = {
    encoding: 'utf8',
    format,
    validate: true, // Validazione abilitata di default
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const content = buffer.toString(mergedOptions.encoding);

  return importFromString(content, format, mergedOptions);
}

/**
 * Importa una sessione da un contenuto Markdown
 * Questa è una implementazione basica che estrae i messaggi da un file Markdown
 *
 * @param content - Contenuto Markdown
 * @returns Sessione importata
 */
function importFromMarkdown(content: string): ExportableSession {
  // Implementazione basica per estrazione di messaggi da Markdown
  // In una implementazione reale, questo dovrebbe essere più sofisticato

  const session: ExportableSession = {
    messages: [],
    settings: {
      modelId: 'unknown',
      temperature: 0.7,
    },
  };

  // Estrai il titolo come systemPrompt (se presente)
  const titleMatch = content.match(/^# ([^\n]+)/m);
  if (titleMatch) {
    session.systemPrompt = titleMatch[1];
  }

  // Estrai i messaggi (Pattern: ### 🔧 [Ruolo]\n\n[Contenuto])
  const messagePattern = /### (🔧|👤|🤖|⚙️) ([^\n]+)\n\n([^#]+)/g;
  let match;

  while ((match = messagePattern.exec(content)) !== null) {
    const emoji = match[1];
    const roleLabel = match[2];
    const messageContent = match[3].trim();

    // Mappa emoji/etichetta al ruolo effettivo
    let role = 'user'; // Predefinito

    if (emoji === '🔧' || roleLabel.includes('Sistema')) {
      role = 'system';
    } else if (emoji === '🤖' || roleLabel.includes('Assistente')) {
      role = 'assistant';
    } else if (emoji === '⚙️' || roleLabel.includes('Funzione')) {
      role = 'function';
    }

    session.messages.push({
      role,
      content: messageContent,
      timestamp: Date.now()
    });
  }

  // Estrai le impostazioni (Pattern: ## ⚙️ Impostazioni\n\n| [Parametro] | [Valore] |)
  const settingsPattern =
    /## ⚙️ Impostazioni\n\n\|[^|]+\|[^|]+\|\n\|[^|]+\|[^|]+\|\n((?:\|[^|]+\|[^|]+\|\n)+)/;
  const settingsMatch = content.match(settingsPattern);

  if (settingsMatch) {
    const settingsLines = settingsMatch[1].trim().split('\n');
    for (const line of settingsLines) {
      const [param, value] = line
        .split('|')
        .filter(Boolean)
        .map((s) => s.trim());
      if (param && value) {
        // Tenta di convertire valori numerici e booleani
        let parsedValue: any = value;

        if (value.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (value.toLowerCase() === 'false') {
          parsedValue = false;
        } else if (!isNaN(Number(value))) {
          parsedValue = Number(value);
        } else if (value.startsWith('{') || value.startsWith('[')) {
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // Mantieni come stringa se non è JSON valido
          }
        }

        session.settings[param] = parsedValue;
      }
    }
  }

  // Estrai i file di contesto
  const filesPattern = /## 📄 File di Contesto\n\n((?:- `[^`]+`\n)+)/;
  const filesMatch = content.match(filesPattern);

  if (filesMatch) {
    const filesLines = filesMatch[1].trim().split('\n');
    session.contextFiles = filesLines
      .map((line) => {
        const match = line.match(/- `([^`]+)`/);
        return match ? match[1] : '';
      })
      .filter(Boolean);
  }

  // Estrai il modelId
  const modelPattern = /\*\*Modello\*\*: ([^\n]+)/;
  const modelMatch = content.match(modelPattern);

  if (modelMatch) {
    session.modelId = modelMatch[1].trim();
  }

  // Estrai il timestamp
  const timestampPattern = /\*\*Data\*\*: ([^\n]+)/;
  const timestampMatch = content.match(timestampPattern);

  if (timestampMatch) {
    try {
      const dateStr = timestampMatch[1].trim();
      session.timestamp = new Date(dateStr).getTime();
    } catch (e) {
      // Ignora se la conversione fallisce
    }
  }

  return session;
}

/**
 * Importa una sessione da un contenuto CSV
 * Questa è una implementazione basica che converte righe CSV in messaggi
 *
 * @param content - Contenuto CSV
 * @returns Sessione importata
 */
function importFromCSV(content: string): ExportableSession {
  const session: ExportableSession = {
    messages: [],
  };

  // Parsing CSV basico
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return session; // Nessun messaggio o solo intestazione
  }

  // Estrai intestazione
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Indici per i campi principali
  const roleIndex = headers.indexOf('role');
  const contentIndex = headers.indexOf('content');
  const timestampIndex = headers.indexOf('timestamp');

  if (roleIndex === -1 || contentIndex === -1) {
    throw new ExportError('Il CSV non contiene le colonne richieste (role, content)');
  }

  // Processa le righe dati
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < Math.max(roleIndex, contentIndex) + 1) {
      continue; // Salta righe invalide
    }

    const message: any = createChatMessage({role: values[roleIndex], content: values[contentIndex],
        timestamp: Date.now()
    });

    // Aggiungi timestamp se disponibile
    if (timestampIndex !== -1 && values[timestampIndex]) {
      try {
        message.timestamp = new Date(values[timestampIndex]).getTime();
      } catch (e) {
        // Ignora se la conversione fallisce
      }
    }

    session.messages.push(message);
  }

  return session;
}

/**
 * Funzione helper per parsare una riga CSV, gestendo virgolette e caratteri speciali
 *
 * @param line - Riga CSV da parsare
 * @param separator - Separatore (default: ',')
 * @returns Array di valori
 */
function parseCSVLine(line: string, separator: string = ','): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Doppia virgoletta all'interno di virgolette -> singola virgoletta
        currentValue += '"';
        i++; // Salta la seconda virgoletta
      } else {
        // Toggle stato virgolette
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      // Separatore fuori da virgolette -> fine valore
      result.push(currentValue);
      currentValue = '';
    } else {
      // Carattere normale -> aggiungi al valore corrente
      currentValue += char;
    }

    i++;
  }

  // Aggiungi l'ultimo valore
  result.push(currentValue);

  return result;
}

/**
 * Importa una sessione da un contenuto HTML
 * Questa è una implementazione molto basica che estrae i messaggi da un file HTML
 *
 * @param content - Contenuto HTML
 * @returns Sessione importata
 */
function importFromHTML(content: string): ExportableSession {
  // Questa è una implementazione estremamente basica
  // Un parser HTML reale sarebbe necessario per un'implementazione robusta

  const session: ExportableSession = {
    messages: [],
    settings: {
      modelId: 'unknown',
      temperature: 0.7,
    },
  };

  // Estrai i messaggi (Pattern semplificato: <div class="message [role]">)
  const messagePattern =
    /<div class="message ([^"]+)"[^>]*>(?:[\s\S]*?)<div class="role">[^<]*<\/div>(?:[\s\S]*?)<div class="content"><p>([\s\S]*?)<\/p><\/div>(?:[\s\S]*?)<\/div>/g;
  let match;

  while ((match = messagePattern.exec(content)) !== null) {
    const role = match[1].trim();
    let messageContent = match[2].trim();

    // Converti HTML semplice in testo
    messageContent = messageContent
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/?p>/g, '\n')
      .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
      .replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```')
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')
      .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, '[$2]($1)')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');

    session.messages.push({
      role,
      content: messageContent,
      timestamp: Date.now()
    });
  }

  // Estrai il titolo come systemPrompt
  const titleMatch = content.match(/<h1>([^<]+)<\/h1>/);
  if (titleMatch) {
    session.systemPrompt = titleMatch[1];
  }

  // Qui si potrebbero estrarre altri metadata, ma è molto più complesso
  // con regex in HTML. Un parser DOM sarebbe più appropriato.

  return session;
}
