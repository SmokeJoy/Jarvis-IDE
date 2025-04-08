import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ApiConfiguration, LLMProviderId } from '../../shared/types/api.types';
/**
 * Valori di default per le impostazioni di Jarvis
 */
const DEFAULT_SETTINGS = {
    use_docs: false,
    coder_mode: true,
    contextPrompt: '',
    selectedModel: '',
    multi_agent: false,
};
export class SettingsManager {
    constructor(context) {
        this.settings = { ...DEFAULT_SETTINGS };
        this.context = context;
        const configDir = path.join(context.globalStorageUri.fsPath, 'config');
        this.settingsPath = path.join(configDir, 'settings.json');
    }
    static getInstance(context) {
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
    async loadSettings() {
        try {
            const data = await fs.readFile(this.settingsPath, 'utf8');
            const parsedData = JSON.parse(data);
            // Fonde le impostazioni di default con quelle caricate
            this.settings = { ...DEFAULT_SETTINGS, ...parsedData };
        }
        catch (error) {
            // Se il file non esiste o c'è un errore, utilizza le impostazioni predefinite
            console.warn('Impossibile leggere settings.json, uso default.');
            this.settings = { ...DEFAULT_SETTINGS };
        }
        return this.settings;
    }
    /**
     * Restituisce le impostazioni correnti
     */
    getSettings() {
        return this.settings;
    }
    /**
     * Salva le impostazioni su disco
     */
    async saveSettings() {
        const dir = path.dirname(this.settingsPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Errore nel salvataggio delle impostazioni:', error);
            throw error;
        }
    }
    /**
     * Aggiorna una singola impostazione e salva su disco
     */
    async updateSetting(key, value) {
        this.settings[key] = value;
        await this.saveSettings();
    }
    /**
     * Ripristina le impostazioni ai valori predefiniti
     */
    async resetSettings() {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
    }
    /**
     * Carica il system prompt da disco
     */
    async loadSystemPrompt() {
        const systemPromptPath = path.join(this.context.globalStorageUri.fsPath, 'config/system_prompt.md');
        try {
            return await fs.readFile(systemPromptPath, 'utf-8');
        }
        catch (error) {
            // Se il file non esiste, restituisce un prompt di default
            const defaultPrompt = '# System Prompt\n\nSei Jarvis, il miglior IDE al mondo.';
            await this.saveSystemPrompt(defaultPrompt); // Crea il file con il contenuto di default
            return defaultPrompt;
        }
    }
    /**
     * Salva il system prompt su disco
     */
    async saveSystemPrompt(content) {
        const systemPromptPath = path.join(this.context.globalStorageUri.fsPath, 'config/system_prompt.md');
        const dir = path.dirname(systemPromptPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(systemPromptPath, content, 'utf-8');
        }
        catch (error) {
            console.error('Errore nel salvataggio del system prompt:', error);
            throw error;
        }
    }
    // Metodi legacy per compatibilità
    async getSystemPrompt() {
        return this.loadSystemPrompt();
    }
    async updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        await this.saveSettings();
    }
    /**
     * Esporta le impostazioni in un file JSON esterno
     * @param filePath Percorso del file in cui esportare le impostazioni
     */
    async exportToFile(filePath) {
        try {
            await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Errore nell\'esportazione delle impostazioni:', error);
            throw error;
        }
    }
    /**
     * Importa le impostazioni da un file JSON esterno
     * @param filePath Percorso del file da cui importare le impostazioni
     */
    async importFromFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);
            this.settings = { ...DEFAULT_SETTINGS, ...parsedData };
            await this.saveSettings();
        }
        catch (error) {
            console.error('Errore nell\'importazione delle impostazioni:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=SettingsManager.js.map