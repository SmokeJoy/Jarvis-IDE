/**
 * Utility di formattazione per il componente AgentFlowDebugger
 */

/**
 * Formatta un timestamp in un formato leggibile
 * @param timestamp Il timestamp da formattare (in millisecondi)
 * @param includeDate Se includere la data nel formato
 * @returns Una stringa formattata
 */
export function formatTimestamp(timestamp: number, includeDate = true): string {
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString();
  
  return includeDate
    ? `${timeString} - ${date.toLocaleDateString()}`
    : timeString;
}

/**
 * Calcola e formatta la durata tra due timestamp
 * @param startTime Timestamp di inizio (in millisecondi)
 * @param endTime Timestamp di fine (in millisecondi) o undefined per usare il tempo corrente
 * @returns Una stringa formattata della durata
 */
export function formatDuration(startTime?: number, endTime?: number): string {
  if (!startTime) return 'N/A';
  
  const end = endTime || Date.now();
  const durationMs = end - startTime;
  
  // Millisecondi
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  // Secondi
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
  
  // Minuti
  if (durationMs < 3600000) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  
  // Ore
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Tronca un messaggio lungo
 * @param message Il messaggio da troncare
 * @param maxLength La lunghezza massima
 * @returns Il messaggio troncato
 */
export function truncateMessage(message: string, maxLength = 100): string {
  return message.length > maxLength
    ? message.substring(0, maxLength) + '...'
    : message;
}

/**
 * Sanitizza un messaggio per Mermaid
 * @param message Il messaggio da sanitizzare
 * @param maxLength La lunghezza massima
 * @returns Il messaggio sanitizzato
 */
export function sanitizeMessageForMermaid(message: string, maxLength = 30): string {
  return message
    .replace(/"/g, '')
    .replace(/\n/g, ' ')
    .replace(/[^\w\s.,?!-]/g, '')
    .substring(0, maxLength) + (message.length > maxLength ? '...' : '');
}

/**
 * Genera un codice colore esadecimale per uno stato di agente
 * @param status Lo stato dell'agente
 * @param isDarkTheme Se il tema è scuro
 * @returns Un oggetto con i colori
 */
export function getAgentStatusColors(status: string, isDarkTheme = false): { 
  fill: string, 
  stroke: string, 
  text: string 
} {
  switch (status) {
    case 'running':
      return isDarkTheme 
        ? { fill: '#1a4971', stroke: '#2196f3', text: '#90caf9' }
        : { fill: '#bbdefb', stroke: '#2196f3', text: '#0d47a1' };
    case 'completed':
      return isDarkTheme 
        ? { fill: '#1b5e20', stroke: '#4caf50', text: '#a5d6a7' }
        : { fill: '#c8e6c9', stroke: '#4caf50', text: '#1b5e20' };
    case 'error':
      return isDarkTheme 
        ? { fill: '#7f0000', stroke: '#f44336', text: '#ffcdd2' }
        : { fill: '#ffcdd2', stroke: '#f44336', text: '#b71c1c' };
    case 'idle':
    default:
      return isDarkTheme 
        ? { fill: '#424242', stroke: '#9e9e9e', text: '#f5f5f5' }
        : { fill: '#e0e0e0', stroke: '#9e9e9e', text: '#212121' };
  }
}

/**
 * Formatta un numero di tokens in un formato leggibile
 * @param tokens Il numero di tokens
 * @returns Una stringa formattata
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  }
  if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * Genera un ID univoco
 * @returns Una stringa con ID univoco
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Formatta uno stato di flusso con emoji
 * @param status Lo stato del flusso
 * @returns Una stringa con emoji e stato
 */
export function formatFlowStatus(status: string): { emoji: string, label: string } {
  switch (status) {
    case 'completed':
      return { emoji: '✅', label: 'Completato' };
    case 'running':
      return { emoji: '🔄', label: 'In esecuzione' };
    case 'error':
      return { emoji: '❌', label: 'Errore' };
    default:
      return { emoji: '⏳', label: 'In attesa' };
  }
} 