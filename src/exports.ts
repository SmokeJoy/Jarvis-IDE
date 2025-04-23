import { JarvisAPI } from './api/JarvisAPI';
import { Logger } from './utils/logger';

const logger = new Logger('Exports');

/**
 * Crea una nuova istanza di JarvisAPI
 */
export async function createJarvisAPI(): Promise<JarvisAPI> {
  try {
    logger.debug('Creazione nuova istanza JarvisAPI');
    return JarvisAPI.getInstance();
  } catch (error) {
    logger.error('Errore nella creazione di JarvisAPI:', error);
    throw error;
  }
}

/**
 * Esporta le funzionalità principali di Jarvis
 */
export const jarvisExports = {
  createJarvisAPI,
  // Aggiungi qui altre esportazioni se necessario
}; 