/**
 * Modulo per l'esportazione in formato Markdown
 * @module utils/exporters/markdown
 */

import { ChatMessage } from '../../shared/types.js';
import { ChatSettings } from '../../shared/types/settings.types.js';
import { ExportableSession } from './types.js';
import { Logger } from '../logger.js';

const logger = Logger.getInstance('markdownExporter');

/**
 * Formatta un singolo messaggio in Markdown
 * 
 * @param message - Il messaggio da formattare
 * @returns Stringa Markdown formattata
 */
function formatMessage(message: ChatMessage): string {
  const roleEmoji = {
    'system': '🔧',
    'user': '👤',
    'assistant': '🤖',
    'function': '⚙️'
  }[message.role] || '❓';
  
  const roleLabel = {
    'system': 'Sistema',
    'user': 'Utente',
    'assistant': 'Assistente',
    'function': 'Funzione'
  }[message.role] || message.role;
  
  // Formatta il contenuto del messaggio (potrebbe contenere già del Markdown)
  let content = message.content || '';
  
  // Se il messaggio contiene già blocchi di codice, assicuriamoci che siano 
  // correttamente formattati per evitare problemi di nesting
  content = content.replace(/```/g, '~~~');
  
  return `### ${roleEmoji} ${roleLabel}\n\n${content}\n\n`;
}

/**
 * Formatta la sezione delle impostazioni in Markdown
 * 
 * @param settings - Impostazioni della chat
 * @returns Stringa Markdown formattata
 */
function formatSettings(settings?: ChatSettings): string {
  if (!settings || Object.keys(settings).length === 0) {
    return '';
  }
  
  let output = '## ⚙️ Impostazioni\n\n';
  output += '| Parametro | Valore |\n';
  output += '|-----------|--------|\n';
  
  for (const [key, value] of Object.entries(settings)) {
    // Formatta il valore in modo leggibile
    let formattedValue = value;
    
    if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value);
    }
    
    output += `| ${key} | ${formattedValue} |\n`;
  }
  
  return output + '\n';
}

/**
 * Formatta i file di contesto in Markdown
 * 
 * @param contextFiles - Array di file di contesto
 * @returns Stringa Markdown formattata
 */
function formatContextFiles(contextFiles?: string[]): string {
  if (!contextFiles || contextFiles.length === 0) {
    return '';
  }
  
  let output = '## 📄 File di Contesto\n\n';
  
  for (const file of contextFiles) {
    output += `- \`${file}\`\n`;
  }
  
  return output + '\n';
}

/**
 * Crea un'intestazione per il documento Markdown
 * 
 * @param session - Dati della sessione
 * @returns Stringa Markdown formattata
 */
function createHeader(session: ExportableSession): string {
  const timestamp = session.timestamp
    ? new Date(session.timestamp).toLocaleString()
    : new Date().toLocaleString();
  
  const modelId = session.modelId || '';
  
  let header = '# Conversazione Esportata\n\n';
  
  if (modelId) {
    header += `**Modello**: ${modelId}  \n`;
  }
  
  header += `**Data**: ${timestamp}  \n\n`;
  
  // Aggiungi prompt di sistema se disponibile
  if (session.systemPrompt) {
    header += '## 📝 Prompt di Sistema\n\n';
    header += `${session.systemPrompt}\n\n`;
  }
  
  return header;
}

/**
 * Converte una sessione in formato Markdown
 * 
 * @param session - Dati della sessione da esportare
 * @returns Stringa contenente il Markdown formattato
 */
export function toMarkdown(session: ExportableSession): string {
  try {
    logger.debug('Inizio esportazione in formato Markdown');
    
    // Crea le varie sezioni del documento
    const header = createHeader(session);
    const settingsSection = formatSettings(session.settings);
    const contextFilesSection = formatContextFiles(session.contextFiles);
    
    // Formatta la sezione dei messaggi
    let messagesSection = '';
    if (session.messages && session.messages.length > 0) {
      messagesSection = '## 💬 Conversazione\n\n';
      messagesSection += session.messages
        .map(message => formatMessage(message))
        .join('---\n\n');
    }
    
    // Componi il documento completo
    const markdownContent = [
      header,
      settingsSection,
      contextFilesSection,
      messagesSection
    ].filter(Boolean).join('');
    
    logger.debug('Esportazione Markdown completata con successo');
    return markdownContent;
    
  } catch (error) {
    logger.error('Errore durante l\'esportazione in formato Markdown', { cause: error });
    throw new Error(
      `Errore durante l'esportazione in formato Markdown: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} 