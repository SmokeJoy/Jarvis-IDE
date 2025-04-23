import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { promises as fs } from 'fs';

// Importazioni di type necessarie raggruppate
import { OpenAiCompatibleModelInfo } from '../../src/shared/types/api.types';
import { LLMProviderId, ApiConfiguration } from '../../src/shared/types/api.types';
import { WebviewMessage } from '../../shared/types/webview.types';
import { OutgoingWebviewMessage } from '../../shared/types/webview.types';
import { ExtensionState } from '../../shared/ExtensionMessage';
import {
  AutoApprovalSettings,
  ChatSettings,
  BrowserSettings,
} from '../../shared/types/user-settings.types';
import { AgentStatus, TaskQueueState, TaskStatus } from '../../shared/types/mas.types';
import {
  IJarvisProvider,
  ExtendedChatSettings,
  JarvisSettings,
  SupervisorAgent,
  ConfigModelInfo,
  HistoryItem,
  TelemetrySetting,
} from '../../shared/types/provider.types';
import { ExportableSession } from '../../utils/exporters/types';

// Importo la nuova union discriminata e la sua type guard
import {
  ExtensionMessage,
  ExtensionState,
  ExtensionMessageType,
  isExtensionMessage,
  LogUpdatePayload,
  ErrorPayload,
  InfoPayload,
  ModelUpdatePayload,
  SettingsUpdatePayload,
  ChatUpdatePayload,
} from '@shared/messages/extension-messages';

// Importazioni concrete
import { SettingsManager } from '../../services/settings/SettingsManager';
import { McpHub } from '../../services/mcp/McpHub';
import { McpDispatcher } from '../../services/mcp/McpDispatcher';

// Definizioni locali
type GlobalStateKey = string;
type SecretKey = string;

// Definizione dell'enum per i tipi di messaggi WebView
enum WebviewMessageType {
  GET_BENCHMARK_STATS = 'getBenchmarkStats',
  GET_BENCHMARK_TIMELINE = 'getBenchmarkTimeline',
}

// Definisco l'interfaccia per le istruzioni MAS
interface MASInstructionData {
  instruction?: {
    id?: string;
    objective?: string;
  };
  agentId: string;
  result?: unknown;
  error?: {
    message?: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

// Interfaccia base per SupervisorAgent
interface SupervisorAgent {
  on(event: string, callback: (data: unknown) => void): void;
  sendInstruction(instruction: string): Promise<{ id: string }>;
  abortAllInstructions(): void;
  activateAgent(agentId: string): void;
  deactivateAgent(agentId: string): void;
  getAllAgentsStatus(): AgentStatus[];
}

// Interfaccia per AgentStatus
interface AgentStatus {
  id: string;
  name: string;
  status: string;
  capabilities: string[];
  isActive: boolean;
}

// Interfaccia per TaskQueueState
interface TaskQueueState {
  tasks: Array<{
    id: string;
    type: string;
    status: string;
    data: unknown;
    result?: unknown;
    error?: string;
  }>;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

interface JarvisProviderState {
  apiConfiguration: ApiConfiguration;
  lastShownAnnouncementId?: string;
  customInstructions?: string;
  taskHistory?: HistoryItem[];
  autoApprovalSettings: AutoApprovalSettings;
  browserSettings: BrowserSettings;
  chatSettings: ChatSettings;
  userInfo?: { displayName: string | null; email: string | null; photoURL: string | null };
  previousModeProvider?: string;
  previousModeModelId?: string;
  previousModeModelInfo?: OpenAiCompatibleModelInfo;
  previousModeVsCodeLmModelSelector?: string;
  previousModeThinkingBudgetTokens?: number;
  mcpMarketplaceEnabled: boolean;
  telemetrySetting: TelemetrySetting;
  planActSeparateModelsSetting: boolean;
  activeThreadId?: string;
  chatThreads: Map<string, ChatMessage[]>;
  currentModel?: OpenAiCompatibleModelInfo;
  isInitialized: boolean;
  lastError?: Error;
  settings: Record<string, unknown>;
}

export class JarvisProvider implements IJarvisProvider {
  public static readonly sideBarId = 'jarvis-ide.SidebarProvider';
  public static readonly tabPanelId = 'jarvis-ide.TabPanelProvider';
  private static activeInstances: Set<JarvisProvider> = new Set();
  private disposables: vscode.Disposable[] = [];
  private _view?: vscode.WebviewPanel;
  private jarvis?: { dispose(): void };
  workspaceTracker?: WorkspaceTracker;
  mcpHub?: McpHub;
  accountService?: JarvisAccountService;
  private latestAnnouncementId = 'march-22-2025';
  private mcpMarketplaceEnabled: boolean = true;
  private telemetrySetting: TelemetrySetting = { enabled: false };
  private planActSeparateModelsSetting: boolean = false;
  private previousModeProvider?: string;
  private previousModeModelId?: string;
  private previousModeModelInfo?: OpenAiCompatibleModelInfo;
  private previousModeVsCodeLmModelSelector?: string;
  private previousModeThinkingBudgetTokens?: number;
  private lastShownAnnouncementId?: string;
  private taskHistory: HistoryItem[] = [];
  private userInfo?: unknown;
  private settings: JarvisSettings;
  private use_docs: boolean = false;
  private contextPrompt: string = '';
  private coder_mode: boolean = true;
  private multi_agent: boolean = false;
  private fileManager?: FileManager;
  private aiFileManager?: AIFileManager;
  private settingsManager?: SettingsManager;
  private telemetry?: TelemetryService;
  private masSystem: SupervisorAgent | null = null;
  private cachedOllamaModels: string[] = [];
  private cachedLmStudioModels: string[] = [];
  private taskQueue: TaskQueueState = {
    active: undefined,
    pending: [],
    completed: [],
    failed: [],
    aborted: [],
    lastUpdated: new Date(),
    filter: {
      status: ['pending', 'active'],
      agentId: undefined,
      search: undefined,
    },
  };
  private apiConfiguration: ApiConfiguration = {
    provider: 'openai' as LLMProviderId,
    apiKey: '',
    modelId: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
  };
  private mcpDispatcher: McpDispatcher;
  private _extensionUri: vscode.Uri;
  private _state: ExtensionState;
  private state: JarvisProviderState = {
    apiConfiguration: this.apiConfiguration,
    autoApprovalSettings: this.autoApprovalSettings,
    browserSettings: {} as BrowserSettings,
    chatSettings: {} as ChatSettings,
    mcpMarketplaceEnabled: this.mcpMarketplaceEnabled,
    telemetrySetting: this.telemetrySetting,
    planActSeparateModelsSetting: this.planActSeparateModelsSetting,
    chatThreads: new Map<string, ChatMessage[]>(),
    isInitialized: false,
    settings: {},
  };
  private messageHandlers: Map<ExtensionMessageType, (message: ExtensionMessage) => void>;

  constructor(
    readonly context: vscode.ExtensionContext,
    private readonly outputChannel: vscode.OutputChannel,
    settings: JarvisSettings,
    private autoApprovalSettings: AutoApprovalSettings = {
      enabled: false,
      actions: {
        readFiles: false,
        editFiles: false,
        executeCommands: false,
        useBrowser: false,
        useMcp: false,
      },
      maxRequests: 0,
      enableNotifications: true,
      tools: [],
      maxAutoApprovals: 3,
      allowReadOnly: false,
      allowReadWrite: false,
      allowTerminalCommands: false,
    },
    private customInstructions: string = '',
    private _task?: string,
    private _images?: string[],
    private _historyItem?: HistoryItem,
    private telemetryService?: TelemetryService,
    extensionUri: vscode.Uri,
    initialState: ExtensionState
  ) {
    this.settings = settings;
    this.outputChannel.appendLine('JarvisProvider instantiated');
    JarvisProvider.activeInstances.add(this);
    this.workspaceTracker = new WorkspaceTracker(this);

    // Inizializza McpHub
    this.mcpHub = new McpHub();
    this.accountService = new JarvisAccountService(this);

    // Inizializza McpDispatcher
    this.mcpDispatcher = new McpDispatcher((msg: OutgoingWebviewMessage) =>
      this.postMessageToWebview(msg)
    );

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.postStateToWebview();
      })
    );

    // Inizializza il SettingsManager
    this.settingsManager = SettingsManager.getInstance(this.context);

    // Inizializza i manager
    this.fileManager = new FileManager();
    this.aiFileManager = new AIFileManager(this.fileManager);

    // Carica le impostazioni all'avvio
    this.initializeSettings().catch((error) => {
      console.error("Errore nell'inizializzazione delle impostazioni:", error);
    });

    this.initializeJarvis();

    this._extensionUri = extensionUri;
    this._state = initialState;

    this.messageHandlers = new Map();
    this.initializeMessageHandlers();
  }

