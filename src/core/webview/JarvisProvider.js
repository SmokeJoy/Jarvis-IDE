import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { promises as fs } from "fs";
import { SettingsManager } from "../../services/settings/SettingsManager";
import { OpenAiCompatibleModelInfo } from "../../shared/types/api.types";
import { LLMProviderId, ApiConfiguration } from "../../shared/types/api.types";
import { WebviewMessage, OutgoingWebviewMessage, IncomingWebviewMessage, convertToWebviewMessage } from "../../shared/protocols";
import { ExtensionState, ExtensionMessage } from "../../shared/ExtensionMessage";
import { AutoApprovalSettings, ChatSettings, BrowserSettings } from "../../shared/types/user-settings.types";
import { McpHub } from "../../services/mcp/McpHub";
import { McpDispatcher } from "../../services/mcp/McpDispatcher";
import { McpToolCall } from "../../shared/types/mcp.types";
import { AgentStatus, TaskQueueState, PriorityLevel, TaskStatus } from "../../shared/types/mas.types";
import { IJarvisProvider, AgentMode, AgentConfig, ExtendedChatSettings, JarvisSettings, SupervisorAgent, ConfigModelInfo, TelemetrySetting, HistoryItem } from "../../shared/types/provider.types";
export class JarvisProvider {
    constructor(context, outputChannel, settings, autoApprovalSettings = {
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
    }, customInstructions = "", _task, _images, _historyItem, telemetryService) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.autoApprovalSettings = autoApprovalSettings;
        this.customInstructions = customInstructions;
        this._task = _task;
        this._images = _images;
        this._historyItem = _historyItem;
        this.telemetryService = telemetryService;
        this.disposables = [];
        this.latestAnnouncementId = "march-22-2025";
        this.mcpMarketplaceEnabled = true;
        this.telemetrySetting = { enabled: false };
        this.planActSeparateModelsSetting = false;
        this.taskHistory = [];
        this.use_docs = false;
        this.contextPrompt = '';
        this.coder_mode = true;
        this.multi_agent = false;
        this.masSystem = null;
        this.cachedOllamaModels = [];
        this.cachedLmStudioModels = [];
        this.taskQueue = {
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
        this.apiConfiguration = {
            provider: "openai",
            apiKey: "",
            modelId: "gpt-4",
            temperature: 0.7,
            maxTokens: 4000,
        };
        this.settings = settings;
        this.outputChannel.appendLine("JarvisProvider instantiated");
        JarvisProvider.activeInstances.add(this);
        this.workspaceTracker = new WorkspaceTracker(this);
        // Inizializza McpHub
        this.mcpHub = new McpHub();
        this.accountService = new JarvisAccountService(this);
        // Inizializza McpDispatcher
        this.mcpDispatcher = new McpDispatcher((msg) => this.postMessageToWebview(msg));
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(() => {
            this.postStateToWebview();
        }));
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
    }
    async initializeSettings() {
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
    async initializeJarvis() {
        // Implementa la logica per inizializzare Jarvis con la configurazione corretta
        // Questo dipende dall'implementazione della classe Jarvis
        // Esempio (da implementare in base alle necessità effettive):
        // this.jarvis = new Jarvis(/* parametri necessari */);
    }
    async dispose() {
        JarvisProvider.activeInstances.delete(this);
        this.view = undefined;
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
    async setUserInfo(info) {
        this.userInfo = info;
        await this.updateGlobalState("userInfo", info);
    }
    static getVisibleInstance() {
        return Array.from(JarvisProvider.activeInstances).find((instance) => instance.view?.visible);
    }
    async resolveWebviewView(webviewView) {
        this.view = webviewView;
        // Initialize the webview settings
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };
        // Set the HTML content
        let htmlContent = "";
        if (process.env.NODE_ENV === "development" && process.env.WEBVIEW_URL) {
            htmlContent = await this.getHMRHtmlContent(webviewView.webview);
        }
        else {
            htmlContent = this.getHtmlContent(webviewView.webview);
        }
        webviewView.webview.html = htmlContent;
        // Setup event listeners
        this.setWebviewMessageListener(webviewView.webview);
        // Initialize task based on constructor parameters
        if (this._task || this._images) {
            await this.initJarvisWithTask(this._task, this._images);
        }
        else if (this._historyItem) {
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
                    multi_agent: this.multi_agent
                }
            });
        }
    }
    async initJarvisWithTask(task, images) {
        // Implement task initialization logic
    }
    async initJarvisWithHistoryItem(historyItem) {
        // Implement history item initialization logic
    }
    /**
     * Invia un messaggio alla WebView
     * @param message Il messaggio da inviare alla WebView
     */
    async postMessageToWebview(message) {
        if (!this.view?.webview) {
            return;
        }
        try {
            // Convertire il messaggio usando la funzione centralizzata
            const webviewMessage = convertToWebviewMessage(message);
            if (!webviewMessage) {
                console.warn('[JarvisProvider] Impossibile convertire il messaggio per la WebView:', message);
                return;
            }
            // Aggiungiamo source per aiutare nel debug
            const messageWithSource = {
                ...webviewMessage,
                source: 'extension'
            };
            // Invia il messaggio
            this.view.webview.postMessage(messageWithSource);
        }
        catch (error) {
            console.error("Errore nell'invio del messaggio alla WebView:", error);
        }
    }
    getHtmlContent(webview) {
        // Generate HTML for the webview
        const scriptUri = getUri(webview, this.context.extensionUri, [
            "out",
            "webview",
            "main.js",
        ]);
        const styleUri = getUri(webview, this.context.extensionUri, [
            "out",
            "webview",
            "main.css",
        ]);
        const codiconsUri = getUri(webview, this.context.extensionUri, [
            "node_modules",
            "@vscode/codicons",
            "dist",
            "codicon.css",
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
            window.resourceBaseUrl = "${webview.asWebviewUri(this.context.extensionUri)}";
            window.isDarkTheme = ${theme === "dark"};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }
    async getHMRHtmlContent(webview) {
        // Generate HTML for development with Hot Module Replacement
        const scriptUri = process.env.WEBVIEW_URL;
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
            window.resourceBaseUrl = "${webview.asWebviewUri(this.context.extensionUri)}";
            window.isDarkTheme = ${theme === "dark"};
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
    setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage(async (message) => {
            // Implement message handling logic
            console.log(`Received message: ${JSON.stringify(message)}`);
            switch (message.type) {
                case 'updateSetting':
                    if (message.key && message.value !== undefined) {
                        await this.handleSettingChange(message.key, message.value);
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
                        const systemPromptDir = path.join(this.context.globalStorageUri.fsPath, 'config');
                        const systemPromptPath = path.join(systemPromptDir, 'system_prompt.md');
                        webview.postMessage({
                            type: 'systemPromptLoaded',
                            content,
                            filePath: systemPromptPath
                        });
                    }
                    catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                    }
                    catch (error) {
                        console.error('Errore nel ripristino delle impostazioni predefinite:', error);
                        webview.postMessage({
                            type: 'error',
                            message: 'Impossibile ripristinare le impostazioni predefinite'
                        });
                    }
                    break;
                case 'openSystemPromptFile':
                    try {
                        const systemPromptDir = path.join(this.context.globalStorageUri.fsPath, 'config');
                        const systemPromptPath = path.join(systemPromptDir, 'system_prompt.md');
                        const uri = vscode.Uri.file(systemPromptPath);
                        await vscode.commands.executeCommand('vscode.open', uri);
                    }
                    catch (error) {
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
                        const logPath = path.join(this.context.globalStorageUri.fsPath, 'logs');
                        await fs.mkdir(logPath, { recursive: true });
                        const uri = vscode.Uri.file(logPath);
                        await vscode.commands.executeCommand('revealFileInOS', uri);
                    }
                    catch (error) {
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
                        }
                        catch (error) {
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
                    }
                    catch (error) {
                        console.error('Errore nel ripristino del system prompt:', error);
                        webview.postMessage({
                            type: 'error',
                            message: 'Impossibile ripristinare il system prompt'
                        });
                    }
                    break;
                case 'sendCoderInstruction':
                    const instruction = message.payload?.instruction;
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
                    const agentId = message.payload?.agentId;
                    if (agentId) {
                        this.handleToggleAgentActive(agentId, message.payload.active);
                    }
                    break;
            }
        }, undefined, this.disposables);
    }
    async updateTelemetrySetting(telemetrySetting) {
        // Implement telemetry settings update
    }
    async togglePlanActModeWithChatSettings(chatSettings, chatContent) {
        console.log(`Toggling plan-act mode: ${chatSettings.separateMode ? 'separate' : 'unified'}`);
        if (chatSettings.separateMode) {
            // Save current mode
            this.previousModeProvider = this.apiConfiguration.provider;
            this.previousModeModelId = this.apiConfiguration.modelId;
            this.previousModeModelInfo = this.apiConfiguration.modelInfo;
            this.previousModeVsCodeLmModelSelector = this.apiConfiguration.vsCodeLmModelSelector;
            this.previousModeThinkingBudgetTokens = chatSettings.thinkingBudgetTokens;
            // Switch to planning mode if specified
            if (chatSettings.planning) {
                this.updateApiConfig({
                    provider: chatSettings.planning.provider,
                    apiKey: this.apiConfiguration.apiKey,
                    modelId: chatSettings.planning.modelId,
                    vsCodeLmModelSelector: chatSettings.planning.vsCodeLmModelSelector,
                });
            }
        }
        else {
            // Restore previous mode
            this.updateApiConfig({
                provider: this.previousModeProvider,
                apiKey: this.apiConfiguration.apiKey,
                modelId: this.previousModeModelId,
                modelInfo: this.previousModeModelInfo,
                vsCodeLmModelSelector: this.previousModeVsCodeLmModelSelector,
            });
        }
        // Invia un messaggio di tipo corretto al webview
        const message = {
            type: "message",
            payload: {
                apiConfiguration: this.apiConfiguration,
                separateMode: chatSettings.separateMode,
                thinkingBudgetTokens: chatSettings.thinkingBudgetTokens,
                chatContent: chatContent
            }
        };
        this.postMessageToWebview(message);
    }
    async cancelTask() {
        // Implement task cancellation
    }
    async updateCustomInstructions(instructions) {
        // Implement custom instructions update
    }
    async updateApiConfiguration(apiConfiguration) {
        // Implement API configuration update
    }
    async getDocumentsPath() {
        // Implement documents path retrieval
        return "";
    }
    async ensureMcpServersDirectoryExists() {
        // Implement MCP servers directory creation
        return "";
    }
    async ensureSettingsDirectoryExists() {
        // Implement settings directory creation
        return "";
    }
    /**
     * Ottiene il contenuto del system prompt
     * @returns Contenuto del system prompt
     */
    async getSystemPrompt() {
        if (!this.settingsManager) {
            throw new Error("SettingsManager non inizializzato");
        }
        try {
            return await this.settingsManager.loadSystemPrompt();
        }
        catch (error) {
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
    async saveSystemPrompt(content) {
        if (!this.settingsManager) {
            throw new Error("SettingsManager non inizializzato");
        }
        try {
            await this.settingsManager.saveSystemPrompt(content);
        }
        catch (error) {
            console.error('Errore nel salvataggio del system prompt:', error);
            throw error;
        }
    }
    /**
     * Ripristina il system prompt predefinito
     */
    async resetSystemPrompt() {
        const defaultPrompt = '# System Prompt\n\nSei Jarvis-IDE, un assistente AI per lo sviluppo di software.\n\n' +
            'Aiuta l\'utente con le sue richieste relative alla programmazione, debugging e gestione di progetti software.';
        await this.saveSystemPrompt(defaultPrompt);
    }
    async readFile(filePath) {
        try {
            return await this.fileManager?.readFile(filePath) || '';
        }
        catch (error) {
            throw new Error(`Errore nella lettura del file ${filePath}: ${error}`);
        }
    }
    async editFile(filePath, newContent) {
        try {
            await this.fileManager?.writeFile(filePath, newContent);
        }
        catch (error) {
            throw new Error(`Errore nella modifica del file ${filePath}: ${error}`);
        }
    }
    async createFile(filePath, content) {
        try {
            await this.fileManager?.createFile(filePath, content);
        }
        catch (error) {
            throw new Error(`Errore nella creazione del file ${filePath}: ${error}`);
        }
    }
    async deleteFile(filePath) {
        try {
            await this.fileManager?.deleteFile(filePath);
        }
        catch (error) {
            throw new Error(`Errore nell'eliminazione del file ${filePath}: ${error}`);
        }
    }
    async listFiles(dirPath = '.') {
        try {
            return await this.fileManager?.listFiles(dirPath) || [];
        }
        catch (error) {
            throw new Error(`Errore nel listing dei file dalla directory ${dirPath}: ${error}`);
        }
    }
    async listFilesRecursive(dirPath = '.') {
        try {
            return await this.fileManager?.listFilesRecursive(dirPath) || [];
        }
        catch (error) {
            throw new Error(`Errore nel listing ricorsivo dei file dalla directory ${dirPath}: ${error}`);
        }
    }
    async handleSettingChange(key, value) {
        // Aggiorna l'impostazione specifica
        if (key === "selectedModel") {
            this.apiConfiguration.modelId = value;
        }
        else if (key in this) {
            // @ts-ignore - Uso any per aggirare la verifica delle chiavi
            this[key] = value;
        }
        // Aggiorna le impostazioni nel servizio
        // @ts-ignore - Uso any per aggirare la verifica delle chiavi
        await this.settingsManager.updateSetting(key, value);
        // Invia un aggiornamento alla webview
        this.view?.webview.postMessage({
            type: "settingUpdated",
            payload: { key, value }
        });
    }
    async postStateToWebview() {
        if (!this.view?.webview) {
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
            browserSettings: {},
            chatSettings: {},
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
        this.view.webview.postMessage({
            type: 'stateUpdated',
            payload: state
        });
    }
    async getStateToPostToWebview() {
        // Implement state retrieval for webview
        return {};
    }
    async clearTask() {
        // Implement task clearing
    }
    async getState() {
        // Implement state retrieval
        return {
            apiConfiguration: this.apiConfiguration,
            lastShownAnnouncementId: this.lastShownAnnouncementId,
            customInstructions: this.customInstructions,
            taskHistory: this.taskHistory,
            autoApprovalSettings: this.autoApprovalSettings,
            browserSettings: {},
            chatSettings: {},
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
    async getGlobalState(key) {
        // Implement global state retrieval
        return undefined;
    }
    async updateGlobalState(key, value) {
        // Implement global state update
    }
    async updateTaskHistory(item) {
        // Implement task history update
        return [];
    }
    async getWorkspaceState(key) {
        // Implement workspace state retrieval
        return undefined;
    }
    async storeSecret(key, value) {
        // Implement secret storage
    }
    async getSecret(key) {
        // Implement secret retrieval
        return undefined;
    }
    async fetchOpenGraphData(url) {
        // Implement Open Graph data fetching
        return {};
    }
    async checkIsImageUrl(url) {
        // Implement image URL checking
        return false;
    }
    async resetState() {
        // Implement state reset
    }
    async getCurrentTaskItem() {
        // Implement current task item retrieval
        return undefined;
    }
    async getApiMetrics() {
        // Implement API metrics retrieval
        return { tokensIn: 0, tokensOut: 0 };
    }
    /**
     * Ottiene l'elenco dei modelli disponibili
     * @returns Elenco dei modelli configurati
     */
    async getAvailableModels() {
        const models = [];
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
    async handleModelUpdate(modelId) {
        if (!modelId)
            return;
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
    async getOllamaModels(baseUrl) {
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
            const models = data.models?.map((model) => model.name) || [];
            // Correggo l'errore con Set
            const uniqueModels = [];
            for (const model of models) {
                if (!uniqueModels.includes(model)) {
                    uniqueModels.push(model);
                }
            }
            return uniqueModels;
        }
        catch (error) {
            console.error('Errore nel recupero dei modelli Ollama:', error);
            return [];
        }
    }
    /**
     * Recupera i modelli disponibili da LM Studio
     * @param baseUrl URL base di LM Studio
     * @returns Lista dei modelli disponibili
     */
    async getLmStudioModels(baseUrl) {
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
            const modelsArray = data?.data?.map((model) => model.id) || [];
            // Correggo l'errore con Set
            const uniqueModels = [];
            for (const model of modelsArray) {
                if (!uniqueModels.includes(model)) {
                    uniqueModels.push(model);
                }
            }
            return uniqueModels;
        }
        catch (error) {
            console.error('Errore nel recupero dei modelli LM Studio:', error);
            return [];
        }
    }
    /**
     * Verifica se una stringa è un URL valido
     * @param url URL da verificare
     * @returns true se l'URL è valido
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Initializes the MAS system if not already initialized
     */
    initMasSystem() {
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
    setupMasEventListeners() {
        if (!this.masSystem)
            return;
        // Listen for instruction queued events
        this.masSystem.on('instruction-queued', (data) => {
            this.postMessageToWebview({
                type: 'instructionReceived',
                payload: {
                    id: data.instruction?.id || uuidv4(),
                    agentId: data.agentId,
                    instruction: data.instruction?.objective || data.instruction
                }
            });
            // Update task queue
            this.updateTaskQueue();
        });
        // Listen for instruction completed events
        this.masSystem.on('instruction-completed', (data) => {
            this.postMessageToWebview({
                type: "instructionCompleted",
                payload: {
                    id: data.instruction?.id || uuidv4(),
                    agentId: data.agentId,
                    instruction: data.instruction?.objective || data.instruction,
                    result: data.result
                }
            });
            // Update task queue
            this.updateTaskQueue();
        });
        // Listen for instruction failed events
        this.masSystem.on('instruction-failed', (data) => {
            this.postMessageToWebview({
                type: 'instructionFailed',
                payload: {
                    id: data.instruction?.id || uuidv4(),
                    agentId: data.agentId,
                    instruction: data.instruction?.objective || data.instruction,
                    error: data.error?.message || 'Unknown error'
                }
            });
            // Update task queue
            this.updateTaskQueue();
        });
    }
    /**
     * Updates the task queue state and sends it to the WebView
     */
    updateTaskQueue() {
        if (!this.masSystem)
            return;
        // In a real implementation, we would get this from the MAS system
        // Here we're simulating it for the MVP
        this.taskQueue = this.getTaskQueue();
        this.postMessageToWebview({
            type: 'taskQueueUpdate',
            payload: this.taskQueue
        });
    }
    /**
     * Gets the current task queue from the MAS system
     * This is a temporary implementation for the MVP
     */
    getTaskQueue() {
        // In a real implementation, this would come from the MAS system
        return this.taskQueue;
    }
    /**
     * Gets the status of all agents in the MAS system
     */
    getAgentsStatus() {
        if (!this.masSystem) {
            this.initMasSystem();
        }
        return this.masSystem?.getAllAgentsStatus() || [];
    }
    /**
     * Gestisce i messaggi ricevuti dalla WebView
     * @param message Messaggio ricevuto dalla WebView
     */
    async handleWebviewMessage(message) {
        // Validazione del messaggio
        if (!message || typeof message !== 'object' || !message.type) {
            console.error("Messaggio WebView non valido:", message);
            return;
        }
        try {
            // Utilizzo any per evitare errori di tipizzazione durante la migrazione
            const msg = message;
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
                        }
                        else {
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
                    }
                    catch (error) {
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
                        }
                        catch (error) {
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
        }
        catch (error) {
            console.error("Errore nella gestione del messaggio WebView:", error);
        }
    }
    /**
     * Handles sending an instruction to the CoderAgent
     */
    async handleSendCoderInstruction(instruction) {
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
            });
        }
        catch (error) {
            // In caso di errore, notifica la WebView
            this.postMessageToWebview({
                type: 'instructionFailed',
                payload: {
                    id: uuidv4(),
                    agentId: 'coder-agent',
                    instruction,
                    error: String(error)
                }
            });
        }
    }
    /**
     * Handles getting the status of all agents
     */
    handleGetAgentsStatus() {
        if (!this.masSystem) {
            return;
        }
        const agentsStatus = this.masSystem.getAllAgentsStatus();
        this.postMessageToWebview({
            type: 'agentsStatusUpdate',
            payload: agentsStatus
        });
    }
    /**
     * Handles getting the current task queue status
     */
    handleGetTaskQueueStatus() {
        if (!this.masSystem) {
            return;
        }
        const taskQueue = this.getTaskQueue();
        this.postMessageToWebview({
            type: 'taskQueueUpdate',
            payload: taskQueue
        });
    }
    /**
     * Handles aborting the current CoderAgent instruction
     */
    handleAbortCoderInstruction() {
        if (!this.masSystem) {
            return;
        }
        // Aggiungi il task attivo ai task abortiti se esiste
        if (this.taskQueue.active) {
            const abortedTask = { ...this.taskQueue.active, status: 'aborted' };
            this.taskQueue.aborted.push(abortedTask);
            this.taskQueue.active = undefined;
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
    handleToggleAgentActive(agentId, active) {
        try {
            const masSystem = this.masSystem;
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
        }
        catch (error) {
            console.error(`Error toggling agent ${agentId} active state:`, error);
        }
    }
    // Metodo per impostare la configurazione del modello in base al provider
    async setModelConfiguration(modelId) {
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
        if (this.view) {
            this.postMessageToWebview({
                type: 'api.configuration',
                apiConfiguration: this.apiConfiguration
            });
        }
    }
    switchToProvider(provider, modelId) {
        console.log(`Switching provider from ${this.apiConfiguration.provider} to ${provider}, model ID: ${this.apiConfiguration.modelId} to ${modelId || 'default'}`);
        // Salva la configurazione attuale
        const previousProvider = this.apiConfiguration.provider;
        const previousModelId = this.apiConfiguration.modelId;
        // Aggiorna il provider
        this.apiConfiguration.provider = provider;
        // Se è fornito un ID modello, aggiornalo
        if (modelId) {
            this.apiConfiguration.modelId = modelId;
            // Configurazioni specifiche per alcuni provider
            if (provider === 'google') {
                // Invece di usare 'googleModelId' che non esiste, aggiorniamo direttamente modelId
                this.apiConfiguration.modelId = modelId;
            }
            else if (provider === 'mistral') {
                // Invece di usare 'mistralModelId' che non esiste, aggiorniamo direttamente modelId
                this.apiConfiguration.modelId = modelId;
            }
        }
        else {
            // Se non viene specificato un modello, imposta un modello predefinito in base al provider
            switch (provider) {
                case 'openai':
                    this.apiConfiguration.modelId = 'gpt-4';
                    break;
                case 'anthropic':
                    this.apiConfiguration.modelId = 'claude-3-opus-20240229';
                    break;
                case 'mistral':
                    this.apiConfiguration.modelId = 'mistral-large-latest';
                    break;
                case 'google':
                    this.apiConfiguration.modelId = 'gemini-pro';
                    break;
                case 'ollama':
                    // Usa il primo modello disponibile o un predefinito
                    this.apiConfiguration.modelId = this.cachedOllamaModels?.[0] || 'llama2';
                    break;
                case 'lmstudio':
                    // Usa il primo modello disponibile o un predefinito
                    this.apiConfiguration.modelId = this.cachedLmStudioModels?.[0] || 'local-model';
                    break;
                default:
                    // Mantiene l'ID modello corrente
                    break;
            }
        }
        console.log(`Switched provider from ${previousProvider} to ${this.apiConfiguration.provider}, model ID: ${previousModelId} to ${this.apiConfiguration.modelId}`);
        // Invia la configurazione aggiornata al webview
        const message = {
            type: "api.configuration",
            payload: {
                apiConfiguration: this.apiConfiguration
            }
        };
        this.postMessageToWebview(message);
    }
    // Metodo per aggiornare la configurazione API
    updateApiConfig(apiConfig) {
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
        const message = {
            type: "api.configuration",
            payload: {
                apiConfiguration: this.apiConfiguration
            }
        };
        this.postMessageToWebview(message);
    }
    // Metodo che controlla le istruzioni completate
    async onInstructionCompleted(id, agentId, instruction, result) {
        // Pubblica un messaggio al webview con il tipo corretto
        const message = {
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
}
JarvisProvider.sideBarId = "jarvis-ide.SidebarProvider";
JarvisProvider.tabPanelId = "jarvis-ide.TabPanelProvider";
JarvisProvider.activeInstances = new Set();
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
    constructor(provider) { }
}
class JarvisAccountService {
    constructor(provider) {
        this.signOut = async () => { };
    }
    async signOut() { }
}
class FileManager {
    readFile(filePath) { return Promise.resolve(''); }
    writeFile(filePath, content) { return Promise.resolve(); }
    createFile(filePath, content) { return Promise.resolve(); }
    deleteFile(filePath) { return Promise.resolve(); }
    listFiles(dirPath) { return Promise.resolve([]); }
    listFilesRecursive(dirPath) { return Promise.resolve([]); }
}
class AIFileManager {
    constructor(fileManager) { }
    setModel(modelInfo, provider) { }
}
class TelemetryService {
}
// Aggiungo una funzione placeholder per getUri
function getUri(webview, extensionUri, pathList) {
    // Utilizziamo path.join invece di Uri.joinPath che non esiste
    const joinedPath = path.join(...pathList);
    return vscode.Uri.file(path.join(extensionUri.fsPath, joinedPath));
}
//# sourceMappingURL=JarvisProvider.js.map