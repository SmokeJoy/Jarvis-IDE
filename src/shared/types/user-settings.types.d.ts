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
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  enableStreaming?: boolean;
  contextWindow?: number;
  model?: string;
  workingDirectory?: string;
  shell?: string;
  customInstructions?: string;
  mode?: string;
  planActSeparateModels?: boolean;
  displayMode?: 'standard' | 'minimal' | 'full';
  font?: string;
  fontSize: number;
  theme: 'light' | 'dark' | 'system';
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
  enabled?: boolean;
  browserContextEnabled?: boolean;
  headless?: boolean;
  timeout: number;
  useSandbox?: boolean;
  allowJavaScript?: boolean;
  allowCookies?: boolean;
  allowLocalStorage?: boolean;
  debugMode: boolean;
  includeFullPageText?: boolean;
  includeActiveTabOnly?: boolean;
  includeHTMLSnapshot?: boolean;
  includeCodeContext?: boolean;
  useMhtml?: boolean;
  maxUrls?: number;
  maxNavigationDepth?: number;
  userAgent?: string;
  customUserAgent?: string;
  customChromeExecutablePath?: string;
  url?: string;
  startUrl?: string;
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
  approvedTools?: string[];
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
export declare function normalizeChatSettings(settings?: Partial<ChatSettings>): ChatSettings;
/**
 * Normalizza le impostazioni di browser fornendo valori predefiniti
 * @param settings Impostazioni di browser parziali
 * @returns Impostazioni di browser complete con valori predefiniti
 */
export declare function normalizeBrowserSettings(
  settings?: Partial<BrowserSettings>
): BrowserSettings;
/**
 * Normalizza le impostazioni di approvazione automatica fornendo valori predefiniti
 * @param settings Impostazioni di approvazione automatica parziali
 * @returns Impostazioni di approvazione automatica complete con valori predefiniti
 */
export declare function normalizeAutoApprovalSettings(
  settings?: Partial<AutoApprovalSettings>
): AutoApprovalSettings;
//# sourceMappingURL=user-settings.types.d.ts.map
