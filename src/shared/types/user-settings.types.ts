/**
 * @file user-settings.types.ts
 * @description Definizioni centralizzate dei tipi di impostazioni utente
 * Questo file contiene tutte le interfacce relative alle impostazioni configurabili dall'utente
 */

/**
 * Impostazioni per la chat e la generazione di testo
 * Combina tutte le proprietà di varie definizioni per massimizzare la compatibilità
 */
export interface ChatSettings {
  // Parametri di generazione del modello
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  enableStreaming?: boolean;
  contextWindow?: number;
  model?: string;
  
  // Parametri di esecuzione
  workingDirectory?: string;
  shell?: string;
  customInstructions?: string;
  mode?: string;
  planActSeparateModels?: boolean;
  
  // Impostazioni di visualizzazione UI
  displayMode?: 'standard' | 'minimal' | 'full';
  font?: string;
  fontSize: number;
  theme: 'light' | 'dark' | 'system';
  
  // Funzionalità chat
  autosave?: boolean;
  autosaveInterval?: number;
  maxHistoryMessages?: number;
  enableDefaultPrompts?: boolean;
  enableAutoComplete?: boolean;
  enableSuggestions?: boolean;
  enableMarkdown?: boolean;
  language?: string;
  enableSyntaxHighlighting: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
  showAvatars: boolean;
  enableAutoScroll: boolean;
  displayTimestamps: boolean;
  useMarkdown: boolean;
}

/**
 * Impostazioni per il browser e la navigazione web
 * Combina tutte le proprietà di varie definizioni per massimizzare la compatibilità
 */
export interface BrowserSettings {
  // Impostazioni generali
  enabled?: boolean;
  browserContextEnabled?: boolean;
  headless?: boolean;
  timeout: number;
  
  // Comportamento browser
  useSandbox?: boolean;
  allowJavaScript?: boolean;
  allowCookies?: boolean;
  allowLocalStorage?: boolean;
  debugMode: boolean;
  
  // Acquisizione contenuto
  includeFullPageText?: boolean;
  includeActiveTabOnly?: boolean;
  includeHTMLSnapshot?: boolean;
  includeCodeContext?: boolean;
  useMhtml?: boolean;
  maxUrls?: number;
  maxNavigationDepth?: number;
  
  // Configurazioni browser
  userAgent?: string;
  customUserAgent?: string;
  customChromeExecutablePath?: string;
  
  // Navigazione
  url?: string;
  startUrl?: string;
  
  // Visualizzazione
  viewport?: {
    width: number;
    height: number;
  };
  width: number;
  height: number;
  trackNetworkActivity: boolean;
  screenshotSettings: {
    format: string;
    quality: number;
    fullPage: boolean;
  };
}

/**
 * Impostazioni per l'approvazione automatica delle azioni
 * Mantiene la struttura dell'interfaccia originale
 */
export interface AutoApprovalSettings {
  enabled: boolean;
  actions: {
    readFiles: boolean;
    editFiles: boolean;
    executeCommands: boolean;
    useBrowser: boolean;
    useMcp: boolean;
  };
  maxRequests: number;
  enableNotifications: boolean;
  tools: string[];
  approvedTools?: string[]; // Retrocompatibilità con WebUI
  threshold?: number;
  maxAutoApprovals: number;
  allowReadOnly: boolean;
  allowReadWrite: boolean;
  allowTerminalCommands: boolean;
}

/**
 * Normalizza le impostazioni di chat fornendo valori predefiniti
 * @param settings Impostazioni di chat parziali
 * @returns Impostazioni di chat complete con valori predefiniti
 */
export function normalizeChatSettings(settings?: Partial<ChatSettings>): ChatSettings {
  return {
    // Parametri di generazione del modello
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: [],
    enableStreaming: true,
    contextWindow: 4000,
    
    // Parametri di esecuzione
    workingDirectory: '',
    shell: '',
    customInstructions: '',
    planActSeparateModels: false,
    
    // Impostazioni di visualizzazione UI
    displayMode: 'standard',
    font: 'system-ui',
    fontSize: 14,
    theme: 'system',
    
    // Funzionalità chat
    autosave: true,
    autosaveInterval: 5,
    maxHistoryMessages: 100,
    enableDefaultPrompts: true,
    enableAutoComplete: true,
    enableSuggestions: true,
    enableMarkdown: true,
    language: 'en',
    enableSyntaxHighlighting: true,
    saveHistory: true,
    maxHistoryItems: 100,
    showAvatars: true,
    enableAutoScroll: true,
    displayTimestamps: true,
    useMarkdown: true,
    
    ...settings,
  };
}

/**
 * Normalizza le impostazioni di browser fornendo valori predefiniti
 * @param settings Impostazioni di browser parziali
 * @returns Impostazioni di browser complete con valori predefiniti
 */
export function normalizeBrowserSettings(settings?: Partial<BrowserSettings>): BrowserSettings {
  return {
    // Impostazioni generali
    enabled: true,
    browserContextEnabled: true,
    headless: true,
    timeout: 30000,
    
    // Comportamento browser
    useSandbox: true,
    allowJavaScript: true,
    allowCookies: true,
    allowLocalStorage: true,
    debugMode: false,
    
    // Acquisizione contenuto
    includeFullPageText: true,
    includeActiveTabOnly: false,
    includeHTMLSnapshot: false,
    includeCodeContext: true,
    useMhtml: false,
    maxUrls: 5,
    maxNavigationDepth: 2,
    
    // Navigazione
    startUrl: '',
    
    // Visualizzazione
    viewport: {
      width: 900,
      height: 600,
    },
    width: 900,
    height: 600,
    trackNetworkActivity: true,
    screenshotSettings: {
      format: 'png',
      quality: 90,
      fullPage: true,
    },
    
    ...settings,
  };
}

/**
 * Normalizza le impostazioni di approvazione automatica fornendo valori predefiniti
 * @param settings Impostazioni di approvazione automatica parziali
 * @returns Impostazioni di approvazione automatica complete con valori predefiniti
 */
export function normalizeAutoApprovalSettings(settings?: Partial<AutoApprovalSettings>): AutoApprovalSettings {
  return {
    enabled: false,
    actions: {
      readFiles: false,
      editFiles: false,
      executeCommands: false,
      useBrowser: false,
      useMcp: false,
    },
    maxRequests: 20,
    enableNotifications: false,
    tools: [],
    threshold: 0.8,
    maxAutoApprovals: 5,
    allowReadOnly: false,
    allowReadWrite: false,
    allowTerminalCommands: false,
    ...settings,
  };
} 