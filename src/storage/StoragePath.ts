/**
 * Utilità per gestire i percorsi di storage dell'applicazione
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Percorso base della directory di configurazione
const APP_NAME = 'jarvis-ide';
const CONFIG_DIR = path.join(os.homedir(), `.${APP_NAME}`);

/**
 * Ottiene il percorso di storage personalizzato dell'applicazione
 * Crea la directory se non esiste
 * 
 * @param subDir sottodirectory opzionale
 * @returns il percorso completo della directory
 */
export function getStoragePath(subDir?: string): string {
  // Crea la directory di configurazione principale se non esiste
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  // Se è richiesta una sottodirectory, aggiungila al percorso
  if (subDir) {
    const fullPath = path.join(CONFIG_DIR, subDir);
    
    // Crea la sottodirectory se non esiste
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    return fullPath;
  }
  
  return CONFIG_DIR;
}

/**
 * Ottiene il percorso di un file all'interno della directory di storage
 * 
 * @param fileName nome del file
 * @param subDir sottodirectory opzionale
 * @returns il percorso completo del file
 */
export function getStorageFilePath(fileName: string, subDir?: string): string {
  return path.join(getStoragePath(subDir), fileName);
}

/**
 * Verifica se un file esiste nella directory di storage
 * 
 * @param fileName nome del file
 * @param subDir sottodirectory opzionale
 * @returns true se il file esiste, false altrimenti
 */
export function storageFileExists(fileName: string, subDir?: string): boolean {
  return fs.existsSync(getStorageFilePath(fileName, subDir));
}

/**
 * Elimina un file dalla directory di storage se esiste
 * 
 * @param fileName nome del file
 * @param subDir sottodirectory opzionale
 */
export function deleteStorageFile(fileName: string, subDir?: string): void {
  const filePath = getStorageFilePath(fileName, subDir);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
} 