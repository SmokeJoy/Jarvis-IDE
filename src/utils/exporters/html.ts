/**
 * Modulo per l'esportazione in formato HTML
 * @module utils/exporters/html
 */

import { ChatMessage } from '../../shared/types';
import { ChatSettings } from '../../shared/types/settings.types';
import { ExportableSession } from './types';
import { Logger } from '../logger';
import { toMarkdown } from './markdown';

const logger = Logger.getInstance('htmlExporter');

/**
 * Opzioni per la conversione in HTML
 */
export interface HTMLOptions {
  /**
   * Se includere lo stile CSS nel documento
   * @default true
   */
  includeStyles?: boolean;

  /**
   * Se convertire il contenuto Markdown in HTML
   * @default true
   */
  convertMarkdown?: boolean;

  /**
   * Se includere metadata come title, description, ecc.
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Titolo del documento
   * @default 'Conversazione Esportata'
   */
  title?: string;
}

/**
 * Stili CSS da includere nel documento HTML
 */
const defaultStyles = `
<style>
  :root {
    --bg-color: #ffffff;
    --text-color: #333333;
    --primary-color: #2c7be5;
    --secondary-color: #eef2f7;
    --border-color: #e0e4e9;
    --system-color: #6c757d;
    --user-color: #2c7be5;
    --assistant-color: #00b4d8;
    --function-color: #4caf50;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--bg-color);
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1, h2, h3, h4 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }
  
  h1 {
    font-size: 2em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.3em;
  }
  
  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.3em;
  }
  
  h3 {
    font-size: 1.2em;
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  
  th, td {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    text-align: left;
  }
  
  th {
    background-color: var(--secondary-color);
    font-weight: 600;
  }
  
  code {
    font-family: Menlo, Monaco, 'Courier New', monospace;
    background-color: var(--secondary-color);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }
  
  pre {
    background-color: var(--secondary-color);
    padding: 16px;
    border-radius: 5px;
    overflow: auto;
  }
  
  pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
  }
  
  .message {
    margin: 1.5em 0;
    padding: 1em;
    border-radius: 5px;
    border-left: 5px solid;
  }
  
  .message.system {
    background-color: #f8f9fa;
    border-left-color: var(--system-color);
  }
  
  .message.user {
    background-color: #eef2f7;
    border-left-color: var(--user-color);
  }
  
  .message.assistant {
    background-color: #e6f7fb;
    border-left-color: var(--assistant-color);
  }
  
  .message.function {
    background-color: #e6f7e9;
    border-left-color: var(--function-color);
  }
  
  .role {
    font-weight: bold;
    margin-bottom: 0.5em;
  }
  
  .metadata {
    margin-bottom: 2em;
    font-style: italic;
    color: var(--system-color);
  }
  
  .context-files {
    list-style-type: none;
    padding-left: 0;
  }
  
  .context-files li {
    margin-bottom: 0.5em;
  }
  
  .context-files code {
    font-weight: bold;
  }
  
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-color: #1a1a1a;
      --text-color: #e0e0e0;
      --primary-color: #4b9fff;
      --secondary-color: #2a2a2a;
      --border-color: #444444;
      --system-color: #9e9e9e;
      --user-color: #4b9fff;
      --assistant-color: #00c8ff;
      --function-color: #66bb6a;
    }
  }
</style>
`;

/**
 * Converte un singolo messaggio in HTML
 *
 * @param message - Messaggio da convertire
 * @returns Codice HTML per il messaggio
 */
