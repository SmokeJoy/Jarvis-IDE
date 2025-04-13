import * as vscode from 'vscode';
import { OpenAiCompatibleModelInfo } from '../../shared/types/api.types';
import { ApiConfiguration } from '../../shared/types/api.types';
import { ExtensionState, ExtensionMessage } from '../../shared/ExtensionMessage';
import {
  AutoApprovalSettings,
  ChatSettings,
  BrowserSettings,
} from '../../shared/types/user-settings.types';
import { McpHub } from '../../services/mcp/McpHub';
import {
  IJarvisProvider,
  ExtendedChatSettings,
  JarvisSettings,
  ConfigModelInfo,
  TelemetrySetting,
  HistoryItem,
} from '../../shared/types/provider.types';
type SecretKey = string;
export declare class JarvisProvider implements IJarvisProvider {
  readonly context: vscode.ExtensionContext;
  private readonly outputChannel;
  private autoApprovalSettings;
  private customInstructions;
  private _task?;
  private _images?;
  private _historyItem?;
  private telemetryService?;
  static readonly sideBarId = 'jarvis-ide.SidebarProvider';
  static readonly tabPanelId = 'jarvis-ide.TabPanelProvider';
  private static activeInstances;
  private disposables;
  private view?;
  private jarvis?;
  workspaceTracker?: WorkspaceTracker;
  mcpHub?: McpHub;
  accountService?: JarvisAccountService;
  private latestAnnouncementId;
  private mcpMarketplaceEnabled;
  private telemetrySetting;
  private planActSeparateModelsSetting;
  private previousModeProvider?;
  private previousModeModelId?;
  private previousModeModelInfo?;
  private previousModeVsCodeLmModelSelector?;
  private previousModeThinkingBudgetTokens?;
  private lastShownAnnouncementId?;
  private taskHistory;
  private userInfo?;
  private settings;
  private use_docs;
  private contextPrompt;
  private coder_mode;
  private multi_agent;
  private fileManager?;
  private aiFileManager?;
  private settingsManager?;
  private telemetry?;
  private masSystem;
  private cachedOllamaModels;
  private cachedLmStudioModels;
  private taskQueue;
  private apiConfiguration;
  private mcpDispatcher;
  constructor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    settings: JarvisSettings,
    autoApprovalSettings?: AutoApprovalSettings,
    customInstructions?: string,
    _task?: string | undefined,
    _images?: string[] | undefined,
    _historyItem?: HistoryItem | undefined,
    telemetryService?: TelemetryService | undefined
  );
  private initializeSettings;
  private initializeJarvis;
  dispose(): Promise<void>;
  handleSignOut(): Promise<void>;
  setUserInfo(info?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }): Promise<void>;
  static getVisibleInstance(): JarvisProvider | undefined;
  resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel): Promise<void>;
  initJarvisWithTask(task?: string, images?: string[]): Promise<void>;
  initJarvisWithHistoryItem(historyItem: HistoryItem): Promise<void>;
  /**
   * Invia un messaggio alla WebView
   * @param message Il messaggio da inviare alla WebView
   */
  postMessageToWebview(message: ExtensionMessage): Promise<void>;
  private getHtmlContent;
  private getHMRHtmlContent;
  private setWebviewMessageListener;
  updateTelemetrySetting(telemetrySetting: TelemetrySetting): Promise<void>;
  togglePlanActModeWithChatSettings(
    chatSettings: ExtendedChatSettings,
    chatContent?: unknown
  ): Promise<void>;
  cancelTask(): Promise<void>;
  updateCustomInstructions(instructions?: string): Promise<void>;
  updateApiConfiguration(apiConfiguration: ApiConfiguration): Promise<void>;
  getDocumentsPath(): Promise<string>;
  ensureMcpServersDirectoryExists(): Promise<string>;
  ensureSettingsDirectoryExists(): Promise<string>;
  /**
   * Ottiene il contenuto del system prompt
   * @returns Contenuto del system prompt
   */
  getSystemPrompt(): Promise<string>;
  /**
   * Salva il contenuto del system prompt
   * @param content Contenuto del system prompt
   */
  saveSystemPrompt(content: string): Promise<void>;
  /**
   * Ripristina il system prompt predefinito
   */
  resetSystemPrompt(): Promise<void>;
  readFile(filePath: string): Promise<string>;
  editFile(filePath: string, newContent: string): Promise<void>;
  createFile(filePath: string, content: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(dirPath?: string): Promise<string[]>;
  listFilesRecursive(dirPath?: string): Promise<string[]>;
  handleSettingChange(key: string, value: any): Promise<void>;
  postStateToWebview(): Promise<void>;
  getStateToPostToWebview(): Promise<ExtensionState>;
  clearTask(): Promise<void>;
  getState(): Promise<{
    apiConfiguration: ApiConfiguration;
    lastShownAnnouncementId?: string;
    customInstructions?: string;
    taskHistory?: HistoryItem[];
    autoApprovalSettings: AutoApprovalSettings;
    browserSettings: BrowserSettings;
    chatSettings: ChatSettings;
    userInfo?: unknown;
    previousModeProvider?: string;
    previousModeModelId?: string;
    previousModeModelInfo?: OpenAiCompatibleModelInfo;
    previousModeVsCodeLmModelSelector?: string;
    previousModeThinkingBudgetTokens?: number;
    mcpMarketplaceEnabled: boolean;
    telemetrySetting: TelemetrySetting;
    planActSeparateModelsSetting: boolean;
  }>;
  private getGlobalState;
  private updateGlobalState;
  updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]>;
  private getWorkspaceState;
  private storeSecret;
  getSecret(key: SecretKey): Promise<string | undefined>;
  fetchOpenGraphData(url: string): Promise<any>;
  checkIsImageUrl(url: string): Promise<boolean>;
  resetState(): Promise<void>;
  private getCurrentTaskItem;
  private getApiMetrics;
  /**
   * Ottiene l'elenco dei modelli disponibili
   * @returns Elenco dei modelli configurati
   */
  getAvailableModels(): Promise<ConfigModelInfo[]>;
  /**
   * Gestisce l'aggiornamento del modello selezionato
   * @param modelId ID del modello selezionato
   */
  private handleModelUpdate;
  /**
   * Recupera i modelli disponibili da Ollama
   * @param baseUrl URL base di Ollama
   * @returns Lista dei modelli disponibili
   */
  private getOllamaModels;
  /**
   * Recupera i modelli disponibili da LM Studio
   * @param baseUrl URL base di LM Studio
   * @returns Lista dei modelli disponibili
   */
  private getLmStudioModels;
  /**
   * Verifica se una stringa è un URL valido
   * @param url URL da verificare
   * @returns true se l'URL è valido
   */
  private isValidUrl;
  /**
   * Initializes the MAS system if not already initialized
   */
  private initMasSystem;
  /**
   * Sets up event listeners for the MAS system
   */
  private setupMasEventListeners;
  /**
   * Updates the task queue state and sends it to the WebView
   */
  private updateTaskQueue;
  /**
   * Gets the current task queue from the MAS system
   * This is a temporary implementation for the MVP
   */
  private getTaskQueue;
  /**
   * Gets the status of all agents in the MAS system
   */
  private getAgentsStatus;
  /**
   * Gestisce i messaggi ricevuti dalla WebView
   * @param message Messaggio ricevuto dalla WebView
   */
  protected handleWebviewMessage(message: any): Promise<void>;
  /**
   * Handles sending an instruction to the CoderAgent
   */
  private handleSendCoderInstruction;
  /**
   * Handles getting the status of all agents
   */
  private handleGetAgentsStatus;
  /**
   * Handles getting the current task queue status
   */
  private handleGetTaskQueueStatus;
  /**
   * Handles aborting the current CoderAgent instruction
   */
  private handleAbortCoderInstruction;
  /**
   * Handles activating or deactivating an agent
   */
  private handleToggleAgentActive;
  private setModelConfiguration;
  switchToProvider(provider: string, modelId?: string): void;
  private updateApiConfig;
  private onInstructionCompleted;
}
declare class WorkspaceTracker {
  constructor(provider: any);
}
declare class JarvisAccountService {
  constructor(provider: any);
  signOut(): Promise<void>;
}
declare class TelemetryService {}
export {};
//# sourceMappingURL=JarvisProvider.d.ts.map