  private async initializeSettings(): Promise<void> {
    if (!this.settingsManager) {
      throw new Error('SettingsManager non inizializzato');
    }

    // Carica le impostazioni da disco
    const settings = await this.settingsManager.loadSettings();

    // Aggiorna le proprietà in memoria
    this.use_docs = settings.use_docs;
    this.contextPrompt = settings.contextPrompt;
    this.coder_mode = settings.coder_mode;
    this.multi_agent = settings.multi_agent;

    // Se è impostato un modello, aggiorna la configurazione API
    if (settings.selectedModel) {
      this.apiConfiguration.modelId = settings.selectedModel;
    }

    this.outputChannel.appendLine('Impostazioni caricate con successo');
  }

  private async initializeJarvis() {
    // Implementa la logica per inizializzare Jarvis con la configurazione corretta
    // Questo dipende dall'implementazione della classe Jarvis
    // Esempio (da implementare in base alle necessità effettive):
    // this.jarvis = new Jarvis(/* parametri necessari */);
  }

  async dispose() {
    JarvisProvider.activeInstances.delete(this);
    this._view = undefined;

    if (this.jarvis) {
      this.jarvis.dispose();
    }

    // Release workspace resources
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  async handleSignOut() {
    if (this.accountService) {
      await this.accountService.signOut();
    }
    // Reset user state
    await this.setUserInfo(undefined);
    // Update UI
    await this.postStateToWebview();
  }

  async setUserInfo(info?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }) {
    this.userInfo = info;
    await this.updateGlobalState('userInfo', info);
  }

  public static getVisibleInstance(): JarvisProvider | undefined {
    return Array.from(JarvisProvider.activeInstances).find((instance) => instance._view?.visible);
  }

  async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
    this._view = webviewView as vscode.WebviewPanel;
    // Initialize the webview settings
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Set the HTML content
    let htmlContent = '';
    if (process.env['NODE_ENV'] === 'development' && process.env['WEBVIEW_URL']) {
      htmlContent = await this.getHMRHtmlContent(webviewView.webview);
    } else {
      htmlContent = this.getHtmlContent(webviewView.webview);
    }
    webviewView.webview.html = htmlContent;

    // Setup event listeners
    this.setWebviewMessageListener(webviewView.webview);

    // Initialize task based on constructor parameters
    if (this._task || this._images) {
      await this.initJarvisWithTask(this._task, this._images);
    } else if (this._historyItem) {
      await this.initJarvisWithHistoryItem(this._historyItem);
    }

    // Send the initial state to the webview
    await this.postStateToWebview();