function messageToHTML(message: ChatMessage): string {
  // Definisci emoji e label per i ruoli
  const roleEmoji =
    {
      system: '🔧',
      user: '👤',
      assistant: '🤖',
      function: '⚙️',
    }[message.role] || '❓';

  const roleLabel =
    {
      system: 'Sistema',
      user: 'Utente',
      assistant: 'Assistente',
      function: 'Funzione',
    }[message.role] || message.role;

  // Sanitizza il contenuto per HTML
  let content = message.content || '';
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Mantieni la formattazione di base del markdown
  content = content
    // Converti blocchi di codice
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Converti codice inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Converti elenchi
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    // Converti grassetto
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Converti corsivo
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Converti link
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Aggiungi interruzioni di riga
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
    <div class="message ${message.role}">
      <div class="role">${roleEmoji} ${roleLabel}</div>
      <div class="content"><p>${content}</p></div>
    </div>
  `;
}

/**
 * Converte le impostazioni in HTML
 *
 * @param settings - Impostazioni da convertire
 * @returns Codice HTML per le impostazioni
 */
function settingsToHTML(settings?: ChatSettings): string {
  if (!settings || Object.keys(settings).length === 0) {
    return '';
  }

  let html = `
    <h2>⚙️ Impostazioni</h2>
    <table>
      <tr>
        <th>Parametro</th>
        <th>Valore</th>
      </tr>
  `;

  for (const [key, value] of Object.entries(settings)) {
    // Formatta il valore in modo leggibile
    let formattedValue = value;

    if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value);
    }

    html += `
      <tr>
        <td>${key}</td>
        <td>${formattedValue}</td>
      </tr>
    `;
  }

  html += '</table>';

  return html;
}

/**
 * Converte i file di contesto in HTML
 *
 * @param contextFiles - Array di file di contesto
 * @returns Codice HTML per i file di contesto
 */
function contextFilesToHTML(contextFiles?: string[]): string {
  if (!contextFiles || contextFiles.length === 0) {
    return '';
  }

  let html = `
    <h2>📄 File di Contesto</h2>
    <ul class="context-files">
  `;

  for (const file of contextFiles) {
    html += `<li><code>${file}</code></li>`;
  }

  html += '</ul>';

  return html;
}

/**
 * Converte una sessione in formato HTML
 *
 * @param session - Sessione da convertire
 * @param options - Opzioni per la conversione
 * @returns Codice HTML completo
 */
export function toHTML(session: ExportableSession, options: HTMLOptions = {}): string {
  try {
    logger.debug('Inizio esportazione in formato HTML');

    // Imposta opzioni predefinite
    const includeStyles = options.includeStyles !== false;
    const convertMarkdown = options.convertMarkdown !== false;
    const includeMetadata = options.includeMetadata !== false;
    const title = options.title || 'Conversazione Esportata';

    // Se si vuole convertire da Markdown a HTML, usa toMarkdown prima
    if (convertMarkdown) {
      // Usa Markdown come formato intermedio per una conversione più ricca
      const markdownContent = toMarkdown(session);
      // Implemen Markdown -> HTML
      // Per una conversione reale bisognerebbe usare una libreria come marked
      // Questa è una versione semplificata
      return generateHTMLDocument(markdownContent, title, includeStyles, includeMetadata, session);
    }

    // Altrimenti procedi con la conversione diretta
    const timestamp = session.timestamp
      ? new Date(session.timestamp).toLocaleString()
      : new Date().toLocaleString();

    const modelId = session.modelId || '';

    let metadata = '';
    if (includeMetadata) {
      metadata = `
        <div class="metadata">
          ${modelId ? `<div><strong>Modello:</strong> ${modelId}</div>` : ''}
          <div><strong>Data:</strong> ${timestamp}</div>
        </div>
      `;
    }

    // Intestazione e prompt di sistema
    let head = `<h1>${title}</h1>${metadata}`;

    if (session.systemPrompt) {
      head += `
        <h2>📝 Prompt di Sistema</h2>
        <div class="message system">
          <div class="content"><p>${session.systemPrompt}</p></div>
        </div>
      `;
    }

    // Altre sezioni
    const settingsSection = settingsToHTML(session.settings);
    const contextFilesSection = contextFilesToHTML(session.contextFiles);

    // Conversazione
    let messagesSection = '';
    if (session.messages && session.messages.length > 0) {
      messagesSection = '<h2>💬 Conversazione</h2>';
      messagesSection += session.messages.map((message) => messageToHTML(message)).join('');
    }

    // Componi il documento
    const bodyContent = [head, settingsSection, contextFilesSection, messagesSection]
      .filter(Boolean)
      .join('');

    // Genera il documento HTML completo
    const htmlDocument = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${includeStyles ? defaultStyles : ''}
</head>
<body>
  ${bodyContent}
</body>
</html>`;

    logger.debug('Esportazione HTML completata con successo');
    return htmlDocument;
  } catch (error) {
    logger.error("Errore durante l'esportazione in formato HTML", { cause: error });
    throw new Error(
      `Errore durante l'esportazione in formato HTML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Genera un documento HTML completo
 *
 * @param content - Contenuto Markdown da convertire in HTML
 * @param title - Titolo del documento
 * @param includeStyles - Se includere gli stili CSS
 * @param includeMetadata - Se includere i metadati
 * @param session - Sessione originale per i metadati
 * @returns Documento HTML completo
 */
function generateHTMLDocument(
  content: string,
  title: string,
  includeStyles: boolean,
  includeMetadata: boolean,
  session: ExportableSession
): string {
  // Questa sarebbe una conversione reale da Markdown a HTML
  // Qui usiamo un approccio semplificato
  const htmlContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Titoli
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    // Formattazione
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Liste
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Tabelle (semplificato)
    .replace(/^\|(.+)\|$/gm, '<tr><td>$1</td></tr>')
    .replace(/^(\|[-|]+\|)$/gm, '')
    // Paragrafi
    .replace(/\n\n/g, '</p><p>')
    // Inserisci le liste in elementi ul
    .replace(/<li>.*(?:\n<li>.*)+/g, (match) => `<ul>${match}</ul>`);

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${includeStyles ? defaultStyles : ''}
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}
