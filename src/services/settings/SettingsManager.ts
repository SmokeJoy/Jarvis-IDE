import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Settings } from '../../shared/types/settings.types';
import { ApiConfiguration, LLMProviderId } from '../../src/shared/types/api.types';
import { ContextPrompt } from '../../shared/types/webview.types';
import { TelemetrySetting } from '../../shared/types/telemetry.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interfaccia per un profilo di prompt
 */
export interface PromptProfile {
  id: string; // UUID o ID univoco
  name: string; // Nome leggibile
  description?: string; // Descrizione facoltativa
  contextPrompt: ContextPrompt; // Struttura MCP completa
  isDefault?: boolean; // Flag per profilo attivo
  createdAt?: number; // Data di creazione (timestamp)
  updatedAt?: number; // Data ultimo aggiornamento (timestamp)
}

/**
 * Interfaccia per le impostazioni di Jarvis
 */
export interface JarvisSettings {
  use_docs: boolean;
  coder_mode: boolean;
  contextPrompt: string; // legacy fallback
  selectedModel: string;
  multi_agent: boolean;

  // Nuove proprietà MCP
  apiConfiguration?: ApiConfiguration;
  telemetrySetting?: TelemetrySetting;
  customInstructions?: string;
  promptProfiles?: PromptProfile[]; // Nuovo array di profili di prompt
}

