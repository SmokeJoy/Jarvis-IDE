import { LogLevel } from "../types/global.js";
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let JarvisProvider: any;
let appendLogToFile: (filename: string, content: string) => Promise<void>;

// Determinazione dell'ambiente di esecuzione
const isTestEnvironment = process.env.NODE_ENV === 'test';
const sendToWebView = process.env.LOG_TO_WEBVIEW !== 'false' && !isTestEnvironment;

if (!isTestEnvironment) {
    import('../core/webview/JarvisProvider.js').then(module => {
        JarvisProvider = module.JarvisProvider;
    }).catch(err => {
        console.error('Failed to import JarvisProvider:', err);
    });

    import('./file.js').then(module => {
        appendLogToFile = module.appendLogToFile;
    }).catch(err => {
        console.error('Failed to import file utils:', err);
    });
}

/**
 * Verifica se un livello è attivo in base al livello corrente
 */
function isLevelActive(currentLevel: number, level: number): boolean {
    return level >= currentLevel;
}

// Livello di log corrente
let currentLevel = 1; // Default: INFO

/**
 * Imposta il livello di log
 */
function setLogLevel(level: number): void {
    currentLevel = level;
}

/**
 * Genera un timestamp nel formato YYYY-MM-DD HH:MM:SS.mmm
 */
function getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Invia un messaggio di log alla WebView
 */
function sendLogToWebView(timestamp: string, level: string, message: string): void {
    if (!sendToWebView || isTestEnvironment || !JarvisProvider)
        return;

    // Trova un provider visibile e invia il messaggio
    const visibleProvider = JarvisProvider.getVisibleInstance();
    if (visibleProvider) {
        visibleProvider.postMessageToWebview({
            type: "log.update",
            logEntry: {
                timestamp,
                level,
                message
            }
        });
    }
}

/**
 * Metodo base per logging
 */
function log(level: string, levelNum: number, message: string, error?: Error): void {
    if (!isLevelActive(currentLevel, levelNum))
        return;

    const timestamp = getTimestamp();
    const formattedMessage = `[${timestamp}] [${level}] ${message}${error ? ` - ${error.stack || error.message}` : ''}`;

    // Log alla console
    const consoleMethod = levelNum >= 3 ? 'error' : levelNum === 2 ? 'warn' : 'log';
    console[consoleMethod](formattedMessage);

    // Log a file se disponibile
    if (appendLogToFile) {
        try {
            appendLogToFile('jarvis-ide.log', formattedMessage + '\n');
        }
        catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }

    // Log alla WebView se appropriato
    sendLogToWebView(timestamp, level, message);
}

// Esporta l'oggetto logger con tutti i metodi
export const logger = {
    setLevel: setLogLevel,
    debug: (message: string, error?: Error) => log('DEBUG', 0, message, error),
    info: (message: string, error?: Error) => log('INFO', 1, message, error),
    warn: (message: string, error?: Error) => log('WARN', 2, message, error),
    error: (message: string, error?: Error) => log('ERROR', 3, message, error),
};

/**
 * Logger statico per l'estensione
 */
export class Logger {
    static initialized: boolean = false;
    static outputChannel: vscode.OutputChannel | undefined;
    static logFile: string | undefined;
    private _name: string = '';

    /**
     * Costruttore del logger
     */
    constructor(name?: string) {
        this._name = name || '';
    }

    /**
     * Inizializza il logger con un canale di output VS Code
     * @param outputChannel Canale di output VS Code
     */
    static initialize(outputChannel: vscode.OutputChannel): void {
        this.outputChannel = outputChannel;
        this.initialized = true;
        this.info("Logger inizializzato con successo");
    }

    /**
     * Inizializza il logger
     * @deprecated Utilizzare il metodo initialize
     */
    static init(context: any): void {
        if (this.initialized)
            return;

        this.initialized = true;

        // Crea il canale di output VS Code
        this.outputChannel = context?.logOutputChannel;

        // Imposta il file di log
        import('./file.js').then(module => {
            const fileModule = module;
            this.logFile = fileModule.getLogFilePath();
        }).catch(error => {
            console.error('Errore durante il caricamento del modulo file:', error);
        });
    }

    /**
     * Registra un messaggio di debug
     */
    static debug(message: string, error?: Error): void {
        this.log(LogLevel.DEBUG, message, error);
    }

    /**
     * Registra un messaggio informativo
     */
    static info(message: string, error?: Error): void {
        this.log(LogLevel.INFO, message, error);
    }

    /**
     * Registra un messaggio di avviso
     */
    static warn(message: string, error?: Error): void {
        this.log(LogLevel.WARN, message, error);
    }

    /**
     * Registra un messaggio di errore
     */
    static error(message: string, error?: Error): void {
        this.log(LogLevel.ERROR, message, error);
    }

    /**
     * Registra un messaggio
     */
    static log(level: LogLevel, message: string, error?: Error): void {
        // Ottieni il timestamp corrente
        const timestamp = new Date().toISOString();

        // Formatta il messaggio
        const formattedMessage = `[${timestamp}] [${level}] ${message}${error ? ` - ${String(error.stack || error.message)}` : ''}`;

        // Registra su console
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
        }

        // Registra sul canale di output VS Code
        if (this.outputChannel) {
            this.outputChannel.appendLine(formattedMessage);
        }

        // Registra su file
        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, formattedMessage + '\n');
            }
            catch (err) {
                console.error('Errore durante la scrittura nel file di log:', err);
            }
        }
    }

    /**
     * Metodi di istanza che delegano ai metodi statici
     */
    debug(message: string, error?: Error): void {
        Logger.debug(`[${this._name}] ${message}`, error);
    }

    info(message: string, error?: Error): void {
        Logger.info(`[${this._name}] ${message}`, error);
    }

    warn(message: string, error?: Error): void {
        Logger.warn(`[${this._name}] ${message}`, error);
    }

    error(message: string, error?: Error): void {
        Logger.error(`[${this._name}] ${message}`, error);
    }
}