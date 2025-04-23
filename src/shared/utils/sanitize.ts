/**
 * @file sanitize.ts
 * @description Funzioni di sanitizzazione per prevenire XSS e injection attacks
 * @version 1.0.0
 */

// Mappa di sostituzione per prevenire XSS basic
const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Sanitizza una stringa HTML per prevenire XSS
 * Encoding dei caratteri potenzialmente pericolosi
 * @param input Testo da sanitizzare
 * @returns Testo sanitizzato
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITY_MAP[char]);
}

/**
 * Sanitizza una stringa per uso in contesti JavaScript
 * @param input Testo da sanitizzare
 * @returns Testo sicuro per inserimento in contesti JS
 */
export function sanitizeJs(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Escape backslash, linefeed, carriage return, tab, quote
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`');
}

/**
 * Sanitizza una stringa da usare come URL
 * @param input URL da sanitizzare
 * @returns URL sanitizzato o stringa vuota se non valido
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  try {
    const url = new URL(input);
    
    // Valida solo HTTP o HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    
    return url.toString();
  } catch (e) {
    // URL non valido
    return '';
  }
}

/**
 * Sanitizza un oggetto JSON
 * @param input Oggetto da sanitizzare
 * @returns Copia sanitizzata dell'oggetto
 */
export function sanitizeObject<T extends Record<string, any>>(input: T): T {
  if (!input || typeof input !== 'object') {
    return {} as T;
  }
  
  const result: Record<string, any> = {};
  
  // Processa ricorsivamente tutte le proprietà
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];
      
      if (typeof value === 'string') {
        // Sanitizza stringhe
        result[key] = sanitizeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Sanitizza array
          result[key] = value.map(item => 
            typeof item === 'string' ? sanitizeHtml(item) : 
            typeof item === 'object' ? sanitizeObject(item) : item
          );
        } else {
          // Sanitizza oggetti nidificati
          result[key] = sanitizeObject(value);
        }
      } else {
        // Mantieni invariati i tipi non-string
        result[key] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Sanitizza un messaggio che verrà inviato via WebSocket
 * @param message Messaggio da sanitizzare
 * @returns Messaggio sanitizzato
 */
export function sanitizeWebSocketMessage<T extends Record<string, any>>(message: T): T {
  return sanitizeObject(message);
}

/**
 * Rimuove tutti i caratteri non alfanumerici (utile per ID, classi CSS, ecc.)
 * @param input Stringa da pulire
 * @returns Stringa con soli caratteri alfanumerici
 */
export function stripNonAlphaNumeric(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Sanitizza un nome di classe CSS
 * @param input Nome classe da sanitizzare
 * @returns Nome classe sicuro
 */
export function sanitizeCssClassName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Rimuove tutto tranne lettere, numeri, -, _ e spazi
  let sanitized = input.replace(/[^a-zA-Z0-9-_\s]/g, '');
  
  // Assicura che non inizi con un numero (requisito CSS valido)
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'c-' + sanitized;
  }
  
  return sanitized;
}

/**
 * Sanitizza SQL per prevenire injection di base
 * NOTA: Questa funzione non è un sostituto per prepared statements
 * @param input SQL da sanitizzare
 * @returns SQL sanitizzato
 */
export function sanitizeSql(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Rimuove commenti SQL
  let sanitized = input.replace(/--.*$/gm, '');
  
  // Rimuove caratteri di controllo
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Escape apici singoli
  sanitized = sanitized.replace(/'/g, "''");
  
  return sanitized;
}

/**
 * Normalizza un percorso del file system
 * @param input Percorso da normalizzare
 * @returns Percorso normalizzato
 */
export function sanitizePath(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Rimuove sequenze di caratteri potenzialmente pericolose
  let sanitized = input.replace(/\.\.\//g, '');  // Rimuove "../"
  sanitized = sanitized.replace(/\.\.\\/g, '');  // Rimuove "..\"
  sanitized = sanitized.replace(/[;&|`$]/g, ''); // Rimuove caratteri shell
  
  return sanitized;
}

/**
 * Funzione generica per sanitizzare in base al contesto
 * @param input Valore da sanitizzare
 * @param context Contesto di sanitizzazione
 * @returns Valore sanitizzato
 */
export function sanitize(
  input: string,
  context: 'html' | 'js' | 'url' | 'path' | 'css' | 'sql' | 'alphanum' = 'html'
): string {
  switch (context) {
    case 'html':
      return sanitizeHtml(input);
    case 'js':
      return sanitizeJs(input);
    case 'url':
      return sanitizeUrl(input);
    case 'path':
      return sanitizePath(input);
    case 'css':
      return sanitizeCssClassName(input);
    case 'sql':
      return sanitizeSql(input);
    case 'alphanum':
      return stripNonAlphaNumeric(input);
    default:
      return sanitizeHtml(input);
  }
}

// Esporta un oggetto con tutti i metodi di sanitizzazione per un import più conveniente
export default {
  sanitizeHtml,
  sanitizeJs,
  sanitizeUrl,
  sanitizeObject,
  sanitizeWebSocketMessage,
  stripNonAlphaNumeric,
  sanitizeCssClassName,
  sanitizeSql,
  sanitizePath,
  sanitize
}; 