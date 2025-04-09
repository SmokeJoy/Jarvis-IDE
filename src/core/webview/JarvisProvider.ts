import * as vscode from "vscode"
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { promises as fs } from "fs";

// Importazioni di type necessarie raggruppate
import type { OpenAiCompatibleModelInfo } from "../../shared/types/api.types.js"
import type { LLMProviderId, ApiConfiguration } from "../../shared/types/api.types.js"
import type { WebviewMessage } from "../../shared/types/webview.types.js"
import type { OutgoingWebviewMessage } from "../../shared/types/webview.types.js"
import type { ExtensionState, ExtensionMessage } from "../../shared/ExtensionMessage.js"
import type { AutoApprovalSettings, ChatSettings, BrowserSettings } from "../../shared/types/user-settings.types.js"
import type { AgentStatus, TaskQueueState, TaskStatus } from "../../shared/types/mas.types.js"
import type { 
  IJarvisProvider, 
  ExtendedChatSettings, 
  JarvisSettings, 
  SupervisorAgent, 
  ConfigModelInfo, 
  HistoryItem,
  TelemetrySetting
} from "../../shared/types/provider.types.js"
import type { ExportableSession } from "../../utils/exporters/types.js";

// Importazioni concrete
import { SettingsManager } from "../../services/settings/SettingsManager.js"
import { McpHub } from "../../services/mcp/McpHub.js"
import { McpDispatcher } from "../../services/mcp/McpDispatcher.js"

// Definizioni locali
type GlobalStateKey = string;
type SecretKey = string;

// Definizione dell'enum per i tipi di messaggi WebView
enum WebviewMessageType {
  GET_BENCHMARK_STATS = "getBenchmarkStats",
  GET_BENCHMARK_TIMELINE = "getBenchmarkTimeline"
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
  };
}

