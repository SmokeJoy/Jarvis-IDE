import * as vscode from 'vscode';
import { MasConfig, AgentConfig, CodeStyle } from '../shared/types/mas.types.js';

/**
 * Gestisce la persistenza dello stato del sistema Multi-Agent
 */
export class MasStateManager {
  // Chiavi per la memorizzazione nell'extension context
  private static readonly CONFIG_KEY = 'mas-config';
  private static readonly DEFAULT_MODE_KEY = 'mas-default-mode';
  private static readonly DEFAULT_STYLE_KEY = 'mas-default-style';
  
  // Configurazione di default
  private defaultConfig: MasConfig = {
    version: '1.0',
    systemMode: 'collaborative',
    defaultStyle: 'standard',
    agents: []
  };
  
  /**
   * Costruttore del MasStateManager
   * @param context Il contesto dell'estensione VS Code
   */
  constructor(private context: vscode.ExtensionContext) {
    // Inizializza la configurazione di default se non esiste
    if (!this.loadConfig()) {
      this.saveConfig(this.defaultConfig);
    }
  }
  
  /**
   * Carica la configurazione MAS dal contesto dell'estensione
   * @returns La configurazione MAS o undefined
   */
  public loadConfig(): MasConfig | undefined {
    return this.context.globalState.get<MasConfig>(MasStateManager.CONFIG_KEY);
  }
  
  /**
   * Salva la configurazione MAS nel contesto dell'estensione
   * @param config La configurazione da salvare
   */
  public saveConfig(config: MasConfig): void {
    this.context.globalState.update(MasStateManager.CONFIG_KEY, config);
  }
  
  /**
   * Aggiorna la configurazione di un agente
   * @param agentConfig La configurazione aggiornata dell'agente
   */
  public updateAgentConfig(agentConfig: AgentConfig): void {
    const config = this.loadConfig() || this.defaultConfig;
    
    // Trova e aggiorna l'agente o aggiungilo se non esiste
    const existingAgentIndex = config.agents.findIndex(a => a.id === agentConfig.id);
    
    if (existingAgentIndex !== -1) {
      // Aggiorna l'agente esistente
      config.agents[existingAgentIndex] = agentConfig;
    } else {
      // Aggiungi un nuovo agente
      config.agents.push(agentConfig);
    }
    
    // Salva la configurazione aggiornata
    this.saveConfig(config);
  }
  
  /**
   * Rimuove un agente dalla configurazione
   * @param agentId ID dell'agente da rimuovere
   */
  public removeAgentConfig(agentId: string): void {
    const config = this.loadConfig() || this.defaultConfig;
    
    // Filtra gli agenti per rimuovere quello specificato
    config.agents = config.agents.filter(a => a.id !== agentId);
    
    // Salva la configurazione aggiornata
    this.saveConfig(config);
  }
  
  /**
   * Aggiorna la modalità predefinita del sistema
   * @param mode La nuova modalità predefinita
   */
  public updateDefaultMode(mode: 'collaborative' | 'single'): void {
    const config = this.loadConfig() || this.defaultConfig;
    
    // Aggiorna la modalità di sistema
    config.systemMode = mode;
    
    // Salva la configurazione aggiornata
    this.saveConfig(config);
  }
  
  /**
   * Aggiorna lo stile di codice predefinito
   * @param style Il nuovo stile predefinito
   */
  public updateDefaultStyle(style: CodeStyle): void {
    const config = this.loadConfig() || this.defaultConfig;
    
    // Aggiorna lo stile predefinito
    config.defaultStyle = style;
    
    // Salva la configurazione aggiornata
    this.saveConfig(config);
  }
  
  /**
   * Ripristina la configurazione di default
   */
  public resetToDefaults(): void {
    this.saveConfig(this.defaultConfig);
  }
  
  /**
   * Esporta la configurazione come oggetto JSON
   * @returns La configurazione come oggetto JSON
   */
  public exportConfig(): string {
    const config = this.loadConfig() || this.defaultConfig;
    return JSON.stringify(config, null, 2);
  }
  
  /**
   * Importa la configurazione da oggetto JSON
   * @param jsonConfig La configurazione in formato JSON
   * @returns true se l'importazione è riuscita, false altrimenti
   */
  public importConfig(jsonConfig: string): boolean {
    try {
      const config = JSON.parse(jsonConfig) as MasConfig;
      
      // Verifica che la struttura sia valida
      if (!config.version || !Array.isArray(config.agents)) {
        return false;
      }
      
      // Salva la configurazione
      this.saveConfig(config);
      return true;
    } catch (error) {
      console.error('Errore durante l\'importazione della configurazione:', error);
      return false;
    }
  }
} 