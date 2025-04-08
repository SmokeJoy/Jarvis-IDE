/**
 * Funzioni di utilità per la gestione dei file
 * Questo modulo fornisce funzioni per appendere log ai file e ottenere il percorso del file di log
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Appende contenuto a un file di log
 * @param {string} filename - Nome del file di log
 * @param {string} content - Contenuto da appendere
 * @returns {Promise<void>}
 */
export async function appendLogToFile(filename, content) {
    try {
        const logPath = getLogFilePath(filename);
        
        // Assicurati che la directory esista
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Appendi al file
        fs.appendFileSync(logPath, content);
    } catch (error) {
        console.error('Errore durante la scrittura nel file di log:', error);
    }
}

/**
 * Ottiene il percorso completo per un file di log
 * @param {string} [filename='jarvis-ide.log'] - Nome del file di log
 * @returns {string} Percorso completo del file
 */
export function getLogFilePath(filename = 'jarvis-ide.log') {
    const homeDir = os.homedir();
    const logDir = path.join(homeDir, '.jarvis-ide', 'logs');
    return path.join(logDir, filename);
}

/**
 * Verifica se un file esiste
 * @param {string} filePath - Percorso del file
 * @returns {boolean} true se il file esiste, false altrimenti
 */
export function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

/**
 * Legge il contenuto di un file
 * @param {string} filePath - Percorso del file
 * @returns {string|null} Contenuto del file o null in caso di errore
 */
export function readFileSync(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return null;
    }
}

/**
 * Scrive contenuto in un file
 * @param {string} filePath - Percorso del file
 * @param {string} content - Contenuto da scrivere
 * @returns {boolean} true se la scrittura è riuscita, false altrimenti
 */
export function writeFileSync(filePath, content) {
    try {
        // Assicurati che la directory esista
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    } catch {
        return false;
    }
} 