// Profilo di prompt predefinito
const DEFAULT_PROMPT_PROFILE: PromptProfile = {
  id: 'default',
  name: 'Profilo Predefinito',
  description: 'Profilo di prompt predefinito del sistema',
  isDefault: true,
  contextPrompt: {
    system: `Sei un assistente intelligente che aiuta nello sviluppo software.
- Rispondi in modo preciso e conciso
- Utilizza esempi di codice quando possibile
- Rispondi in italiano`,

    user: `In quanto utente, ti chiederò assistenza per:
- Comprendere concetti di programmazione
- Sviluppare nuovo codice
- Risolvere bug ed errori`,

    persona: `# Profilo Assistente
- Esperto di programmazione
- Orientato alla risoluzione dei problemi
- Stile comunicativo chiaro e diretto`,

    context: `# Contesto Attuale
- Progetto: Jarvis IDE
- Linguaggio: TypeScript/React
- Framework: VS Code Extension API`,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/**
 * Valori di default per le impostazioni di Jarvis
 */
const DEFAULT_SETTINGS: JarvisSettings = {
  use_docs: false,
  coder_mode: true,
  contextPrompt: '',
  selectedModel: '',
  multi_agent: false,
  promptProfiles: [DEFAULT_PROMPT_PROFILE],
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
      throw new Error(
        'SettingsManager non inizializzato correttamente. Fornire un context alla prima chiamata.'
      );
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

      // Assicura che ci sia almeno un profilo di prompt
      if (!this.settings.promptProfiles || this.settings.promptProfiles.length === 0) {
        this.settings.promptProfiles = [DEFAULT_PROMPT_PROFILE];
      }

      // Migrazione legacy: se c'è contextPrompt come stringa ma non in un profilo
      if (
        this.settings.contextPrompt &&
        typeof this.settings.contextPrompt === 'string' &&
        this.settings.contextPrompt.length > 0
      ) {
        // Verifica se esiste già un profilo di default
        const defaultProfileIndex = this.settings.promptProfiles.findIndex(
          (p) => p.id === 'default'
        );

        if (defaultProfileIndex >= 0) {
          // Aggiorna il profilo esistente con la stringa legacy come prompt di sistema
          this.settings.promptProfiles[defaultProfileIndex].contextPrompt.system =
            this.settings.contextPrompt;
          this.settings.promptProfiles[defaultProfileIndex].updatedAt = Date.now();
        } else {
          // Crea un nuovo profilo con la stringa legacy
          const legacyProfile: PromptProfile = {
            ...DEFAULT_PROMPT_PROFILE,
            name: 'Profilo Legacy',
            description: 'Profilo creato da impostazioni legacy',
            contextPrompt: {
              ...DEFAULT_PROMPT_PROFILE.contextPrompt,
              system: this.settings.contextPrompt,
            },
          };
          this.settings.promptProfiles.push(legacyProfile);
        }
      }

      // Assicura che ci sia esattamente un profilo predefinito
      this.ensureDefaultProfile();
    } catch (error) {
      // Se il file non esiste o c'è un errore, utilizza le impostazioni predefinite
      console.warn('Impossibile leggere settings.json, uso default.');
      this.settings = { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }

  /**
   * Assicura che ci sia esattamente un profilo predefinito
   */
  private ensureDefaultProfile(): void {
    if (!this.settings.promptProfiles || this.settings.promptProfiles.length === 0) {
      this.settings.promptProfiles = [DEFAULT_PROMPT_PROFILE];
      return;
    }

    const defaultProfiles = this.settings.promptProfiles.filter((p) => p.isDefault);

    if (defaultProfiles.length === 0) {
      // Nessun profilo predefinito, imposta il primo come predefinito
      this.settings.promptProfiles[0].isDefault = true;
    } else if (defaultProfiles.length > 1) {
      // Troppi profili predefiniti, mantiene solo il primo
      defaultProfiles.forEach((profile, index) => {
        if (index > 0) {
          const profileIndex = this.settings.promptProfiles!.findIndex((p) => p.id === profile.id);
          if (profileIndex >= 0) {
            this.settings.promptProfiles![profileIndex].isDefault = false;
          }
        }
      });
    }
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
  public async updateSetting<K extends keyof JarvisSettings>(
    key: K,
    value: JarvisSettings[K]
  ): Promise<void> {
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
    const systemPromptPath = path.join(
      this.context.globalStorageUri.fsPath,
      'config/system_prompt.md'
    );
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
    const systemPromptPath = path.join(
      this.context.globalStorageUri.fsPath,
      'config/system_prompt.md'
    );
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
      console.error("Errore nell'esportazione delle impostazioni:", error);
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
      console.error("Errore nell'importazione delle impostazioni:", error);
      throw error;
    }
  }

  // ===== NUOVI METODI PER LA GESTIONE DEI PROFILI DI PROMPT =====

  /**
   * Ottiene tutti i profili di prompt
   */
  public getPromptProfiles(): PromptProfile[] {
    if (!this.settings.promptProfiles || this.settings.promptProfiles.length === 0) {
      this.settings.promptProfiles = [DEFAULT_PROMPT_PROFILE];
    }
    return this.settings.promptProfiles;
  }

  /**
   * Ottiene un profilo di prompt per ID
   */
  public getPromptProfile(id: string): PromptProfile | undefined {
    return this.getPromptProfiles().find((profile) => profile.id === id);
  }

  /**
   * Ottiene il profilo di prompt attivo (quello impostato come default)
   */
  public getActivePromptProfile(): PromptProfile {
    const profiles = this.getPromptProfiles();
    const defaultProfile = profiles.find((profile) => profile.isDefault);
    return defaultProfile || profiles[0];
  }

  /**
   * Imposta un profilo come attivo in base all'ID
   */
  public async setActivePromptProfile(id: string): Promise<PromptProfile> {
    const profiles = this.getPromptProfiles();
    const targetProfileIndex = profiles.findIndex((profile) => profile.id === id);

    if (targetProfileIndex < 0) {
      throw new Error(`Profilo con ID ${id} non trovato`);
    }

    // Disattiva tutti i profili e attiva solo quello selezionato
    profiles.forEach((profile, index) => {
      profile.isDefault = index === targetProfileIndex;
      profile.updatedAt = Date.now();
    });

    // Aggiorna anche il contextPrompt legacy per retrocompatibilità
    const activeProfile = this.getActivePromptProfile();
    this.settings.contextPrompt = activeProfile.contextPrompt.system || '';

    await this.saveSettings();
    return profiles[targetProfileIndex];
  }

  /**
   * Crea un nuovo profilo di prompt
   */
  public async createPromptProfile(profile: Partial<PromptProfile>): Promise<PromptProfile> {
    const profiles = this.getPromptProfiles();

    const newProfile: PromptProfile = {
      id: profile.id || uuidv4(),
      name: profile.name || `Profilo ${profiles.length + 1}`,
      description: profile.description || '',
      contextPrompt: profile.contextPrompt || { ...DEFAULT_PROMPT_PROFILE.contextPrompt },
      isDefault: !!profile.isDefault,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Se il nuovo profilo è impostato come default, disattiva gli altri
    if (newProfile.isDefault) {
      profiles.forEach((p) => (p.isDefault = false));
    }

    profiles.push(newProfile);
    await this.saveSettings();

    return newProfile;
  }

  /**
   * Aggiorna un profilo di prompt esistente
   */
  public async updatePromptProfile(
    id: string,
    updates: Partial<PromptProfile>
  ): Promise<PromptProfile> {
    const profiles = this.getPromptProfiles();
    const profileIndex = profiles.findIndex((profile) => profile.id === id);

    if (profileIndex < 0) {
      throw new Error(`Profilo con ID ${id} non trovato`);
    }

    const wasDefault = profiles[profileIndex].isDefault;

    // Aggiorna il profilo mantenendo i campi immutabili
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      ...updates,
      id: profiles[profileIndex].id, // L'ID non può essere modificato
      createdAt: profiles[profileIndex].createdAt, // La data di creazione non può essere modificata
      updatedAt: Date.now(),
    };

    // Gestisce il flag isDefault
    if (!wasDefault && profiles[profileIndex].isDefault) {
      // Se il profilo è stato impostato come default, disattiva gli altri
      profiles.forEach((p, i) => {
        if (i !== profileIndex) {
          p.isDefault = false;
        }
      });
    } else if (wasDefault && !profiles[profileIndex].isDefault) {
      // Se era default e non lo è più, imposta un altro profilo come default
      if (profiles.length > 0) {
        const newDefaultIndex = profileIndex === 0 ? 1 : 0;
        profiles[newDefaultIndex].isDefault = true;
      }
    }

    // Se il profilo modificato è quello attivo, aggiorna anche il contextPrompt legacy
    if (profiles[profileIndex].isDefault) {
      this.settings.contextPrompt = profiles[profileIndex].contextPrompt.system || '';
    }

    await this.saveSettings();
    return profiles[profileIndex];
  }

  /**
   * Elimina un profilo di prompt
   */
  public async deletePromptProfile(id: string): Promise<void> {
    const profiles = this.getPromptProfiles();
    const profileIndex = profiles.findIndex((profile) => profile.id === id);

    if (profileIndex < 0) {
      throw new Error(`Profilo con ID ${id} non trovato`);
    }

    const wasDefault = profiles[profileIndex].isDefault;

    // Rimuove il profilo
    profiles.splice(profileIndex, 1);

    // Se il profilo eliminato era quello predefinito, imposta un altro profilo come default
    if (wasDefault && profiles.length > 0) {
      profiles[0].isDefault = true;
      this.settings.contextPrompt = profiles[0].contextPrompt.system || '';
    }

    // Se non ci sono più profili, aggiunge quello di default
    if (profiles.length === 0) {
      profiles.push(DEFAULT_PROMPT_PROFILE);
      this.settings.contextPrompt = DEFAULT_PROMPT_PROFILE.contextPrompt.system || '';
    }

    await this.saveSettings();
  }

  /**
   * Salva l'intero array di profili di prompt
   */
  public async savePromptProfiles(profiles: PromptProfile[]): Promise<void> {
    if (!profiles || profiles.length === 0) {
      throw new Error('È necessario fornire almeno un profilo di prompt');
    }

    // Verifica che ci sia almeno un profilo predefinito
    const defaultProfiles = profiles.filter((p) => p.isDefault);
    if (defaultProfiles.length === 0) {
      profiles[0].isDefault = true;
    } else if (defaultProfiles.length > 1) {
      // Mantiene solo il primo profilo predefinito
      defaultProfiles.forEach((profile, index) => {
        if (index > 0) {
          const profileIndex = profiles.findIndex((p) => p.id === profile.id);
          if (profileIndex >= 0) {
            profiles[profileIndex].isDefault = false;
          }
        }
      });
    }

    // Aggiorna il contextPrompt legacy per retrocompatibilità
    const defaultProfile = profiles.find((p) => p.isDefault);
    if (defaultProfile) {
      this.settings.contextPrompt = defaultProfile.contextPrompt.system || '';
    }

    this.settings.promptProfiles = profiles;
    await this.saveSettings();
  }
}