// Interfaccia per i task nella coda
interface Task {
  id: string;
  agentId: string;
  instruction: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class JarvisProvider implements IJarvisProvider {
	public static readonly sideBarId = "jarvis-ide.SidebarProvider"
	public static readonly tabPanelId = "jarvis-ide.TabPanelProvider"
	private static activeInstances: Set<JarvisProvider> = new Set()
	private disposables: vscode.Disposable[] = []
	private _view?: vscode.WebviewPanel
	private jarvis?: { dispose(): void }
	workspaceTracker?: WorkspaceTracker
	mcpHub?: McpHub
	accountService?: JarvisAccountService
	private latestAnnouncementId = "march-22-2025"
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
			search: undefined
		}
	};
	private apiConfiguration: ApiConfiguration = {
		provider: "openai" as LLMProviderId,
		apiKey: "",
		modelId: "gpt-4",
		temperature: 0.7,
		maxTokens: 4000,
	};
	private mcpDispatcher: McpDispatcher;
	private _extensionUri: vscode.Uri;
	private _state: ExtensionState;

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
				useMcp: false
			},
			maxRequests: 0,
			enableNotifications: true,
			tools: [],
			maxAutoApprovals: 3,
			allowReadOnly: false,
			allowReadWrite: false,
			allowTerminalCommands: false
		},
		private customInstructions: string = "",
		private _task?: string,
		private _images?: string[],
		private _historyItem?: HistoryItem,
		private telemetryService?: TelemetryService,
		extensionUri: vscode.Uri,
		initialState: ExtensionState
	) {
		this.settings = settings;
		this.outputChannel.appendLine("JarvisProvider instantiated")
		JarvisProvider.activeInstances.add(this)
		this.workspaceTracker = new WorkspaceTracker(this)
		
		// Inizializza McpHub
		this.mcpHub = new McpHub();
		this.accountService = new JarvisAccountService(this)

		// Inizializza McpDispatcher
		this.mcpDispatcher = new McpDispatcher(
			(msg: OutgoingWebviewMessage) => this.postMessageToWebview(msg)
		);

		this.disposables.push(
			vscode.window.onDidChangeActiveTextEditor(() => {
				this.postStateToWebview()
			}),
		)

		// Inizializza il SettingsManager
		this.settingsManager = SettingsManager.getInstance(this.context);
		
		// Inizializza i manager
		this.fileManager = new FileManager();
		this.aiFileManager = new AIFileManager(this.fileManager);

		// Carica le impostazioni all'avvio
		this.initializeSettings().catch(error => {
			console.error("Errore nell'inizializzazione delle impostazioni:", error);
		});

		this.initializeJarvis();

		this._extensionUri = extensionUri;
		this._state = initialState;
	}

	private async initializeSettings(): Promise<void> {
		if (!this.settingsManager) {
			throw new Error("SettingsManager non inizializzato");
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
		
		this.outputChannel.appendLine("Impostazioni caricate con successo");
	}

	private async initializeJarvis() {
		// Implementa la logica per inizializzare Jarvis con la configurazione corretta
		// Questo dipende dall'implementazione della classe Jarvis
		
		// Esempio (da implementare in base alle necessità effettive):
		// this.jarvis = new Jarvis(/* parametri necessari */);
	}

	async dispose() {
		JarvisProvider.activeInstances.delete(this)
		this._view = undefined

		if (this.jarvis) {
			this.jarvis.dispose()
		}

		// Release workspace resources
		for (const disposable of this.disposables) {
			disposable.dispose()
		}
		this.disposables = []
	}

	async handleSignOut() {
		if (this.accountService) {
			await this.accountService.signOut()
		}
		// Reset user state
		await this.setUserInfo(undefined)
		// Update UI
		await this.postStateToWebview()
	}

	async setUserInfo(info?: { displayName: string | null; email: string | null; photoURL: string | null }) {
		this.userInfo = info
		await this.updateGlobalState("userInfo", info)
	}

	public static getVisibleInstance(): JarvisProvider | undefined {
		return Array.from(JarvisProvider.activeInstances).find((instance) => instance._view?.visible)
	}

	async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		this._view = webviewView as vscode.WebviewPanel
		// Initialize the webview settings
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		}

		// Set the HTML content
		let htmlContent = ""
		if (process.env.NODE_ENV === "development" && process.env.WEBVIEW_URL) {
			htmlContent = await this.getHMRHtmlContent(webviewView.webview)
		} else {
			htmlContent = this.getHtmlContent(webviewView.webview)
		}
		webviewView.webview.html = htmlContent

		// Setup event listeners
		this.setWebviewMessageListener(webviewView.webview)

		// Initialize task based on constructor parameters
		if (this._task || this._images) {
			await this.initJarvisWithTask(this._task, this._images)
		} else if (this._historyItem) {
			await this.initJarvisWithHistoryItem(this._historyItem)
		}

		// Send the initial state to the webview
		await this.postStateToWebview()
		
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
					multi_agent: this.multi_agent
				}
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
				source: 'extension'
			};

			// Invia il messaggio
			this._view.webview.postMessage(messageWithSource);
		} catch (error) {
			console.error("Errore nell'invio del messaggio alla WebView:", error);
		}
	}

	private getHtmlContent(webview: vscode.Webview): string {
		// Generate HTML for the webview
		const scriptUri = getUri(webview, this._extensionUri, [
			"out",
			"webview",
			"main.js",
		])
		const styleUri = getUri(webview, this._extensionUri, [
			"out",
			"webview",
			"main.css",
		])
		const codiconsUri = getUri(webview, this._extensionUri, [
			"node_modules",
			"@vscode/codicons",
			"dist",
			"codicon.css",
		])
		const nonce = getNonce()

		// Get VSCode theme
		const theme = getTheme()

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
            window.isDarkTheme = ${theme === "dark"};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `
	}

	private async getHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		// Generate HTML for development with Hot Module Replacement
		const scriptUri = process.env.WEBVIEW_URL
		const nonce = getNonce()

		// Get VSCode theme
		const theme = getTheme()

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
            window.isDarkTheme = ${theme === "dark"};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}/@vite/client"></script>
          <script type="module" nonce="${nonce}" src="${scriptUri}/src/main.tsx"></script>
        </body>
      </html>
    `
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
							throw new Error("SettingsManager non inizializzato");
						}
						
						// Invia le impostazioni correnti alla WebView
						webview.postMessage({
							type: 'settingsLoaded',
							settings: {
								use_docs: this.use_docs,
								coder_mode: this.coder_mode,
								contextPrompt: this.contextPrompt,
								selectedModel: this.apiConfiguration.modelId || "",
								multi_agent: this.multi_agent,
								availableModels: await this.getAvailableModels()
							}
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
								filePath: systemPromptPath
							});
						} catch (error) {
							console.error('Errore nel caricamento del system prompt:', error);
							webview.postMessage({
								type: 'error',
								message: 'Impossibile caricare il system prompt'
							});
						}
						break;
						
					case 'saveSystemPrompt':
						if (typeof message.content === 'string') {
							try {
								await this.saveSystemPrompt(message.content);
								webview.postMessage({
									type: 'systemPromptSaved'
								});
							} catch (error) {
								console.error('Errore nel salvataggio del system prompt:', error);
								webview.postMessage({
									type: 'error',
									message: 'Impossibile salvare il system prompt'
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
										selectedModel: this.apiConfiguration.modelId || "",
										multi_agent: this.multi_agent,
										availableModels: await this.getAvailableModels()
									}
								});
							} catch (error) {
								console.error('Errore nel salvataggio delle impostazioni:', error);
								webview.postMessage({
									type: 'error',
									message: 'Impossibile salvare le impostazioni'
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
										selectedModel: this.apiConfiguration.modelId || "",
										multi_agent: this.multi_agent,
										availableModels: await this.getAvailableModels()
									}
								});
							}
						} catch (error) {
							console.error('Errore nel ripristino delle impostazioni predefinite:', error);
							webview.postMessage({
								type: 'error',
								message: 'Impossibile ripristinare le impostazioni predefinite'
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
							console.error('Errore nell\'apertura del file system prompt:', error);
							webview.postMessage({
								type: 'error',
								message: 'Impossibile aprire il file system prompt'
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
							console.error('Errore nell\'apertura della cartella dei log:', error);
							webview.postMessage({
								type: 'error',
								message: 'Impossibile aprire la cartella dei log'
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
									value: message.value
								});
							} catch (error) {
								console.error('Errore nell\'aggiornamento del modello:', error);
								webview.postMessage({
									type: 'error',
									message: 'Impossibile aggiornare il modello selezionato'
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
								content: newContent
							});
						} catch (error) {
							console.error('Errore nel ripristino del system prompt:', error);
							webview.postMessage({
								type: 'error',
								message: 'Impossibile ripristinare il system prompt'
							});
						}
						break;

					case 'sendCoderInstruction':
						const instruction = message.payload?.instruction as string;
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
						const agentId = message.payload?.agentId as string;
						if (agentId) {
							this.handleToggleAgentActive(agentId, message.payload.active);
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
		)
	}

	async updateTelemetrySetting(telemetrySetting: TelemetrySetting) {
		// Implement telemetry settings update
	}

	async togglePlanActModeWithChatSettings(chatSettings: ExtendedChatSettings, chatContent?: unknown): Promise<void> {
		console.log(`Toggling plan-act mode: ${chatSettings.separateMode ? 'separate' : 'unified'}`);
		
		if (chatSettings.separateMode) {
			// Save current mode
			this.previousModeProvider = this.apiConfiguration.provider;
			this.previousModeModelId = this.apiConfiguration.modelId || "";
			this.previousModeModelInfo = this.apiConfiguration.modelInfo || undefined;
			this.previousModeVsCodeLmModelSelector = this.apiConfiguration.vsCodeLmModelSelector;
			this.previousModeThinkingBudgetTokens = chatSettings.thinkingBudgetTokens || 0;
			
			// Switch to planning mode if specified
			if (chatSettings.planning) {
				this.updateApiConfig({
					provider: chatSettings.planning.provider,
					apiKey: this.apiConfiguration.apiKey || "",
					modelId: chatSettings.planning.modelId,
					vsCodeLmModelSelector: chatSettings.planning.vsCodeLmModelSelector,
					temperature: this.apiConfiguration.temperature,
					maxTokens: this.apiConfiguration.maxTokens
				});
			}
		} else {
			// Restore previous mode
			if (this.previousModeProvider) {
				this.updateApiConfig({
					provider: this.previousModeProvider,
					apiKey: this.apiConfiguration.apiKey || "",
					modelId: this.previousModeModelId || "",
					modelInfo: this.previousModeModelInfo,
					vsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
					temperature: this.apiConfiguration.temperature,
					maxTokens: this.apiConfiguration.maxTokens
				});
			}
		}
		
		// Invia un messaggio alla webview
		this.postMessageToWebview({
			type: "planActModeChanged",
			payload: {
				apiConfiguration: this.apiConfiguration,
				separateMode: chatSettings.separateMode,
				thinkingBudgetTokens: chatSettings.thinkingBudgetTokens,
				chatContent: chatContent
			}
		});
	}

	async cancelTask() {
		// Implement task cancellation
	}

	async updateCustomInstructions(/* instructions?: string */) {
		// TODO: Implement logic to update custom instructions
	}

	async updateApiConfiguration(/* apiConfiguration: ApiConfiguration */) {
		// TODO: Implement logic to update API configuration
	}

	async getDocumentsPath(): Promise<string> {
		// Implement documents path retrieval
		return "";
	}

	async ensureMcpServersDirectoryExists(): Promise<string> {
		// Implement MCP servers directory creation
		return "";
	}

	async ensureSettingsDirectoryExists(): Promise<string> {
		// Implement settings directory creation
		return "";
	}

	/**
	 * Ottiene il contenuto del system prompt
	 * @returns Contenuto del system prompt
	 */
	async getSystemPrompt(): Promise<string> {
		if (!this.settingsManager) {
			throw new Error("SettingsManager non inizializzato");
		}
		
		try {
			return await this.settingsManager.loadSystemPrompt();
		} catch (error) {
			console.error('Errore nel caricamento del system prompt:', error);
			// Ritorna un prompt predefinito in caso di errore
			const defaultPrompt = '# System Prompt\n\nSei Jarvis-IDE, un assistente AI per lo sviluppo di software.\n\n' +
				'Aiuta l\'utente con le sue richieste relative alla programmazione, debugging e gestione di progetti software.';
			return defaultPrompt;
		}
	}

	/**
	 * Salva il contenuto del system prompt
	 * @param content Contenuto del system prompt
	 */
	async saveSystemPrompt(content: string): Promise<void> {
		if (!this.settingsManager) {
			throw new Error("SettingsManager non inizializzato");
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
		const defaultPrompt = '# System Prompt\n\nSei Jarvis-IDE, un assistente AI per lo sviluppo di software.\n\n' +
			'Aiuta l\'utente con le sue richieste relative alla programmazione, debugging e gestione di progetti software.';
		
		await this.saveSystemPrompt(defaultPrompt);
	}

	public async readFile(filePath: string): Promise<string> {
		try {
			return await this.fileManager?.readFile(filePath) || '';
		} catch (error) {
			throw new Error(`Errore nella lettura del file ${filePath}: ${error}`);
		}
	}

	public async editFile(filePath: string, newContent: string): Promise<void> {
		try {
			await this.fileManager?.writeFile(filePath, newContent);
		} catch (error) {
			throw new Error(`Errore nella modifica del file ${filePath}: ${error}`);
		}
	}

	public async createFile(filePath: string, content: string): Promise<void> {
		try {
			await this.fileManager?.createFile(filePath, content);
		} catch (error) {
			throw new Error(`Errore nella creazione del file ${filePath}: ${error}`);
		}
	}

	public async deleteFile(filePath: string): Promise<void> {
		try {
			await this.fileManager?.deleteFile(filePath);
		} catch (error) {
			throw new Error(`Errore nell'eliminazione del file ${filePath}: ${error}`);
		}
	}

	public async listFiles(dirPath: string = '.'): Promise<string[]> {
		try {
			return await this.fileManager?.listFiles(dirPath) || [];
		} catch (error) {
			throw new Error(`Errore nel listing dei file dalla directory ${dirPath}: ${error}`);
		}
	}

	public async listFilesRecursive(dirPath: string = '.'): Promise<string[]> {
		try {
			return await this.fileManager?.listFilesRecursive(dirPath) || [];
		} catch (error) {
			throw new Error(`Errore nel listing ricorsivo dei file dalla directory ${dirPath}: ${error}`);
		}
	}

	async handleSettingChange(key: string, value: any): Promise<void> {
		// Aggiorna l'impostazione specifica
		if (key === "selectedModel") {
			this.apiConfiguration.modelId = value;
		} else if (key in this) {
			// @ts-ignore - Uso any per aggirare la verifica delle chiavi
			this[key] = value;
		}
		
		// Aggiorna le impostazioni nel servizio
		// @ts-ignore - Uso any per aggirare la verifica delle chiavi
		await this.settingsManager.updateSetting(key, value);
		
		// Invia un aggiornamento alla webview
		this._view?.webview.postMessage({
			type: "settingUpdated",
			payload: { key, value }
		});
	}

	async postStateToWebview() {
		if (!this._view?.webview) {
			return;
		}

		const state = {
			apiConfiguration: {
				...this.apiConfiguration,
				selectedModel: this.apiConfiguration.modelId || "",
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
			planActSeparateModelsSetting: this.planActSeparateModelsSetting
		};

		this._view.webview.postMessage({
			type: 'stateUpdated',
			payload: state
		});
	}

	async getStateToPostToWebview(): Promise<ExtensionState> {
		// Implement state retrieval for webview
		return {} as ExtensionState;
	}

	async clearTask() {
		// Implement task clearing
	}

	async getState(): Promise<{
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
	}> {
		// Implement state retrieval
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
			planActSeparateModelsSetting: this.planActSeparateModelsSetting
		};
	}

	private async getGlobalState<T>(/* key: GlobalStateKey */): Promise<T | undefined> {
		// @ts-expect-error - L'API globalState usa any
		return this.context.globalState.get(key);
	}

	private async updateGlobalState(key: GlobalStateKey, value: unknown): Promise<void> {
		// @ts-expect-error - L'API globalState usa any
		await this.context.globalState.update(key, value)
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
		if (value === undefined || value === null || value === "") {
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
			id: "gpt-4",
			name: "GPT-4",
			contextLength: 8192,
			provider: "openai",
			maxTokens: 4096,
			supportsImages: true,
			inputPrice: 0.03,
			outputPrice: 0.06,
			description: "GPT-4 è il modello più potente di OpenAI"
		});
		
		models.push({
			id: "gpt-3.5-turbo",
			name: "GPT-3.5 Turbo",
			contextLength: 4096,
			provider: "openai",
			maxTokens: 2048,
			supportsImages: true,
			inputPrice: 0.001,
			outputPrice: 0.002,
			description: "GPT-3.5 Turbo è un modello economico e veloce"
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
				baseUrl = "http://localhost:11434";
			}
			const response = await fetch(`${baseUrl}/api/tags`, {
				method: 'GET',
			});
			
			if (!response.ok) {
				throw new Error(`Errore nella richiesta a Ollama: ${response.statusText}`);
			}
			
			const data = await response.json();
			const models = data.models?.map((model: any) => model.name) || [];
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
				baseUrl = "http://localhost:1234";
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
			const modelsArray = data?.data?.map((model: any) => model.id) || [];
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
					instruction: eventData.instruction?.objective || eventData.instruction
				}
			});
			
			// Update task queue
			this.updateTaskQueue();
		});
		
		// Listen for instruction completed events
		this.masSystem.on('instruction-completed', (data: unknown) => {
			const eventData = data as MASInstructionData;
			this.postMessageToWebview({
				type: "instructionCompleted",
				payload: {
					id: eventData.instruction?.id || uuidv4(),
					agentId: eventData.agentId,
					instruction: eventData.instruction?.objective || eventData.instruction,
					result: eventData.result
				}
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
					error: eventData.error?.message || 'Unknown error'
				}
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
			payload: this.taskQueue
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
	protected async handleWebviewMessage(message: any): Promise<void> {
		// Validazione del messaggio
		if (!message || typeof message !== 'object' || !message.type) {
			console.error("Messaggio WebView non valido:", message);
			return;
		}

		try {
			// Utilizzo any per evitare errori di tipizzazione durante la migrazione
			const msg = message as any;
			
			// Switch basato sul tipo di messaggio
			switch (msg.type) {
				case "llm.query":
					// Supporto per le chiamate tool da LLM
					if (msg.payload?.tool_call) {
						// Verifica autorizzazione MCP
						if (this.autoApprovalSettings.enabled && 
							this.autoApprovalSettings.actions.useMcp) {
							this.outputChannel.appendLine(`Invocazione tool MCP: ${msg.payload.tool_call.tool}`);
							
							// Passa la chiamata al dispatcher MCP
							await this.mcpDispatcher.handleToolCall(msg.payload.tool_call);
						} else {
							// L'accesso MCP non è autorizzato
							this.postMessageToWebview({
								type: "llm.error",
								payload: { 
									error: "L'accesso a strumenti MCP non è autorizzato nelle impostazioni" 
								}
							});
						}
						return;
					}
					
					// Gestione normale delle query LLM...
					break;

				case "updateSetting":
					if (msg.key && msg.value !== undefined) {
						await this.handleSettingChange(msg.key, msg.value);
					}
					break;
				case "getSettings":
					this.postStateToWebview();
					break;
				case "getSystemPrompt":
					try {
						const content = await this.getSystemPrompt();
						this.postMessageToWebview({
							type: "response",
							payload: { content }
						});
					} catch (error) {
						console.error("Errore nel recupero del prompt di sistema:", error);
						this.postMessageToWebview({
							type: "error",
							error: "Errore nel recupero del prompt di sistema"
						});
					}
					break;
				case "saveSystemPrompt":
					if (msg.content) {
						try {
							await this.saveSystemPrompt(msg.content);
							this.postMessageToWebview({
								type: "response",
								payload: { success: true }
							});
						} catch (error) {
							console.error("Errore nel salvataggio del prompt di sistema:", error);
							this.postMessageToWebview({
								type: "error",
								error: "Errore nel salvataggio del prompt di sistema"
							});
						}
					}
					break;
				default:
					console.warn(`Tipo di messaggio WebView non supportato: ${msg.type}`);
					break;
			}
		} catch (error) {
			console.error("Errore nella gestione del messaggio WebView:", error);
		}
	}
	
	/**
	 * Handles sending an instruction to the CoderAgent
	 */
	private async handleSendCoderInstruction(instruction: string): Promise<void> {
		try {
			const masSystem = this.masSystem;
			if (!masSystem) {
				return;
			}

			// Invia l'istruzione al sistema MAS
			await masSystem.queueInstruction('coder-agent', instruction);

			// Notifica la WebView che l'istruzione è stata ricevuta
			this.postMessageToWebview({
				type: "instructionCompleted",
				payload: {
					id: uuidv4(),
					agentId: 'coder-agent',
					instruction,
					result: null
				}
			} as WebviewMessage);

		} catch (error) {
			// In caso di errore, notifica la WebView
			this.postMessageToWebview({
				type: 'instructionFailed',
				payload: {
					id: uuidv4(),
					agentId: 'coder-agent',
					instruction,
					error: String(error)
				}
			} as WebviewMessage);
		}
	}
	
	/**
	 * Handles getting the status of all agents
	 */
	private handleGetAgentsStatus(): void {
		if (!this.masSystem) {
			return;
		}

		const agentsStatus = this.masSystem.getAllAgentsStatus();
		
		this.postMessageToWebview({
			type: 'agentsStatusUpdate',
			payload: agentsStatus
		} as WebviewMessage);
	}
	
	/**
	 * Handles getting the current task queue status
	 */
	private handleGetTaskQueueStatus(): void {
		if (!this.masSystem) {
			return;
		}

		const taskQueue = this.getTaskQueue();
		
		this.postMessageToWebview({
			type: 'taskQueueUpdate',
			payload: taskQueue
		} as WebviewMessage);
	}
	
	/**
	 * Handles aborting the current CoderAgent instruction
	 */
	private handleAbortCoderInstruction(): void {
		if (!this.masSystem) {
			return;
		}

		// Aggiungi il task attivo ai task abortiti se esiste
		if (this.taskQueue.active) {
			const abortedTask = { ...this.taskQueue.active, status: 'aborted' as TaskStatus };
			this.taskQueue.aborted.push(abortedTask);
			this.taskQueue.active = null; // Usa null invece di undefined
			
			// Notifica la WebView
			this.postMessageToWebview({
				type: 'taskQueueUpdate',
				payload: this.taskQueue
			});
		}
	}
	
	/**
	 * Handles activating or deactivating an agent
	 */
	private handleToggleAgentActive(agentId: string, active: boolean): void {
		try {
			const masSystem = this.masSystem;
			if (!masSystem) return;
			
			// Send a message to activate/deactivate the agent
			masSystem.sendMessage({
				id: uuidv4(),
				from: 'webview',
				to: agentId,
				type: 'notification',
				payload: active ? 'activate' : 'deactivate',
				timestamp: new Date(),
				replyTo: undefined
			});
			
			// Update the agent status
			setTimeout(() => {
				this.handleGetAgentsStatus();
			}, 500);
		} catch (error) {
			console.error(`Error toggling agent ${agentId} active state:`, error);
		}
	}

	// Metodo per impostare la configurazione del modello in base al provider
	private async setModelConfiguration(modelId: string): Promise<void> {
		// Utilizziamo i tipi corretti di ApiConfiguration
		const providerType = this.apiConfiguration.provider;
		
		// Aggiorniamo l'ID del modello
		this.apiConfiguration.modelId = modelId;
		
		// Configurazione specifica in base al provider
		switch (providerType) {
			case 'openrouter':
				// Per OpenRouter, non possiamo modificare direttamente le proprietà specifiche
				// ma dobbiamo aggiornare la configurazione dell'API
				this.apiConfiguration.modelId = modelId;
				break;
				
			case 'openai':
				// Per OpenAI, aggiorniamo l'ID del modello
				this.apiConfiguration.modelId = modelId;
				break;
				
			case 'anthropic':
				// Per Anthropic, aggiorniamo l'ID del modello
				this.apiConfiguration.modelId = modelId;
				break;
				
			// Altri provider...
		}
		
		// Aggiornamenti alla WebView
		if (this._view) {
			this.postMessageToWebview({
				type: 'api.configuration',
				apiConfiguration: this.apiConfiguration
			});
		}
	}

	switchToProvider(provider: string, modelId?: string) {
		console.log(`Switching provider from ${this.apiConfiguration.provider} to ${provider}, model ID: ${this.apiConfiguration.modelId} to ${modelId || 'default'}`);
		
		// Salva la configurazione attuale
		const previousProvider = this.apiConfiguration.provider
		const previousModelId = this.apiConfiguration.modelId
		
		// Aggiorna il provider
		this.apiConfiguration.provider = provider
		
		// Se è fornito un ID modello, aggiornalo
		if (modelId) {
			this.apiConfiguration.modelId = modelId
			
			// Configurazioni specifiche per alcuni provider
			if (provider === 'google') {
				// Invece di usare 'googleModelId' che non esiste, aggiorniamo direttamente modelId
				this.apiConfiguration.modelId = modelId;
			} else if (provider === 'mistral') {
				// Invece di usare 'mistralModelId' che non esiste, aggiorniamo direttamente modelId
				this.apiConfiguration.modelId = modelId;
			}
		} else {
			// Se non viene specificato un modello, imposta un modello predefinito in base al provider
			switch (provider) {
				case 'openai':
					this.apiConfiguration.modelId = 'gpt-4'
					break
				case 'anthropic':
					this.apiConfiguration.modelId = 'claude-3-opus-20240229'
					break
				case 'mistral':
					this.apiConfiguration.modelId = 'mistral-large-latest'
					break
				case 'google':
					this.apiConfiguration.modelId = 'gemini-pro'
					break
				case 'ollama':
					// Usa il primo modello disponibile o un predefinito
					this.apiConfiguration.modelId = this.cachedOllamaModels?.[0] || 'llama2';
					break
				case 'lmstudio':
					// Usa il primo modello disponibile o un predefinito
					this.apiConfiguration.modelId = this.cachedLmStudioModels?.[0] || 'local-model';
					break
				default:
					// Mantiene l'ID modello corrente
					break;
			}
		}
		
		console.log(`Switched provider from ${previousProvider} to ${this.apiConfiguration.provider}, model ID: ${previousModelId} to ${this.apiConfiguration.modelId}`);
		
		// Invia la configurazione aggiornata al webview
		const message: WebviewMessage = {
			type: "api.configuration",
			payload: {
				apiConfiguration: this.apiConfiguration
			}
		};
		this.postMessageToWebview(message);
	}

	// Metodo per aggiornare la configurazione API
	private updateApiConfig(apiConfig?: ApiConfiguration): void {
		if (!apiConfig) {
			return;
		}
		
		// Aggiorna la configurazione locale
		this.apiConfiguration = {
			...this.apiConfiguration,
			...apiConfig,
		};
		
		// Assicurati che il provider sia una stringa
		if (typeof this.apiConfiguration.provider !== 'string') {
			this.apiConfiguration.provider = 'openai';
		}
		
		// Assicurati che il modelId sia definito
		if (!this.apiConfiguration.modelId) {
			this.apiConfiguration.modelId = 'gpt-4';
		}
		
		// Invia la configurazione aggiornata al webview
		const message: WebviewMessage = {
			type: "api.configuration",
			payload: {
				apiConfiguration: this.apiConfiguration
			}
		};
		this.postMessageToWebview(message);
	}

	// Metodo che controlla le istruzioni completate
	private async onInstructionCompleted(id: string, agentId: string, instruction: string, result: string): Promise<void> {
		// Pubblica un messaggio al webview con il tipo corretto
		const message: WebviewMessage = {
			type: "instructionCompleted",
			payload: {
				id,
				agentId,
				instruction,
				result: result || ""
			}
		};
		this.postMessageToWebview(message);
	}

	/**
	 * Restituisce la sessione corrente per l'esportazione
	 * @returns La sessione esportabile
	 */
	async getCurrentSession(): Promise<ExportableSession> {
		// Implementa il recupero della sessione corrente
		// Questo è un esempio, l'implementazione effettiva dipende dalla struttura
		// dei dati in JarvisProvider
		
		// Ottieni i messaggi dalla sessione corrente
		const messages = await this.getChatMessages();
		
		// Crea l'oggetto sessione esportabile
		const session: ExportableSession = {
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content,
				timestamp: msg.timestamp
			})),
			settings: {
				model: this.apiConfiguration.modelId || "",
				temperature: this.apiConfiguration.temperature,
				maxTokens: this.apiConfiguration.maxTokens
			},
			contextFiles: [],
			timestamp: Date.now()
		};
		
		return session;
	}
	
	/**
	 * Carica una sessione importata
	 * @param session La sessione importata
	 */
	async loadImportedSession(session: ExportableSession): Promise<void> {
		if (!session.messages || session.messages.length === 0) {
			throw new Error("La sessione importata non contiene messaggi");
		}
		
		try {
			// Svuota la sessione corrente
			await this.clearChat();
			
			// Carica i messaggi della sessione importata
			for (const msg of session.messages) {
				await this.addChatMessage(msg);
			}
			
			// Applica le impostazioni della sessione importata, se presenti
			if (session.settings) {
				if (session.settings.model) {
					this.apiConfiguration.modelId = session.settings.model;
				}
				if (session.settings.temperature !== undefined) {
					this.apiConfiguration.temperature = session.settings.temperature;
				}
				if (session.settings.maxTokens !== undefined) {
					this.apiConfiguration.maxTokens = session.settings.maxTokens;
				}
			}
			
			// Aggiorna lo stato nella UI
			await this.postStateToWebview();
			
			// Notifica la UI che i messaggi sono stati caricati
			await this.postMessageToWebview({
				type: "chatMessagesLoaded",
				payload: {
					messages: session.messages
				}
			});
		} catch (error) {
			console.error("Errore nel caricamento della sessione importata:", error);
			throw new Error(`Errore nel caricamento della sessione: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	
	/**
	 * Recupera i messaggi della chat corrente
	 * @returns Array di messaggi della chat
	 */
	private async getChatMessages(): Promise<any[]> {
		// Implementazione di esempio - sostituisci con la logica effettiva
		// In una implementazione reale, questi messaggi potrebbero essere recuperati
		// dallo stato dell'estensione o tramite una chiamata al WebView
		
		// Richiedi i messaggi al WebView
		return []; // Sostituisci con l'implementazione reale
	}
	
	/**
	 * Svuota la chat corrente
	 */
	private async clearChat(): Promise<void> {
		// Invia un messaggio al WebView per svuotare la chat
		await this.postMessageToWebview({
			type: "clearChat",
			payload: {}
		});
	}
	
	/**
	 * Aggiunge un messaggio alla chat
	 * @param message Il messaggio da aggiungere
	 */
	private async addChatMessage(message: any): Promise<void> {
		// Invia un messaggio al WebView per aggiungere il messaggio
		await this.postMessageToWebview({
			type: "addChatMessage",
			payload: {
				message
			}
		});
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
		vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast ? 'dark' : 'light';
}

// Aggiungo le classi placeholder alla fine del file
class WorkspaceTracker {
  constructor(provider: any) {}
}

class JarvisAccountService {
  constructor(provider: any) {
    this.signOut = async () => {};
  }
  async signOut() {}
}

class FileManager {
  readFile(filePath: string): Promise<string> { return Promise.resolve(''); }
  writeFile(filePath: string, content: string): Promise<void> { return Promise.resolve(); }
  createFile(filePath: string, content: string): Promise<void> { return Promise.resolve(); }
  deleteFile(filePath: string): Promise<void> { return Promise.resolve(); }
  listFiles(dirPath: string): Promise<string[]> { return Promise.resolve([]); }
  listFilesRecursive(dirPath: string): Promise<string[]> { return Promise.resolve([]); }
}

class AIFileManager {
  constructor(fileManager: FileManager) {}
  setModel(modelInfo: any, provider: any) {}
}

class TelemetryService {}

// Aggiungo una funzione placeholder per getUri
function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]): vscode.Uri {
    // Utilizziamo path.join invece di Uri.joinPath che non esiste
    const joinedPath = path.join(...pathList);
    return vscode.Uri.file(path.join(extensionUri.fsPath, joinedPath));
} 