    // Carica eventuali impostazioni salvate
    const savedSettings = await this.settingsManager?.loadSettings();
    if (savedSettings) {
      // Applica le impostazioni al provider
      this.use_docs = savedSettings.use_docs ?? this.use_docs;
      this.contextPrompt = savedSettings.contextPrompt ?? this.contextPrompt;
      this.coder_mode = savedSettings.coder_mode ?? this.coder_mode;
      this.multi_agent = savedSettings.multi_agent ?? this.multi_agent;

      // Aggiorna l'interfaccia utente
      webviewView.webview.postMessage({
        type: 'settingsLoaded',
        settings: {
          use_docs: this.use_docs,
          contextPrompt: this.contextPrompt,
          coder_mode: this.coder_mode,
          multi_agent: this.multi_agent,
        },
      });
    }
  }

  async initJarvisWithTask(/* task?: string, images?: string[] */) {
    // TODO: Implement task initialization logic
  }

  async initJarvisWithHistoryItem(/* historyItem: HistoryItem */) {
    // TODO: Implement history item initialization logic
  }

  /**
   * Invia un messaggio alla WebView
   * @param message Il messaggio da inviare alla WebView
   */
  public async postMessageToWebview(message: OutgoingWebviewMessage): Promise<void> {
    if (!this._view?.webview) {
      return;
    }

    try {
      // Aggiungiamo source per aiutare nel debug
      const messageWithSource = {
        ...message,
        source: 'extension',
      };

      // Invia il messaggio
      this._view.webview.postMessage(messageWithSource);
    } catch (error) {
      console.error("Errore nell'invio del messaggio alla WebView:", error);
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    // Generate HTML for the webview
    const scriptUri = getUri(webview, this._extensionUri, ['out', 'webview', 'main.js']);
    const styleUri = getUri(webview, this._extensionUri, ['out', 'webview', 'main.css']);
    const codiconsUri = getUri(webview, this._extensionUri, [
      'node_modules',
      '@vscode/codicons',
      'dist',
      'codicon.css',
    ]);
    const nonce = getNonce();

    // Get VSCode theme
    const theme = getTheme();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
          <link href="${styleUri}" rel="stylesheet">
          <link href="${codiconsUri}" rel="stylesheet">
          <title>Jarvis IDE</title>
          <script>
            window.vscode = acquireVsCodeApi();
            window.initialData = {}; 
            window.resourceBaseUrl = "${webview.asWebviewUri(this._extensionUri)}";
            window.isDarkTheme = ${theme === 'dark'};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private async getHMRHtmlContent(webview: vscode.Webview): Promise<string> {
    // Generate HTML for development with Hot Module Replacement
    const scriptUri = process.env['WEBVIEW_URL']
      ? vscode.Uri.parse(process.env['WEBVIEW_URL'])
      : scriptPathOnDisk;
    const nonce = getNonce();

    // Get VSCode theme
    const theme = getTheme();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src http://localhost:5173; style-src http://localhost:5173 'unsafe-inline'; font-src http://localhost:5173; img-src ${webview.cspSource} https: data: http://localhost:5173; script-src 'nonce-${nonce}' http://localhost:5173 'unsafe-eval';">
          <title>Jarvis IDE</title>
          <script nonce="${nonce}">
            window.vscode = acquireVsCodeApi();
            window.initialData = {}; 
            window.resourceBaseUrl = "${webview.asWebviewUri(this._extensionUri)}";
            window.isDarkTheme = ${theme === 'dark'};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}/@vite/client"></script>
          <script type="module" nonce="${nonce}" src="${scriptUri}/src/main.tsx"></script>
        </body>
      </html>
    `;
  }

  private setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        // Implement message handling logic
        console.log(`Received message: ${JSON.stringify(message)}`);

        switch (message.type) {
          case 'updateSetting':
            if (message.key && message.value !== undefined) {
              await this.handleSettingChange(message.key as keyof JarvisSettings, message.value);
            }
            break;

          case 'getSettings':
            if (!this.settingsManager) {
              throw new Error('SettingsManager non inizializzato');
            }

            // Invia le impostazioni correnti alla WebView
            webview.postMessage({
              type: 'settingsLoaded',
              settings: {
                use_docs: this.use_docs,
                coder_mode: this.coder_mode,
                contextPrompt: this.contextPrompt,
                selectedModel: this.apiConfiguration.modelId || '',
                multi_agent: this.multi_agent,
                availableModels: await this.getAvailableModels(),
              },
            });
            break;

          case 'getSystemPrompt':
            try {
              const content = await this.getSystemPrompt();
              const systemPromptDir = path.join(this._extensionUri.fsPath, 'config');
              const systemPromptPath = path.join(systemPromptDir, 'system_prompt.md');

              webview.postMessage({
                type: 'systemPromptLoaded',
                content,
                filePath: systemPromptPath,
              });
            } catch (error) {
              console.error('Errore nel caricamento del system prompt:', error);
              webview.postMessage({
                type: 'error',
                message: 'Impossibile caricare il system prompt',
              });
            }
            break;

          case 'saveSystemPrompt':
            if (typeof message.content === 'string') {
              try {
                await this.saveSystemPrompt(message.content);
                webview.postMessage({
                  type: 'systemPromptSaved',
                });
              } catch (error) {
                console.error('Errore nel salvataggio del system prompt:', error);
                webview.postMessage({
                  type: 'error',
                  message: 'Impossibile salvare il system prompt',
                });
              }
            }
            break;

          case 'saveAllSettings':
            if (message.settings && this.settingsManager) {
              try {
                const settings = message.settings;
                await this.handleSettingChange('use_docs', settings.use_docs);
                await this.handleSettingChange('coder_mode', settings.coder_mode);
                await this.handleSettingChange('contextPrompt', settings.contextPrompt);
                await this.handleSettingChange('multi_agent', settings.multi_agent);
                if (settings.selectedModel) {
                  await this.handleSettingChange('selectedModel', settings.selectedModel);
                }

                webview.postMessage({
                  type: 'settingsLoaded',
                  settings: {
                    use_docs: this.use_docs,
                    coder_mode: this.coder_mode,
                    contextPrompt: this.contextPrompt,
                    selectedModel: this.apiConfiguration.modelId || '',
                    multi_agent: this.multi_agent,
                    availableModels: await this.getAvailableModels(),
                  },
                });
              } catch (error) {
                console.error('Errore nel salvataggio delle impostazioni:', error);
                webview.postMessage({
                  type: 'error',
                  message: 'Impossibile salvare le impostazioni',
                });
              }
            }
            break;

          case 'resetAllSettings':
            try {
              if (this.settingsManager) {
                // Ripristina le impostazioni predefinite
                await this.settingsManager.resetSettings();

                // Aggiorna le impostazioni in memoria
                const settings = await this.settingsManager.loadSettings();
                this.use_docs = settings.use_docs;
                this.contextPrompt = settings.contextPrompt;
                this.coder_mode = settings.coder_mode;
                this.multi_agent = settings.multi_agent;

                // Notifica la webview
                webview.postMessage({
                  type: 'settingsLoaded',
                  settings: {
                    use_docs: this.use_docs,
                    coder_mode: this.coder_mode,
                    contextPrompt: this.contextPrompt,
                    selectedModel: this.apiConfiguration.modelId || '',
                    multi_agent: this.multi_agent,
                    availableModels: await this.getAvailableModels(),
                  },
                });
              }
            } catch (error) {
              console.error('Errore nel ripristino delle impostazioni predefinite:', error);
              webview.postMessage({
                type: 'error',
                message: 'Impossibile ripristinare le impostazioni predefinite',
              });
            }
            break;

          case 'openSystemPromptFile':
            try {
              const systemPromptDir = path.join(this._extensionUri.fsPath, 'config');
              const systemPromptPath = path.join(systemPromptDir, 'system_prompt.md');

              const uri = vscode.Uri.file(systemPromptPath);
              await vscode.commands.executeCommand('vscode.open', uri);
            } catch (error) {
              console.error("Errore nell'apertura del file system prompt:", error);
              webview.postMessage({
                type: 'error',
                message: 'Impossibile aprire il file system prompt',
              });
            }
            break;

          case 'log.export':
            // Gestione esportazione log
            vscode.window.showInformationMessage('Funzionalità di esportazione log in sviluppo');
            break;

          case 'log.openFolder':
            // Apertura cartella dei log
            try {
              const logPath = path.join(this._extensionUri.fsPath, 'logs');
              await fs.mkdir(logPath, { recursive: true });
              const uri = vscode.Uri.file(logPath);
              await vscode.commands.executeCommand('revealFileInOS', uri);
            } catch (error) {
              console.error("Errore nell'apertura della cartella dei log:", error);
              webview.postMessage({
                type: 'error',
                message: 'Impossibile aprire la cartella dei log',
              });
            }
            break;

          case 'updateModel':
            if (message.value) {
              try {
                // Aggiorna il modello selezionato
                await this.handleModelUpdate(message.value);

                // Conferma l'aggiornamento
                webview.postMessage({
                  type: 'settingUpdated',
                  key: 'selectedModel',
                  value: message.value,
                });
              } catch (error) {
                console.error("Errore nell'aggiornamento del modello:", error);
                webview.postMessage({
                  type: 'error',
                  message: 'Impossibile aggiornare il modello selezionato',
                });
              }
            }
            break;

          case 'resetSystemPrompt':
            try {
              await this.resetSystemPrompt();
              const newContent = await this.getSystemPrompt();
              webview.postMessage({
                type: 'systemPromptLoaded',
                content: newContent,
              });
            } catch (error) {
              console.error('Errore nel ripristino del system prompt:', error);
              webview.postMessage({
                type: 'error',
                message: 'Impossibile ripristinare il system prompt',
              });
            }
            break;

          case 'sendCoderInstruction':
            const instruction = (msg.payload as unknown)?.instruction as string;
            if (instruction) {
              await this.handleSendCoderInstruction(instruction);
            }
            break;

          case 'getAgentsStatus':
            this.handleGetAgentsStatus();
            break;

          case 'getTaskQueueStatus':
            this.handleGetTaskQueueStatus();
            break;

          case 'abortCoderInstruction':
            this.handleAbortCoderInstruction();
            break;

          case 'toggleAgentActive':
            const agentId = (msg.payload as unknown)?.agentId as string;
            if (agentId) {
              this.handleToggleAgentActive(agentId, (msg.payload as unknown).active as boolean);
            }
            break;

          case WebviewMessageType.GET_BENCHMARK_STATS: {
            const timeframe = message.benchmarkTimeframe || 30;
            vscode.commands.executeCommand('jarvis-ide.benchmarkGetStats', timeframe);
            break;
          }
          case WebviewMessageType.GET_BENCHMARK_TIMELINE: {
            const provider = message.benchmarkProvider;
            const timeframe = message.benchmarkTimeframe || 30;
            vscode.commands.executeCommand('jarvis-ide.benchmarkGetTimeline', provider, timeframe);
            break;
          }
        }
      },
      undefined,
      this.disposables
    );
  }

  async updateTelemetrySetting(telemetrySetting: TelemetrySetting) {
    // Implement telemetry settings update
  }

  async togglePlanActModeWithChatSettings(
    chatSettings: ExtendedChatSettings,
    chatContent?: unknown
  ): Promise<void> {
    console.log(`Toggling plan-act mode: ${chatSettings.separateMode ? 'separate' : 'unified'}`);

    if (chatSettings.separateMode) {
      // Save current mode
      this.previousModeProvider = this.apiConfiguration.provider;
      this.previousModeModelId = this.apiConfiguration.modelId || '';
      this.previousModeModelInfo = this.apiConfiguration.modelInfo || undefined;
      this.previousModeVsCodeLmModelSelector = this.apiConfiguration.vsCodeLmModelSelector;
      this.previousModeThinkingBudgetTokens = chatSettings.thinkingBudgetTokens || 0;

      // Switch to planning mode if specified
      if (chatSettings.planning) {
        this.updateApiConfig({
          provider: chatSettings.planning.provider,
          apiKey: this.apiConfiguration.apiKey || '',
          modelId: chatSettings.planning.modelId,
          vsCodeLmModelSelector: chatSettings.planning.vsCodeLmModelSelector,
          temperature: this.apiConfiguration.temperature,
          maxTokens: this.apiConfiguration.maxTokens,
        });
      }
    } else {
      // Restore previous mode
      if (this.previousModeProvider) {
        this.updateApiConfig({
          provider: this.previousModeProvider,
          apiKey: this.apiConfiguration.apiKey || '',
          modelId: this.previousModeModelId || '',
          modelInfo: this.previousModeModelInfo,
          vsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
          temperature: this.apiConfiguration.temperature,
          maxTokens: this.apiConfiguration.maxTokens,
        });
      }
    }

    // Invia un messaggio alla webview
    this.postMessageToWebview({
      type: 'planActModeChanged',
      payload: {
        apiConfiguration: this.apiConfiguration,
        separateMode: chatSettings.separateMode,
        thinkingBudgetTokens: chatSettings.thinkingBudgetTokens,
        chatContent: chatContent,
      },
    });
  }

  async cancelTask() {
    // Implement task cancellation
  }

  async updateCustomInstructions(/* instructions?: string */) {
    // TODO: Implement logic to update custom instructions
  }

  async updateApiConfiguration(config: ApiConfiguration): Promise<void> {
    // Implementa la logica per aggiornare la configurazione API
    this.apiConfiguration = { ...config };
    // Comunica le modifiche alla WebView
    await this.postStateToWebview();
  }

  async getDocumentsPath(): Promise<string> {
    // Implement documents path retrieval
    return '';
  }

  async ensureMcpServersDirectoryExists(): Promise<string> {
    // Implement MCP servers directory creation
    return '';
  }

  async ensureSettingsDirectoryExists(): Promise<string> {
    // Implement settings directory creation
    return '';
  }

  /**
   * Ottiene il contenuto del system prompt
   * @returns Contenuto del system prompt
   */
  async getSystemPrompt(): Promise<string> {
    if (!this.settingsManager) {
      throw new Error('SettingsManager non inizializzato');
    }

    try {
      return await this.settingsManager.loadSystemPrompt();
    } catch (error) {
      console.error('Errore nel caricamento del system prompt:', error);
      // Ritorna un prompt predefinito in caso di errore
      const defaultPrompt =
        '# System Prompt\n\nSei Jarvis-IDE, un assistente AI per lo sviluppo di software.\n\n' +
        "Aiuta l'utente con le sue richieste relative alla programmazione, debugging e gestione di progetti software.";
      return defaultPrompt;
    }
  }

  /**
   * Salva il contenuto del system prompt
   * @param content Contenuto del system prompt
   */
  async saveSystemPrompt(content: string): Promise<void> {
    if (!this.settingsManager) {
      throw new Error('SettingsManager non inizializzato');
    }

    try {
      await this.settingsManager.saveSystemPrompt(content);
    } catch (error) {
      console.error('Errore nel salvataggio del system prompt:', error);
      throw error;
    }
  }

  /**
   * Ripristina il system prompt predefinito
   */
  async resetSystemPrompt(): Promise<void> {
    const defaultPrompt =
      '# System Prompt\n\nSei Jarvis-IDE, un assistente AI per lo sviluppo di software.\n\n' +
      "Aiuta l'utente con le sue richieste relative alla programmazione, debugging e gestione di progetti software.";

    await this.saveSystemPrompt(defaultPrompt);
  }

  public async readFile(filePath: string): Promise<string> {
    try {
      return (await this.fileManager?.readFile(filePath)) || '';
    } catch (error: unknown) {
      throw new Error(`Errore nella lettura del file ${filePath}: ${error}`);
    }
  }

  public async editFile(filePath: string, newContent: string): Promise<void> {
    try {
      await this.fileManager?.writeFile(filePath, newContent);
    } catch (error: unknown) {
      throw new Error(`Errore nella modifica del file ${filePath}: ${error}`);
    }
  }

  public async createFile(filePath: string, content: string): Promise<void> {
    try {
      await this.fileManager?.createFile(filePath, content);
    } catch (error: unknown) {
      throw new Error(`Errore nella creazione del file ${filePath}: ${error}`);
    }
  }

  public async deleteFile(filePath: string): Promise<void> {
    try {
      await this.fileManager?.deleteFile(filePath);
    } catch (error: unknown) {
      throw new Error(`Errore nell'eliminazione del file ${filePath}: ${error}`);
    }
  }

  public async listFiles(dirPath: string = '.'): Promise<string[]> {
    try {
      return (await this.fileManager?.listFiles(dirPath)) || [];
    } catch (error: unknown) {
      throw new Error(`Errore nel listing dei file dalla directory ${dirPath}: ${error}`);
    }
  }

  public async listFilesRecursive(dirPath: string = '.'): Promise<string[]> {
    try {
      return (await this.fileManager?.listFilesRecursive(dirPath)) || [];
    } catch (error: unknown) {
      throw new Error(`Errore nel listing ricorsivo dei file dalla directory ${dirPath}: ${error}`);
    }
  }

  async handleSettingChange<K extends keyof JarvisSettings>(
    key: K,
    value: JarvisSettings[K]
  ): Promise<void> {
    // Aggiorna l'impostazione specifica
    if (key === 'selectedModel') {
      this.apiConfiguration.modelId = value as string;
    } else if (key in this) {
            this[key] = value;
    }

    // Aggiorna le impostazioni nel servizio
        await this.settingsManager.updateSetting(key, value);

    // Invia un aggiornamento alla webview
    this._view?.webview.postMessage({
      type: 'settingUpdated',
      payload: { key, value },
    });
  }

  async postStateToWebview() {
    if (!this._view?.webview) {
      return;
    }

    const state = {
      apiConfiguration: {
        ...this.apiConfiguration,
        selectedModel: this.apiConfiguration.modelId || '',
      },
      lastShownAnnouncementId: this.lastShownAnnouncementId,
      customInstructions: this.customInstructions,
      taskHistory: this.taskHistory,
      autoApprovalSettings: this.autoApprovalSettings,
      browserSettings: {} as BrowserSettings,
      chatSettings: {} as ChatSettings,
      userInfo: this.userInfo,
      previousModeProvider: this.previousModeProvider,
      previousModeModelId: this.previousModeModelId,
      previousModeModelInfo: this.previousModeModelInfo,
      previousModeVsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
      previousModeThinkingBudgetTokens: this.previousModeThinkingBudgetTokens,
      mcpMarketplaceEnabled: this.mcpMarketplaceEnabled,
      telemetrySetting: this.telemetrySetting,
      planActSeparateModelsSetting: this.planActSeparateModelsSetting,
    };

    this._view.webview.postMessage({
      type: 'stateUpdated',
      payload: state,
    });
  }

  async getStateToPostToWebview(): Promise<JarvisProviderState> {
    return {
      apiConfiguration: this.apiConfiguration,
      lastShownAnnouncementId: this.lastShownAnnouncementId,
      customInstructions: this.customInstructions,
      taskHistory: this.taskHistory,
      autoApprovalSettings: this.autoApprovalSettings,
      browserSettings: {} as BrowserSettings,
      chatSettings: {} as ChatSettings,
      userInfo: this.userInfo,
      previousModeProvider: this.previousModeProvider,
      previousModeModelId: this.previousModeModelId,
      previousModeModelInfo: this.previousModeModelInfo,
      previousModeVsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
      previousModeThinkingBudgetTokens: this.previousModeThinkingBudgetTokens,
      mcpMarketplaceEnabled: this.mcpMarketplaceEnabled,
      telemetrySetting: this.telemetrySetting,
      planActSeparateModelsSetting: this.planActSeparateModelsSetting,
      activeThreadId: this.state.activeThreadId,
      chatThreads: this.state.chatThreads,
      currentModel: this.state.currentModel,
      isInitialized: this.state.isInitialized,
      lastError: this.state.lastError,
      settings: this.state.settings,
    };
  }

  async clearTask(): Promise<void> {
    // Implement task clearing
    this._task = undefined;
    this._images = undefined;

    // Notifica la WebView
    if (this._view?.webview) {
      this._view.webview.postMessage({
        type: 'taskCleared',
      });
    }
  }

  async getState(): Promise<JarvisProviderState> {
    return {
      apiConfiguration: this.apiConfiguration,
      lastShownAnnouncementId: this.lastShownAnnouncementId,
      customInstructions: this.customInstructions,
      taskHistory: this.taskHistory,
      autoApprovalSettings: this.autoApprovalSettings,
      browserSettings: {} as BrowserSettings,
      chatSettings: {} as ChatSettings,
      userInfo: this.userInfo,
      previousModeProvider: this.previousModeProvider,
      previousModeModelId: this.previousModeModelId,
      previousModeModelInfo: this.previousModeModelInfo,
      previousModeVsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
      previousModeThinkingBudgetTokens: this.previousModeThinkingBudgetTokens,
      mcpMarketplaceEnabled: this.mcpMarketplaceEnabled,
      telemetrySetting: this.telemetrySetting,
      planActSeparateModelsSetting: this.planActSeparateModelsSetting,
      activeThreadId: this.state.activeThreadId,
      chatThreads: this.state.chatThreads,
      currentModel: this.state.currentModel,
      isInitialized: this.state.isInitialized,
      lastError: this.state.lastError,
      settings: this.state.settings,
    };
  }

  private async getGlobalState<T>(/* key: GlobalStateKey */): Promise<T | undefined> {
    // @ts-expect-error - L'API globalState usa any
    return this.context.globalState.get(key);
  }

  private async updateGlobalState(key: GlobalStateKey, value: unknown): Promise<void> {
    // @ts-expect-error - L'API globalState usa any
    await this.context.globalState.update(key, value);
  }

  async updateTaskHistory(/* item: HistoryItem */): Promise<HistoryItem[]> {
    // ... placeholder ...
    return this.taskHistory;
  }

  private async getWorkspaceState(/* key: string */): Promise<unknown> {
    // ... placeholder ...
    return undefined;
  }

  private async storeSecret(key: SecretKey, value?: string): Promise<void> {
    if (value === undefined || value === null || value === '') {
      // @ts-expect-error - L'API Secrets permette di eliminare con undefined/null
      await this.context.secrets.delete(key);
    } else {
      // @ts-expect-error - L'API Secrets usa string
      await this.context.secrets.store(key, value);
    }
  }

  async getSecret(key: SecretKey): Promise<string | undefined> {
    // @ts-expect-error - L'API Secrets usa string
    return this.context.secrets.get(key);
  }

  async fetchOpenGraphData(url: string): Promise<any> {
    // Implement Open Graph data fetching
    return {};
  }

  async checkIsImageUrl(url: string): Promise<boolean> {
    // Implement image URL checking
    return false;
  }

  async resetState(): Promise<void> {
    // Implement state reset
  }

  private async getCurrentTaskItem(): Promise<HistoryItem | undefined> {
    // Implement current task item retrieval
    return undefined;
  }

  private async getApiMetrics(): Promise<{ tokensIn: number; tokensOut: number }> {
    // Implement API metrics retrieval
    return { tokensIn: 0, tokensOut: 0 };
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   * @returns Elenco dei modelli configurati
   */
  async getAvailableModels(): Promise<ConfigModelInfo[]> {
    const models: ConfigModelInfo[] = [];

    // Esempio di implementazione base
    models.push({
      id: 'gpt-4',
      name: 'GPT-4',
      contextLength: 8192,
      provider: 'openai',
      maxTokens: 4096,
      supportsImages: true,
      inputPrice: 0.03,
      outputPrice: 0.06,
      description: 'GPT-4 è il modello più potente di OpenAI',
    });

    models.push({
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      contextLength: 4096,
      provider: 'openai',
      maxTokens: 2048,
      supportsImages: true,
      inputPrice: 0.001,
      outputPrice: 0.002,
      description: 'GPT-3.5 Turbo è un modello economico e veloce',
    });

    return models;
  }

  /**
   * Gestisce l'aggiornamento del modello selezionato
   * @param modelId ID del modello selezionato
   */
  private async handleModelUpdate(modelId: string): Promise<void> {
    if (!modelId) return;

    // Aggiorna il modello nelle impostazioni
    await this.handleSettingChange('selectedModel', modelId);

    // Aggiorna la configurazione API se necessario
    const config = { ...this.apiConfiguration };

    // Imposta semplicemente il modelId per tutti i provider
    config.modelId = modelId;

    // Aggiorna la configurazione locale
    this.apiConfiguration = config;

    // Salva la configurazione
    await this.updateApiConfiguration(config);

    this.outputChannel.appendLine(`Modello aggiornato a: ${modelId}`);
  }

  /**
   * Recupera i modelli disponibili da Ollama
   * @param baseUrl URL base di Ollama
   * @returns Lista dei modelli disponibili
   */
  private async getOllamaModels(baseUrl?: string): Promise<string[]> {
    try {
      if (!baseUrl) {
        baseUrl = 'http://localhost:11434';
      }
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Errore nella richiesta a Ollama: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models?.map((model: { name: string }) => model.name) || [];
      // Correggo l'errore con Set
      const uniqueModels: string[] = [];
      for (const model of models) {
        if (!uniqueModels.includes(model)) {
          uniqueModels.push(model);
        }
      }
      return uniqueModels;
    } catch (error) {
      console.error('Errore nel recupero dei modelli Ollama:', error);
      return [];
    }
  }

  /**
   * Recupera i modelli disponibili da LM Studio
   * @param baseUrl URL base di LM Studio
   * @returns Lista dei modelli disponibili
   */
  private async getLmStudioModels(baseUrl?: string): Promise<string[]> {
    try {
      if (!baseUrl) {
        baseUrl = 'http://localhost:1234';
      }
      if (!this.isValidUrl(baseUrl)) {
        return [];
      }

      const response = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Errore nella richiesta a LM Studio: ${response.statusText}`);
      }

      const data = await response.json();
      const modelsArray = data?.data?.map((model: { id: string }) => model.id) || [];
      // Correggo l'errore con Set
      const uniqueModels: string[] = [];
      for (const model of modelsArray) {
        if (!uniqueModels.includes(model)) {
          uniqueModels.push(model);
        }
      }
      return uniqueModels;
    } catch (error) {
      console.error('Errore nel recupero dei modelli LM Studio:', error);
      return [];
    }
  }

  /**
   * Verifica se una stringa è un URL valido
   * @param url URL da verificare
   * @returns true se l'URL è valido
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Initializes the MAS system if not already initialized
   */
  private initMasSystem(): SupervisorAgent | null {
    if (!this.masSystem) {
      const { createMasSystem } = require('../../core/mas');
      this.masSystem = createMasSystem();

      // Listen for events from the MAS system
      this.setupMasEventListeners();
    }

    return this.masSystem;
  }

  /**
   * Sets up event listeners for the MAS system
   */
  private setupMasEventListeners(): void {
    if (!this.masSystem) return;

    // Listen for instruction queued events
    this.masSystem.on('instruction-queued', (data: unknown) => {
      const eventData = data as MASInstructionData;
      this.postMessageToWebview({
        type: 'instructionReceived',
        payload: {
          id: eventData.instruction?.id || uuidv4(),
          agentId: eventData.agentId,
          instruction: eventData.instruction?.objective || eventData.instruction,
        },
      });

      // Update task queue
      this.updateTaskQueue();
    });

    // Listen for instruction completed events
    this.masSystem.on('instruction-completed', (data: unknown) => {
      const eventData = data as MASInstructionData;
      this.postMessageToWebview({
        type: 'instructionCompleted',
        payload: {
          id: eventData.instruction?.id || uuidv4(),
          agentId: eventData.agentId,
          instruction: eventData.instruction?.objective || eventData.instruction,
          result: eventData.result,
        },
      });

      // Update task queue
      this.updateTaskQueue();
    });

    // Listen for instruction failed events
    this.masSystem.on('instruction-failed', (data: unknown) => {
      const eventData = data as MASInstructionData;
      this.postMessageToWebview({
        type: 'instructionFailed',
        payload: {
          id: eventData.instruction?.id || uuidv4(),
          agentId: eventData.agentId,
          instruction: eventData.instruction?.objective || eventData.instruction,
          error: eventData.error?.message || 'Unknown error',
        },
      });

      // Update task queue
      this.updateTaskQueue();
    });
  }

  /**
   * Updates the task queue state and sends it to the WebView
   */
  private updateTaskQueue(): void {
    if (!this.masSystem) return;

    // In a real implementation, we would get this from the MAS system
    // Here we're simulating it for the MVP
    this.taskQueue = this.getTaskQueue();

    this.postMessageToWebview({
      type: 'taskQueueUpdate',
      payload: this.taskQueue,
    } as WebviewMessage);
  }

  /**
   * Gets the current task queue from the MAS system
   * This is a temporary implementation for the MVP
   */
  private getTaskQueue(): TaskQueueState {
    // In a real implementation, this would come from the MAS system
    return this.taskQueue;
  }

  /**
   * Gets the status of all agents in the MAS system
   */
  private getAgentsStatus(): AgentStatus[] {
    if (!this.masSystem) {
      this.initMasSystem();
    }

    return this.masSystem?.getAllAgentsStatus() || [];
  }

  /**
   * Gestisce i messaggi ricevuti dalla WebView
   * @param message Messaggio ricevuto dalla WebView
   */
  protected async handleWebviewMessage(message: unknown): Promise<void> {
    try {
      // Utilizziamo isExtensionMessage come type guard per verificare il tipo di messaggio
      const messageTypes: ExtensionMessageType[] = [
        'log.update',
        'error',
        'info',
        'model.update',
        'settings.update',
        'chat.update',
      ];

      // Verifichiamo se il messaggio è uno dei tipi conosciuti
      const matchingType = messageTypes.find((type) => isExtensionMessage(message, type));

      if (matchingType) {
        // Invochiamo il dispatcher type-safe
        await this.dispatchMessage(message as ExtensionMessage);
      } else {
        console.warn(
          `Tipo di messaggio non supportato: ${(message as { type?: string })?.type || 'unknown'}`
        );
      }
    } catch (error: unknown) {
      console.error('Error handling webview message:', error);
      // Creiamo un messaggio di errore type-safe
      const errorMessage: ExtensionMessage = {
        type: 'error',
        timestamp: Date.now(),
        payload: {
          code: 'MESSAGE_HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? { stack: error.stack } : {},
        },
      };
      this.handleError(errorMessage);
    }
  }

  /**
   * Dispatcher type-safe per i messaggi
   * @param message Messaggio da dispatchare
   */
  private async dispatchMessage(message: ExtensionMessage): Promise<void> {
    // Creiamo un oggetto di handler type-safe usando ExtensionMessageType come chiavi
    const handlers: {
      [K in ExtensionMessageType]: (
        msg: Extract<ExtensionMessage, { type: K }>
      ) => Promise<void> | void;
    } = {
      'log.update': this.handleLogUpdate.bind(this),
      error: this.handleError.bind(this),
      info: this.handleInfo.bind(this),
      'model.update': this.handleModelUpdate.bind(this),
      'settings.update': this.handleSettingsUpdate.bind(this),
      'chat.update': this.handleChatUpdate.bind(this),
    };

    // Invochiamo l'handler corretto in base al tipo
    const handler = handlers[message.type];
    // Impostiamo il tipo corretto usando Extract
    await handler(message as Extract<ExtensionMessage, { type: typeof message.type }>);
  }

  /**
   * Invia un messaggio alla WebView
   * @param message Messaggio da inviare alla WebView
   */
  protected postMessageToWebview(message: ExtensionMessage): void {
    if (!this._view) {
      console.warn('WebView non disponibile, impossibile inviare il messaggio');
      return;
    }

    try {
      this._view.webview.postMessage(message);
    } catch (error) {
      console.error('Errore durante invio messaggio a Webview:', error);
    }
  }

  private initializeMessageHandlers(): void {
    // Non è più necessario in quanto useremo il dispatcher type-safe
    // Questo metodo potrebbe essere rimosso in futuro
  }

  private handleLogUpdate(message: Extract<ExtensionMessage, { type: 'log.update' }>): void {
    const { level, message: logMessage, context } = (msg.payload as unknown);
    console.log(`[${level}] ${logMessage}`, context);
  }

  private handleChatUpdate(message: Extract<ExtensionMessage, { type: 'chat.update' }>): void {
    const { threadId, messages, status } = (msg.payload as unknown);

    if (status === 'error') {
      console.error(`Errore nella chat ${threadId}:`, (msg.payload as unknown).error);
      return;
    }

    this.state.chatThreads.set(threadId, messages);
  }

  private handleModelUpdate(message: Extract<ExtensionMessage, { type: 'model.update' }>): void {
    const { modelId, modelInfo, status } = (msg.payload as unknown);

    // Aggiorniamo il modello corrente
    this.state.currentModel = modelInfo;

    // Segniamo lo stato come inizializzato dopo il primo aggiornamento di modello
    if (!this.state.isInitialized) {
      this.state.isInitialized = true;
    }

    // Aggiorniamo lo stato e lo inviamo alla WebView
    this.postStateToWebview();
  }

  private handleSettingsUpdate(
    message: Extract<ExtensionMessage, { type: 'settings.update' }>
  ): void {
    this.state.settings = {
      ...this.state.settings,
      ...(msg.payload as unknown).settings,
    };
  }

  private handleError(message: Extract<ExtensionMessage, { type: 'error' }>): void {
    const { code, message: errorMessage, details } = (msg.payload as unknown);
    console.error(`[${code}] ${errorMessage}`, details);

    // Salviamo l'ultimo errore nello stato
    this.state.lastError = new Error(errorMessage);

    // Opzionalmente, mostriamo un messaggio di errore all'utente
    vscode.window.showErrorMessage(errorMessage);
  }

  private handleInfo(message: Extract<ExtensionMessage, { type: 'info' }>): void {
    const { message: infoMessage, severity = 'info' } = (msg.payload as unknown);
    console.log(`[${severity}] ${infoMessage}`);

    // Opzionalmente, mostriamo un messaggio informativo all'utente in base alla severità
    if (severity === 'warning') {
      vscode.window.showWarningMessage(infoMessage);
    } else if (severity === 'error') {
      vscode.window.showErrorMessage(infoMessage);
    } else {
      vscode.window.showInformationMessage(infoMessage);
    }
  }

  private async handleSendCoderInstruction(instruction: string): Promise<void> {
    if (!instruction || typeof instruction !== 'string') {
      console.error('Istruzione non valida ricevuta');
      return;
    }

    try {
      // Initialize MAS if not already done
      this.initMasSystem();

      // Log the instruction
      this.outputChannel.appendLine(`Sending instruction: ${instruction}`);

      // Send the instruction to the supervisor agent
      const result = await this.masSystem?.sendInstruction(instruction);

      // Update UI with result
      this.postMessageToWebview({
        type: 'instructionSent',
        payload: {
          instruction,
          success: true,
          taskId: result?.id || uuidv4(),
        },
      });
    } catch (error: unknown) {
      // Handle error
      this.outputChannel.appendLine(
        `Error sending instruction: ${error instanceof Error ? error.message : String(error)}`
      );
      this.postMessageToWebview({
        type: 'instructionSent',
        payload: {
          instruction,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });
    }
  }

  private handleGetAgentsStatus(): void {
    const agentsStatus = this.getAgentsStatus();
    this.postMessageToWebview({
      type: 'agentsStatus',
      payload: agentsStatus,
    });
  }

  private handleGetTaskQueueStatus(): void {
    this.updateTaskQueue();
  }

  private handleAbortCoderInstruction(): void {
    // Implement abort logic
    if (this.masSystem) {
      this.masSystem.abortAllInstructions();

      // Update UI
      this.postMessageToWebview({
        type: 'instructionAborted',
        payload: {
          success: true,
        },
      });
    }
  }

  private handleToggleAgentActive(agentId: string, active: boolean): void {
    if (!this.masSystem || !agentId) return;

    try {
      // Toggle agent active state
      if (active) {
        this.masSystem.activateAgent(agentId);
      } else {
        this.masSystem.deactivateAgent(agentId);
      }

      // Update agents status
      const agentsStatus = this.getAgentsStatus();
      this.postMessageToWebview({
        type: 'agentsStatus',
        payload: agentsStatus,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.postMessageToWebview({
        type: 'error',
        payload: {
          code: 'AGENT_TOGGLE_ERROR',
          message: `Failed to ${active ? 'activate' : 'deactivate'} agent: ${errorMessage}`,
        },
      });
    }
  }
}

// Funzioni helper
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getTheme() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast
    ? 'dark'
    : 'light';
}

// Aggiungo le classi placeholder alla fine del file
class WorkspaceTracker {
  constructor(private provider: JarvisProvider) {
    this.initialize();
  }

  private initialize(): void {
    // Inizializzazione del tracker
  }

  public async trackFileChange(filePath: string): Promise<void> {
    await this.provider.postMessageToWebview({
      type: 'file.change',
      payload: { filePath },
    });
  }
}

class JarvisAccountService {
  constructor(private provider: JarvisProvider) {
    this.initialize();
  }

  private initialize(): void {
    // Inizializzazione del servizio account
  }

  async signOut(): Promise<void> {
    await this.provider.postMessageToWebview({
      type: 'account.signOut',
      payload: { success: true },
    });
  }
}

class FileManager {
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: unknown) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: unknown) {
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async createFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: unknown) {
      throw new Error(`Failed to create file: ${filePath}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      throw new Error(`Failed to delete file: ${filePath}`);
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error: unknown) {
      throw new Error(`Failed to list files in directory: ${dirPath}`);
    }
  }

  async listFilesRecursive(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      const results: string[] = [];

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          const subFiles = await this.listFilesRecursive(fullPath);
          results.push(...subFiles.map((f) => path.join(file, f)));
        } else {
          results.push(file);
        }
      }

      return results;
    } catch (error: unknown) {
      throw new Error(`Failed to list files recursively in directory: ${dirPath}`);
    }
  }
}

class AIFileManager {
  constructor(
    private fileManager: FileManager,
    private modelInfo?: ModelInfo,
    private provider?: string
  ) {}

  setModel(modelInfo: ModelInfo, provider: string): void {
    this.modelInfo = modelInfo;
    this.provider = provider;
  }
}

class TelemetryService {
  private events: Map<string, Array<{ timestamp: Date; properties: Record<string, unknown> }>> =
    new Map();

  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    const event = {
      timestamp: new Date(),
      properties: properties || {},
    };

    const events = this.events.get(eventName) || [];
    events.push(event);
    this.events.set(eventName, events);
  }

  getEvents(eventName: string): Array<{ timestamp: Date; properties: Record<string, unknown> }> {
    return this.events.get(eventName) || [];
  }
}

// Aggiungo una funzione placeholder per getUri
function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]): vscode.Uri {
  // Utilizziamo path.join invece di Uri.joinPath che non esiste
  const joinedPath = path.join(...pathList);
  return vscode.Uri.file(path.join(extensionUri.fsPath, joinedPath));
}
