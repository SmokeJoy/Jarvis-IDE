import * as vscode from 'vscode';
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
export declare class SettingsManager {
    private static instance;
    private settingsPath;
    private settings;
    private context;
    private constructor();
    static getInstance(context?: vscode.ExtensionContext): SettingsManager;
    /**
     * Carica le impostazioni da disco
     */
    loadSettings(): Promise<JarvisSettings>;
    /**
     * Restituisce le impostazioni correnti
     */
    getSettings(): JarvisSettings;
    /**
     * Salva le impostazioni su disco
     */
    saveSettings(): Promise<void>;
    /**
     * Aggiorna una singola impostazione e salva su disco
     */
    updateSetting<K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]): Promise<void>;
    /**
     * Ripristina le impostazioni ai valori predefiniti
     */
    resetSettings(): Promise<void>;
    /**
     * Carica il system prompt da disco
     */
    loadSystemPrompt(): Promise<string>;
    /**
     * Salva il system prompt su disco
     */
    saveSystemPrompt(content: string): Promise<void>;
    getSystemPrompt(): Promise<string>;
    updateSettings(settings: Partial<JarvisSettings>): Promise<void>;
    /**
     * Esporta le impostazioni in un file JSON esterno
     * @param filePath Percorso del file in cui esportare le impostazioni
     */
    exportToFile(filePath: string): Promise<void>;
    /**
     * Importa le impostazioni da un file JSON esterno
     * @param filePath Percorso del file da cui importare le impostazioni
     */
    importFromFile(filePath: string): Promise<void>;
}
//# sourceMappingURL=SettingsManager.d.ts.map