import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Settings } from '../../shared/types/settings.types.js';
import type { ApiConfiguration, LLMProviderId } from '../../shared/types/api.types.js';

/**
 * Interfaccia per le impostazioni di Jarvis
 */
export interface JarvisSettings {
  use_docs: boolean;
  coder_mode: boolean;
  contextPrompt: string;
  selectedModel: string;
  multi_agent: boolean;
}

/**
 * Valori di default per le impostazioni di Jarvis
 */
const DEFAULT_SETTINGS: JarvisSettings = {
  use_docs: false,
  coder_mode: true,
  contextPrompt: '',
  selectedModel: '',
  multi_agent: false,
};

export class SettingsManager {
    private static instance: SettingsManager;
    private settingsPath: string;
    private settings: JarvisSettings = { ...DEFAULT_SETTINGS };
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        const configDir = path.join(context.globalStorageUri.fsPath, 'config');
        this.settingsPath = path.join(configDir, 'settings.json');
    }

    public static getInstance(context?: vscode.ExtensionContext): SettingsManager {
        if (!SettingsManager.instance && context) {
            SettingsManager.instance = new SettingsManager(context);
        }
        if (!SettingsManager.instance) {
            throw new Error('SettingsManager non inizializzato correttamente. Fornire un context alla prima chiamata.');
        }
        return SettingsManager.instance;
    }

    /**
     * Carica le impostazioni da disco
     */
    public async loadSettings(): Promise<JarvisSettings> {
        try {
            const data = await fs.readFile(this.settingsPath, 'utf8');
            const parsedData = JSON.parse(data);
            // Fonde le impostazioni di default con quelle caricate
            this.settings = { ...DEFAULT_SETTINGS, ...parsedData };
        } catch (error) {
            // Se il file non esiste o c'è un errore, utilizza le impostazioni predefinite
            console.warn('Impossibile leggere settings.json, uso default.');
            this.settings = { ...DEFAULT_SETTINGS };
        }
        return this.settings;
    }

    /**
     * Restituisce le impostazioni correnti
     */
    public getSettings(): JarvisSettings {
        return this.settings;
    }

    /**
     * Salva le impostazioni su disco
     */
    public async saveSettings(): Promise<void> {
        const dir = path.dirname(this.settingsPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
        } catch (error) {
            console.error('Errore nel salvataggio delle impostazioni:', error);
            throw error;
        }
    }

    /**
     * Aggiorna una singola impostazione e salva su disco
     */
    public async updateSetting<K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]): Promise<void> {
        this.settings[key] = value;
        await this.saveSettings();
    }

    /**
     * Ripristina le impostazioni ai valori predefiniti
     */
    public async resetSettings(): Promise<void> {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
    }

    /**
     * Carica il system prompt da disco
     */
    public async loadSystemPrompt(): Promise<string> {
        const systemPromptPath = path.join(this.context.globalStorageUri.fsPath, 'config/system_prompt.md');
        try {
            return await fs.readFile(systemPromptPath, 'utf-8');
        } catch (error) {
            // Se il file non esiste, restituisce un prompt di default
            const defaultPrompt = '# System Prompt\n\nSei Jarvis, il miglior IDE al mondo.';
            await this.saveSystemPrompt(defaultPrompt); // Crea il file con il contenuto di default
            return defaultPrompt;
        }
    }

    /**
     * Salva il system prompt su disco
     */
    public async saveSystemPrompt(content: string): Promise<void> {
        const systemPromptPath = path.join(this.context.globalStorageUri.fsPath, 'config/system_prompt.md');
        const dir = path.dirname(systemPromptPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(systemPromptPath, content, 'utf-8');
        } catch (error) {
            console.error('Errore nel salvataggio del system prompt:', error);
            throw error;
        }
    }

    // Metodi legacy per compatibilità
    public async getSystemPrompt(): Promise<string> {
        return this.loadSystemPrompt();
    }

    public async updateSettings(settings: Partial<JarvisSettings>): Promise<void> {
        this.settings = { ...this.settings, ...settings };
        await this.saveSettings();
    }

    /**
     * Esporta le impostazioni in un file JSON esterno
     * @param filePath Percorso del file in cui esportare le impostazioni
     */
    public async exportToFile(filePath: string): Promise<void> {
        try {
            await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf8');
        } catch (error) {
            console.error('Errore nell\'esportazione delle impostazioni:', error);
            throw error;
        }
    }

    /**
     * Importa le impostazioni da un file JSON esterno
     * @param filePath Percorso del file da cui importare le impostazioni
     */
    public async importFromFile(filePath: string): Promise<void> {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);
            this.settings = { ...DEFAULT_SETTINGS, ...parsedData };
            await this.saveSettings();
        } catch (error) {
            console.error('Errore nell\'importazione delle impostazioni:', error);
            throw error;
        }
    }
} 