/**
 * @file extension.ts
 * @description Punto di ingresso principale dell'estensione Jarvis IDE
 */

// Importazioni di base
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
import * as vscode from 'vscode';
import { JarvisProvider } from './core/webview/JarvisProvider';
import { Logger } from './utils/logger';
import './utils/path.js'; // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from './integrations/editor/DiffViewProvider';
import assert from 'node:assert';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryService } from './services/TelemetryService';
import path from 'path';
import { registerSystemPromptCommands } from './commands/systemPrompt';
import { registerAgentCommands } from './commands/agentCommands';
import { registerExportCommands } from './commands/exportCommands';
import { LLMProviderId } from './shared/types/api.types';
import { registerTestCommand } from './services/mcp/test-script';
import { logger } from './utils/logger';
import { LogLevel } from './types/global';
import { initLogFile } from './utils/logStorage';
import { exportCurrentLog, openLogDirectory } from './utils/logExport';
import { castAs } from './shared/types/webview.types';

// Importazioni di tipo, lasciare così
import { OpenRouterHandler } from './api/providers/openrouter';
import { WebviewMessage, WebviewMessageType, ExtensionMessage } from './shared/types/webview.types';
import { JarvisSettings } from './types/settings.types';

// Aggiungi l'importazione del Command Center e degli agenti
import { commandCenter } from './core/command-center';
import { initializeAgents, terminateAgents } from './core/mas/agents';

// Importazioni di tipo aggiuntive
import { ModelInfo } from './shared/types/api.types';
import { JarvisAPI } from './api/JarvisAPI';
import { ChatMessage } from './shared/types/message.types';
import type { SettingsManager as SettingsManagerType } from './types/settings.types';

// Importa il provider per il refactoring overlay
import { RefactorOverlayProvider } from './integrations/refactor/RefactorOverlayProvider';

// Importa il nuovo adapter per la creazione di messaggi sicuri
import { createSafeMessage } from './shared/types/message-adapter';

// Definizione della modalità sviluppo
const isDevelopmentMode = process.env['NODE_ENV'] === 'development';

// Interfacce per i moduli dinamici
interface ChatHistoryModule {
  saveChatMessage: (message: ChatMessage) => Promise<void>;
  loadChatHistory: () => Promise<ChatMessage[]>;
  clearChatHistory: () => Promise<void>;
}

interface ModelLoaderModule {
  loadModels: () => Promise<ModelInfo[]>;
}

interface SettingsManagerClass extends SettingsManagerType {
  getInstance: () => SettingsManagerClass;
  getPromptProfiles: () => Promise<Array<{
    id: string;
    name: string;
    description?: string;
    contextPrompt: string;
  }>>;
}

interface SettingsManagerModule {
  SettingsManager: SettingsManagerClass;
}

interface ExportChatModule {
  exportChatToMarkdown: (messages: ChatMessage[]) => Promise<string>;
}

interface ExportsModule {
  createJarvisAPI: () => Promise<JarvisAPI>;
}

// Predichiarazioni di variabili per importazioni dinamiche
let saveChatMessage: ChatHistoryModule['saveChatMessage'];
let loadChatHistory: ChatHistoryModule['loadChatHistory'];
let clearChatHistory: ChatHistoryModule['clearChatHistory'];
let loadModels: ModelLoaderModule['loadModels'];
let SettingsManagerInstance: SettingsManagerModule['SettingsManager'];
let exportChatToMarkdown: ExportChatModule['exportChatToMarkdown'];
let createJarvisAPI: ExportsModule['createJarvisAPI'];

// Importazione dei moduli a runtime
async function loadDynamicModules() {
  try {
    const chatHistoryModule = await import('./utils/chatHistory.js');
    saveChatMessage = chatHistoryModule.saveChatMessage;
    loadChatHistory = chatHistoryModule.loadChatHistory;
    clearChatHistory = chatHistoryModule.clearChatHistory;

    const modelLoaderModule = await import('./data/modelLoader.js');
    loadModels = modelLoaderModule.loadModels;

    const settingsManagerModule = await import('./services/settings/SettingsManager.js');
    SettingsManagerInstance = settingsManagerModule.SettingsManager;

    const exportChatModule = await import('./utils/exportChat.js');
    exportChatToMarkdown = exportChatModule.exportChatToMarkdown;

    const exportsModule = await import('./exports.js');
    createJarvisAPI = exportsModule.createJarvisAPI;

    logger.info('Moduli dinamici caricati con successo');
  } catch (error) {
    logger.error('Errore nel caricamento dei moduli dinamici', error as Error);
  }
}

function setLogLevel(level: number) {
  logger.setLevel(level);
}

/*
Built using https://github.com/microsoft/vscode-webview-ui-toolkit

Inspired by
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra

*/

let outputChannel: vscode.OutputChannel;
let provider: JarvisProvider | undefined;
let telemetryService: TelemetryService | undefined;

// Stato condiviso per i vari gestori
interface AppState {
  chatHistory: ChatMessage[];
}

// Istanza stato condiviso
const state: AppState = {
  chatHistory: [],
};

// Handlers per i messaggi
async function handleSystemPrompt(
  _panel: vscode.WebviewPanel,
  _message: WebviewMessage
): Promise<void> {
  // Implementazione gestione messaggi prompt che verrà aggiunta in seguito
}

async function handleSettingsUpdate(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Recupera le impostazioni correnti
    const currentSettings = settingsManager.getSettings();

    // Aggiorna le impostazioni con quelle ricevute dal messaggio
    if (message.payload) {
      // Gestisci specificamente il contextPrompt che può essere stringa o oggetto
      if (message.payload['contextPrompt'] !== undefined) {
        // Se il contextPrompt è un oggetto, lo serializziamo in JSON
        if (typeof message.payload['contextPrompt'] === 'object') {
          currentSettings['contextPrompt'] = JSON.stringify(message.payload['contextPrompt']);
        } else {
          currentSettings['contextPrompt'] = message.payload['contextPrompt'];
        }
      }

      // Aggiorna altre impostazioni se presenti
      if (message.payload['apiConfiguration']) {
        currentSettings['apiConfiguration'] = message.payload['apiConfiguration'];
      }

      if (message.payload['telemetryEnabled'] !== undefined) {
        currentSettings['telemetrySetting'] = {
          enabled: !!message.payload['telemetryEnabled'],
        };
      }

      if (message.payload['customInstructions'] !== undefined) {
        currentSettings['customInstructions'] = message.payload['customInstructions'];
      }

      // Salva le impostazioni aggiornate
      await settingsManager.updateSettings(currentSettings);

      // Invia una conferma alla webview
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'settingsSaved',
          id: message.id, // Restituisci lo stesso ID per il tracciamento delle richieste
        })
      );

      console.log('Impostazioni salvate:', currentSettings);
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento delle impostazioni:", error);
    // Invia un messaggio di errore alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        message: `Errore nell'aggiornamento delle impostazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

async function handleGetSettings(panel: vscode.WebviewPanel): Promise<void> {
  try {
    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Carica le impostazioni dal disco
    const settings = settingsManager.getSettings();

    // Prepara l'oggetto risposta con tutte le impostazioni, incluso contextPrompt
    const response: ExtensionMessage = {
      type: 'settings',
      id: 'get-settings-response', // ID per la tracciabilità della risposta
      settings: {
        apiConfiguration: settings.apiConfiguration || {
          provider: 'openai',
          apiKey: '',
          modelId: '',
          baseUrl: '',
          temperature: 0.7,
          maxTokens: 4096,
        },
        telemetrySetting: settings.telemetrySetting || { enabled: true },
        customInstructions: settings.customInstructions || '',
        // Includi il contextPrompt nelle impostazioni
        contextPrompt: settings.contextPrompt || '',
      },
    };

    // Invia la risposta alla webview
    console.log('Invio impostazioni alla webview:', response);
    panel.webview.postMessage(castAs<ExtensionMessage>(response));
  } catch (error) {
    console.error('Errore nel recupero delle impostazioni:', error);
    // Invia un messaggio di errore alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        message: `Errore nel recupero delle impostazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

// Implement the handlers for the new message types
async function handleGetPromptProfiles(panel: vscode.WebviewPanel): Promise<void> {
  try {
    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Ottieni tutti i profili di prompt
    const profiles = settingsManager.getPromptProfiles();

    // Invia i profili alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfiles',
        id: 'get-prompt-profiles-response',
        profiles: profiles,
      })
    );

    console.log('Profili di prompt inviati alla webview:', profiles);
  } catch (error) {
    console.error('Errore nel recupero dei profili di prompt:', error);
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        error: `Errore nel recupero dei profili di prompt: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

async function handleCreatePromptProfile(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    if (!message.payload?.['profile']) {
      throw new Error('Dati del profilo mancanti');
    }

    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Crea il nuovo profilo
    const newProfile = await settingsManager.createPromptProfile(message.payload['profile']);

    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileCreated',
        profile: newProfile,
      })
    );

    console.log('Nuovo profilo di prompt creato:', newProfile);
  } catch (error) {
    console.error('Errore nella creazione del profilo di prompt:', error);
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        error: `Errore nella creazione del profilo di prompt: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

async function handleUpdatePromptProfile(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    if (!message.payload?.['profile'] || !message.payload?.['profileId']) {
      throw new Error('Dati del profilo o ID mancanti');
    }

    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Aggiorna il profilo esistente
    const updatedProfile = await settingsManager.updatePromptProfile(
      message.payload['profileId'],
      message.payload['profile']
    );

    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileUpdated',
        profile: updatedProfile,
      })
    );

    console.log('Profilo di prompt aggiornato:', updatedProfile);
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo di prompt:", error);
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        error: `Errore nell'aggiornamento del profilo di prompt: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

async function handleDeletePromptProfile(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    if (!message.payload?.['profileId']) {
      throw new Error('ID del profilo mancante');
    }

    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Elimina il profilo
    await settingsManager.deletePromptProfile(message.payload['profileId']);

    // Ottieni i profili rimanenti dopo l'eliminazione
    const remainingProfiles = settingsManager.getPromptProfiles();

    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileDeleted',
        profileId: message.payload['profileId'],
        profiles: remainingProfiles,
      })
    );

    console.log('Profilo di prompt eliminato, ID:', message.payload['profileId']);
  } catch (error) {
    console.error("Errore nell'eliminazione del profilo di prompt:", error);
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        error: `Errore nell'eliminazione del profilo di prompt: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

async function handleSwitchPromptProfile(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    if (!message.payload?.['profileId']) {
      throw new Error('ID del profilo mancante');
    }

    // Ottieni il SettingsManager
    const settingsManager = SettingsManagerInstance.getInstance();

    // Imposta il profilo attivo
    const activeProfile = await settingsManager.setActivePromptProfile(
      message.payload['profileId']
    );

    // Ottieni tutti i profili dopo lo switch
    const allProfiles = settingsManager.getPromptProfiles();

    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileSwitched',
        profileId: message.payload['profileId'],
        profile: activeProfile,
        profiles: allProfiles,
      })
    );

    console.log('Profilo di prompt attivato:', activeProfile);
  } catch (error) {
    console.error('Errore nel cambio del profilo di prompt:', error);
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'error',
        error: `Errore nel cambio del profilo di prompt: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
      })
    );
  }
}

/**
 * Interfaccia per il messaggio di richiesta dei modelli
 */
interface ModelFetchMessage {
  provider: string;
  apiKey?: string;
  requestId: string;
}

/**
 * Gestisce la richiesta di modelli dai componenti webview
 * @param message Il messaggio ricevuto dalla webview
 * @param webview La webview che ha inviato il messaggio
 */
async function handleModelsFetch(message: ModelFetchMessage, webview: vscode.Webview) {
  const { provider, apiKey, requestId } = message;

  try {
    // Importa dinamicamente per evitare dipendenze circolari
    const { fetchModels } = await import('./data/modelLoader.js');

    // Recupera i modelli utilizzando modelLoader
    const models = await fetchModels(provider, apiKey);

    // Invia la risposta alla webview
    webview.postMessage({
      models,
      requestId,
    });
  } catch (error) {
    // Invia errore alla webview
    webview.postMessage({
      error: error instanceof Error ? error.message : 'Errore sconosciuto nel caricamento modelli',
      requestId,
    });

    Logger.error(`Errore nel caricamento modelli per ${provider}:`, error);
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Jarvis IDE');
  context.subscriptions.push(outputChannel);

  Logger.initialize(outputChannel);
  Logger.info('Jarvis IDE extension activated');

  // Inizializzazione del nuovo sistema di logging
  const config = vscode.workspace.getConfiguration('jarvis-ide');
  const level = config.get<string>('logLevel') ?? 'info';
  setLogLevel(LogLevel[level.toUpperCase() as keyof typeof LogLevel]);

  // Inizializza il file di log
  initLogFile();

  logger.info('Estensione attivata');
  logger.debug('Modalità debug attiva');

  // Test dell'invio dei log al WebView
  setTimeout(() => {
    logger.info('Test di invio log al WebView');
    logger.debug('Dettagli tecnici visibili in modalità debug');
    logger.warn('Attenzione: questo è un messaggio di avviso di test');
  }, 3000);

  // Inizializza il SettingsManager
  const settingsManager = SettingsManagerInstance.getInstance(context);

  // Carica le impostazioni dal disco
  await settingsManager.loadSettings();

  const settings: JarvisSettings = {
    apiKeys: [],
    theme: 'system',
    fontSize: 14,
    language: 'en',
    history: [],
    recentFiles: [],
    recentFolders: [],
    useTelemetry: true,
    use_docs: settingsManager.getSettings().use_docs,
    contextPrompt: settingsManager.getSettings().contextPrompt,
    coder_mode: settingsManager.getSettings().coder_mode,
    multi_agent: false, // Impostazione predefinita
    apiConfiguration: {
      provider: 'openai' as LLMProviderId,
      apiKey: '',
      modelId: '',
      baseUrl: '',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    telemetrySetting: { enabled: true },
    customInstructions: '',
    planActSeparateModelsSetting: false,
  };

  telemetryService = new TelemetryService(
    config.get('telemetryApiKey') || '',
    config.get('telemetrySetting') || 'ask'
  );

  provider = new JarvisProvider(context, outputChannel, settings);

  vscode.commands.executeCommand('setContext', 'jarvis-ide.isDevMode', isDevelopmentMode);

  // Registra i comandi del system prompt
  registerSystemPromptCommands(context, provider);

  // Registra i comandi dell'agente Jarvis
  const agentCommands = registerAgentCommands(context, provider);
  context.subscriptions.push(...agentCommands);

  // Registra i comandi per l'importazione ed esportazione
  const exportCommands = registerExportCommands(context, provider);
  context.subscriptions.push(...exportCommands);

  // Registra i comandi MAS
  registerMasCommands(context, provider);

  // Registra il comando di test per McpDispatcher (solo in modalità sviluppo)
  if (isDevelopmentMode) {
    registerTestCommand(context);
    logger.info('Comando di test McpDispatcher registrato');
  }

  // Registra il provider come webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(JarvisProvider.sideBarId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(JarvisProvider.tabPanelId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  await telemetryService.initialize(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.plusButtonClicked', async () => {
      Logger.info('Plus button Clicked');
      const visibleProvider = JarvisProvider.getVisibleInstance();
      if (!visibleProvider) {
        Logger.info('Cannot find any visible Jarvis instances.');
        return;
      }

      await visibleProvider.clearTask();
      await visibleProvider.postStateToWebview();
      await visibleProvider.postMessageToWebview({
        type: 'action',
        action: 'chatButtonClicked',
      } as ExtensionMessage);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.mcpButtonClicked', () => {
      const visibleProvider = JarvisProvider.getVisibleInstance();
      if (!visibleProvider) {
        Logger.info('Cannot find any visible Jarvis instances.');
        return;
      }

      visibleProvider.postMessageToWebview({
        type: 'action',
        action: 'mcpButtonClicked',
      } as ExtensionMessage);
    })
  );

  const openJarvisInNewTab = async () => {
    Logger.log('Opening Jarvis in new tab');
    // (this example uses webviewProvider activation event which is necessary to deserialize cached webview, but since we use retainContextWhenHidden, we don't need to use that event)
    // https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
    const tabProvider = new JarvisProvider(context, outputChannel, settings);
    //const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
    const lastCol = Math.max(
      ...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0)
    );

    // Check if there are any visible text editors, otherwise open a new group to the right
    const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0;
    if (!hasVisibleEditors) {
      await vscode.commands.executeCommand('workbench.action.newGroupRight');
    }
    const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two;

    const panel = vscode.window.createWebviewPanel(
      JarvisProvider.tabPanelId,
      'Jarvis IDE',
      targetCol,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );
    // TODO: use better svg icon with light and dark variants (see https://stackoverflow.com/questions/58365687/vscode-extension-iconpath)

    panel.iconPath = {
      light: vscode.Uri.file(
        path.join(context.extensionUri.fsPath, 'assets', 'icons', 'robot_panel_light.png')
      ),
      dark: vscode.Uri.file(
        path.join(context.extensionUri.fsPath, 'assets', 'icons', 'robot_panel_dark.png')
      ),
    };
    tabProvider.resolveWebviewView(panel);

    // Lock the editor group so clicking on files doesn't open them over the panel
    await setTimeoutPromise(100);
    await vscode.commands.executeCommand('workbench.action.lockEditorGroup');

    panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch (message.type) {
        case WebviewMessageType.LOAD_CHAT_HISTORY:
          try {
            const history = await loadChatHistory();
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'chatHistoryLoaded',
                messages: history,
              })
            );
          } catch (error) {
            console.error('Errore nel caricamento della chat history:', error);
          }
          break;
        case WebviewMessageType.CLEAR_CHAT_HISTORY:
          try {
            await clearChatHistory();
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'chatHistoryCleared',
              })
            );
          } catch (error) {
            console.error('Errore nella cancellazione della chat history:', error);
          }
          break;
        case WebviewMessageType.EXPORT_CHAT_HISTORY:
          if (message.payload?.format === 'markdown') {
            exportChatToMarkdown(state.chatHistory)
              .then(() => {
                vscode.window.showInformationMessage('Chat esportata con successo!');
              })
              .catch((error: Error) => {
                vscode.window.showErrorMessage(`Errore durante l'esportazione: ${error.message}`);
              });
          }
          break;
        case WebviewMessageType.SAVE_SETTINGS:
          if (message.payload) {
            const settingsManager = SettingsManagerInstance.getInstance();
            settingsManager.saveSettings({
              apiConfiguration: message.payload.apiConfiguration,
              telemetrySetting: { enabled: message.payload.telemetryEnabled ? true : false },
              customInstructions: message.payload.customInstructions,
              planActSeparateModelsSetting: false, // default value
            });
          }
          break;
        case WebviewMessageType.RESET_SETTINGS:
          SettingsManagerInstance.getInstance().resetSettings();
          break;
        case WebviewMessageType.GET_PROMPT_PROFILES:
          await handleGetPromptProfiles(panel);
          break;
        case WebviewMessageType.CREATE_PROMPT_PROFILE:
          await handleCreatePromptProfile(panel, message);
          break;
        case WebviewMessageType.UPDATE_PROMPT_PROFILE:
          await handleUpdatePromptProfile(panel, message);
          break;
        case WebviewMessageType.DELETE_PROMPT_PROFILE:
          await handleDeletePromptProfile(panel, message);
          break;
        case WebviewMessageType.SWITCH_PROMPT_PROFILE:
          await handleSwitchPromptProfile(panel, message);
          break;
        case WebviewMessageType.GET_SETTINGS:
          await handleGetSettings(panel);
          break;
        case WebviewMessageType.UPDATE_SETTINGS:
        case WebviewMessageType.UPDATE_SETTING:
          await handleSettingsUpdate(panel, message);
          break;
        case WebviewMessageType.EXPORT_SETTINGS:
          vscode.window
            .showSaveDialog({
              filters: {
                JSON: ['json'],
              },
              defaultUri: vscode.Uri.file('jarvis_ide_settings.json'),
            })
            .then(async (uri) => {
              if (uri) {
                try {
                  await SettingsManagerInstance.getInstance().exportToFile(uri.fsPath);
                  vscode.window.showInformationMessage('Impostazioni esportate con successo!');
                } catch (error) {
                  vscode.window.showErrorMessage(
                    `Errore durante l'esportazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
                  );
                }
              }
            });
          break;
        case WebviewMessageType.IMPORT_SETTINGS:
          vscode.window
            .showOpenDialog({
              filters: {
                JSON: ['json'],
              },
            })
            .then(async (uris) => {
              if (uris && uris[0]) {
                try {
                  await SettingsManagerInstance.getInstance().importFromFile(uris[0].fsPath);
                  vscode.window.showInformationMessage('Impostazioni importate con successo!');
                  // Ricarica le impostazioni nella WebView
                  const savedSettings = await SettingsManagerInstance.getInstance().loadSettings();
                  if (savedSettings) {
                    const visibleProvider = JarvisProvider.getVisibleInstance();
                    if (visibleProvider) {
                      visibleProvider.postMessageToWebview(
                        castAs<ExtensionMessage>({
                          type: 'state',
                          state: {
                            apiConfiguration: savedSettings.apiConfiguration,
                            telemetrySetting: savedSettings.telemetrySetting,
                            customInstructions: savedSettings.customInstructions,
                            planActSeparateModelsSetting:
                              savedSettings.planActSeparateModelsSetting,
                          },
                        })
                      );
                    }
                  }
                } catch (error) {
                  vscode.window.showErrorMessage(
                    `Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
                  );
                }
              }
            });
          break;
        case WebviewMessageType.SEND_PROMPT:
          try {
            const { prompt, modelId, apiKey } = message.payload;

            // Carica informazioni del modello
            const models = await loadModels(apiKey);
            const selectedModel = models.find((m) => m.id === modelId);

            if (!selectedModel) {
              throw new Error('Modello non trovato');
            }

            // Crea l'istanza di OpenRouterHandler
            const openRouterHandler = new OpenRouterHandler({
              apiKey,
              model: selectedModel,
            });

            // Crea il messaggio utente
            const userMessage = createSafeMessage('user', prompt, {
              id: uuidv4(),
              streaming: false
            });

            // Salva il messaggio utente
            await saveChatMessage(userMessage);

            // Invia il messaggio utente alla WebView
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'response',
                payload: {
                  text: prompt,
                  role: 'user',
                  streaming: false,
                },
              })
            );

            // Crea il messaggio assistente per lo streaming
            const assistantMessage = createSafeMessage('assistant', '', {
              id: uuidv4(),
              streaming: true
            });

            // Inizia lo streaming della risposta
            let fullResponse = '';
            const messageGenerator = openRouterHandler.createMessage(prompt, [
              createSafeMessage({role: 'user', content: prompt}),
            ]);

            for await (const chunk of messageGenerator) {
              if (chunk.type === 'text') {
                fullResponse += chunk.text;
              }
              // Aggiorna il messaggio durante lo streaming
              await saveChatMessage({ ...assistantMessage, content: fullResponse });

              panel.webview.postMessage(
                castAs<ExtensionMessage>({
                  type: 'response',
                  payload: {
                    text: chunk.type === 'text' ? chunk.text : '',
                    role: 'assistant',
                    streaming: true,
                  },
                })
              );
            }

            // Salva il messaggio finale
            assistantMessage.streaming = false;
            assistantMessage.content = fullResponse;
            await saveChatMessage(assistantMessage);

            // Invia il messaggio finale
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'response',
                payload: {
                  text: assistantMessage.content,
                  role: 'assistant',
                  streaming: false,
                },
              })
            );
          } catch (error) {
            console.error("Errore durante l'elaborazione del prompt:", error);
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'response',
                payload: {
                  error: error instanceof Error ? error.message : 'Errore sconosciuto',
                  role: 'assistant',
                  streaming: false,
                },
              })
            );
          }
          break;
        case WebviewMessageType.GET_SYSTEM_PROMPT:
        case WebviewMessageType.SAVE_SYSTEM_PROMPT:
          await handleSystemPrompt(panel, message);
          break;
        case WebviewMessageType.RUN_AGENT:
          try {
            const agent = JarvisAgent.getInstance();
            const result = await agent.runFullLoop(message.payload?.prompt || '');

            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'agentResponse',
                payload: result,
              })
            );
          } catch (error) {
            console.error('Error running agent:', error);
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'error',
                message: `Error running agent: ${error}`,
              })
            );
          }
          break;
        case WebviewMessageType.ANALYZE_FILE:
          try {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
              panel.webview.postMessage(
                castAs<ExtensionMessage>({
                  type: 'error',
                  message: 'No file open in editor',
                })
              );
              return;
            }

            const filePath = editor.document.uri.fsPath;
            const fileContent = editor.document.getText();

            const agent = JarvisAgent.getInstance();

            // Customize prompt for file analysis
            const filePrompt = `
Richiesta: ${message.payload?.prompt || 'Analizza questo file e suggerisci miglioramenti'}

File analizzato: ${filePath}

\`\`\`
${fileContent}
\`\`\`
`;

            const result = await agent.runFullLoop(filePrompt);

            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'agentResponse',
                payload: result,
              })
            );
          } catch (error) {
            console.error('Error analyzing file:', error);
            panel.webview.postMessage(
              castAs<ExtensionMessage>({
                type: 'error',
                message: `Error analyzing file: ${error}`,
              })
            );
          }
          break;
        case WebviewMessageType.GET_BENCHMARK_SESSIONS:
          vscode.commands.executeCommand('jarvis-ide.benchmarkGetSessions');
          break;
        case WebviewMessageType.GET_BENCHMARK_SESSION:
          vscode.commands.executeCommand(
            'jarvis-ide.benchmarkGetSession',
            message.benchmarkSessionId
          );
          break;
        case WebviewMessageType.GET_BENCHMARK_STATS:
          vscode.commands.executeCommand(
            'jarvis-ide.benchmarkGetStats',
            message.benchmarkTimeframe || 30
          );
          break;
        case WebviewMessageType.GET_BENCHMARK_TIMELINE:
          vscode.commands.executeCommand(
            'jarvis-ide.benchmarkGetTimeline',
            message.benchmarkProvider,
            message.benchmarkTimeframe || 30
          );
          break;
        case WebviewMessageType.EXPORT_BENCHMARK_SESSION:
          vscode.commands.executeCommand(
            'jarvis-ide.benchmarkExportSession',
            message.benchmarkSessionId
          );
          break;
        case WebviewMessageType.DELETE_BENCHMARK_SESSION:
          vscode.commands.executeCommand(
            'jarvis-ide.benchmarkDeleteSession',
            message.benchmarkSessionId
          );
          break;
        case 'fetch_models':
          handleModelsFetch(message, panel.webview);
          break;
      }
    });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.popoutButtonClicked', openJarvisInNewTab)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.openInNewTab', openJarvisInNewTab)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.settingsButtonClicked', () => {
      //vscode.window.showInformationMessage(message)
      const visibleJarvisProvider = JarvisProvider.getVisibleInstance();
      if (!visibleJarvisProvider) {
        Logger.log('Cannot find any visible Jarvis instances.');
        return;
      }

      visibleJarvisProvider.postMessageToWebview({
        type: 'action',
        action: 'settingsButtonClicked',
      } as ExtensionMessage);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.historyButtonClicked', () => {
      const visibleProvider = JarvisProvider.getVisibleInstance();
      if (!visibleProvider) {
        Logger.log('Cannot find any visible Jarvis instances.');
        return;
      }

      visibleProvider.postMessageToWebview({
        type: 'action',
        action: 'historyButtonClicked',
      } as ExtensionMessage);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.accountButtonClicked', () => {
      const visibleProvider = JarvisProvider.getVisibleInstance();
      if (!visibleProvider) {
        Logger.log('Cannot find any visible Jarvis instances.');
        return;
      }

      visibleProvider.postMessageToWebview({
        type: 'action',
        action: 'accountButtonClicked',
      } as ExtensionMessage);
    })
  );

  /*
	We use the text document content provider API to show the left side for diff view by creating a virtual document for the original content. This makes it readonly so users know to edit the right side if they want to keep their changes.

	- This API allows you to create readonly documents in VSCode from arbitrary sources, and works by claiming an uri-scheme for which your provider then returns text contents. The scheme must be provided when registering a provider and cannot change afterwards.
	- Note how the provider doesn't create uris for virtual documents - its role is to provide contents given such an uri. In return, content providers are wired into the open document logic so that providers are always considered.
	https://code.visualstudio.com/api/extension-guides/virtual-documents
	*/
  const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
      return new TextDecoder().decode(Buffer.from(uri.query, 'base64'));
    }
  })();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider)
  );

  // URI Handler
  const handleUri = async (uri: vscode.Uri) => {
    console.log('URI Handler called with:', {
      path: uri.path,
      query: uri.query,
      scheme: uri.scheme,
    });

    const path = uri.path;
    const query = new URLSearchParams(uri.query.replace(/\+/g, '%2B'));
    const visibleProvider = JarvisProvider.getVisibleInstance();
    if (!visibleProvider) {
      return;
    }
    switch (path) {
      case '/openrouter': {
        const code = query.get('code');
        if (code) {
          await visibleProvider.handleOpenRouterCallback(code);
        }
        break;
      }
      case '/auth': {
        const token = query.get('token');
        const state = query.get('state');
        const apiKey = query.get('apiKey');

        console.log('Auth callback received:', {
          token: token,
          state: state,
          apiKey: apiKey,
        });

        // Validate state parameter
        if (!(await visibleProvider.validateAuthState(state))) {
          vscode.window.showErrorMessage('Invalid auth state');
          return;
        }

        if (token && apiKey) {
          await visibleProvider.handleAuthCallback(token, apiKey);
        }
        break;
      }
      default:
        break;
    }
  };
  context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }));

  // Register size testing commands in development mode
  if (isDevelopmentMode) {
    // Use dynamic import to avoid loading the module in production
    import('./dev/commands/tasks')
      .then((module) => {
        const devTaskCommands = module.registerTaskCommands(context, provider);
        context.subscriptions.push(...devTaskCommands);
        Logger.log('Jarvis dev task commands registered');
      })
      .catch((error) => {
        Logger.log('Failed to register dev task commands: ' + error);
      });
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'jarvis-ide.addToChat',
      async (range?: vscode.Range, diagnostics?: vscode.Diagnostic[]) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        // Use provided range if available, otherwise use current selection
        // (vscode command passes an argument in the first param by default, so we need to ensure it's a Range object)
        const textRange = range instanceof vscode.Range ? range : editor.selection;
        const selectedText = editor.document.getText(textRange);

        if (!selectedText) {
          return;
        }

        // Get the file path and language ID
        const filePath = editor.document.uri.fsPath;
        const languageId = editor.document.languageId;

        // Send to provider
        await provider?.addSelectedCodeToChat(
          selectedText,
          filePath,
          languageId,
          Array.isArray(diagnostics) ? diagnostics : undefined
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.addTerminalOutputToChat', async () => {
      const terminal = vscode.window.activeTerminal;
      if (!terminal) {
        return;
      }

      // Save current clipboard content
      const tempCopyBuffer = await vscode.env.clipboard.readText();

      try {
        // Copy the *existing* terminal selection (without selecting all)
        await vscode.commands.executeCommand('workbench.action.terminal.copySelection');

        // Get copied content
        const terminalContents = (await vscode.env.clipboard.readText()).trim();

        // Restore original clipboard content
        await vscode.env.clipboard.writeText(tempCopyBuffer);

        if (!terminalContents) {
          // No terminal content was copied (either nothing selected or some error)
          return;
        }

        // Send to provider
        await provider?.addSelectedTerminalOutputToChat(terminalContents, terminal.name);
      } catch (error) {
        // Ensure clipboard is restored even if an error occurs
        await vscode.env.clipboard.writeText(tempCopyBuffer);
        console.error('Error getting terminal contents:', error);
        vscode.window.showErrorMessage('Failed to get terminal contents');
      }
    })
  );

  // Register code action provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      '*',
      new (class implements vscode.CodeActionProvider {
        public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

        provideCodeActions(
          document: vscode.TextDocument,
          range: vscode.Range,
          context: vscode.CodeActionContext
        ): vscode.CodeAction[] {
          // Expand range to include surrounding 3 lines
          const expandedRange = new vscode.Range(
            Math.max(0, range.start.line - 3),
            0,
            Math.min(document.lineCount - 1, range.end.line + 3),
            document.lineAt(Math.min(document.lineCount - 1, range.end.line + 3)).text.length
          );

          const addAction = new vscode.CodeAction('Add to Jarvis', vscode.CodeActionKind.QuickFix);
          addAction.command = {
            command: 'jarvis-ide.addToChat',
            title: 'Add to Jarvis',
            arguments: [expandedRange, context.diagnostics],
          };

          const fixAction = new vscode.CodeAction(
            'Fix with Jarvis',
            vscode.CodeActionKind.QuickFix
          );
          fixAction.command = {
            command: 'jarvis-ide.fixWithJarvis',
            title: 'Fix with Jarvis',
            arguments: [expandedRange, context.diagnostics],
          };

          // Only show actions when there are errors
          if (context.diagnostics.length > 0) {
            return [addAction, fixAction];
          } else {
            return [];
          }
        }
      })(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );

  // Register the command handler
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'jarvis-ide.fixWithJarvis',
      async (range: vscode.Range, diagnostics: vscode.Diagnostic[]) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selectedText = editor.document.getText(range);
        const filePath = editor.document.uri.fsPath;
        const languageId = editor.document.languageId;

        // Send to provider with diagnostics
        await provider?.fixWithJarvis(selectedText, filePath, languageId, diagnostics);
      }
    )
  );

  // Registra il comando per cambiare il livello di log
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.setLogLevel', async () => {
      const levels = Object.keys(LogLevel).filter((key) => isNaN(Number(key)));
      const selectedLevel = await vscode.window.showQuickPick(levels, {
        placeHolder: 'Seleziona livello di log',
      });

      if (selectedLevel) {
        const config = vscode.workspace.getConfiguration('jarvis-ide');
        await config.update('logLevel', selectedLevel.toLowerCase(), true);
        setLogLevel(LogLevel[selectedLevel as keyof typeof LogLevel]);
        logger.info(`Livello di log impostato a: ${selectedLevel}`);
      }
    })
  );

  // Registra il comando per esportare il log
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.exportLogFile', exportCurrentLog)
  );

  // Registra il comando per aprire la cartella dei log
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.openLogFolder', openLogDirectory)
  );

  // Registra i comandi per le operazioni sui file
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis-ide.readFile', async (filePath: string) => {
      try {
        if (!provider) {
          throw new Error('Provider non inizializzato');
        }
        const content = await provider.readFile(filePath);
        return content;
      } catch (error) {
        logger.error(`Errore nella lettura del file: ${error}`);
        throw error;
      }
    }),

    vscode.commands.registerCommand(
      'jarvis-ide.editFile',
      async (filePath: string, newContent: string) => {
        try {
          if (!provider) {
            throw new Error('Provider non inizializzato');
          }
          await provider.editFile(filePath, newContent);
        } catch (error) {
          logger.error(`Errore nella modifica del file: ${error}`);
          throw error;
        }
      }
    ),

    vscode.commands.registerCommand(
      'jarvis-ide.createFile',
      async (filePath: string, content: string) => {
        try {
          if (!provider) {
            throw new Error('Provider non inizializzato');
          }
          await provider.createFile(filePath, content);
        } catch (error) {
          logger.error(`Errore nella creazione del file: ${error}`);
          throw error;
        }
      }
    ),

    vscode.commands.registerCommand('jarvis-ide.deleteFile', async (filePath: string) => {
      try {
        if (!provider) {
          throw new Error('Provider non inizializzato');
        }
        await provider.deleteFile(filePath);
      } catch (error) {
        logger.error(`Errore nell'eliminazione del file: ${error}`);
        throw error;
      }
    }),

    vscode.commands.registerCommand('jarvis-ide.listFiles', async (dirPath?: string) => {
      try {
        if (!provider) {
          throw new Error('Provider non inizializzato');
        }
        const files = await provider.listFiles(dirPath);
        return files;
      } catch (error) {
        logger.error(`Errore nella lista dei file: ${error}`);
        throw error;
      }
    }),

    vscode.commands.registerCommand('jarvis-ide.listFilesRecursive', async (dirPath?: string) => {
      try {
        if (!provider) {
          throw new Error('Provider non inizializzato');
        }
        const files = await provider.listFilesRecursive(dirPath);
        return files;
      } catch (error) {
        logger.error(`Errore nella lista ricorsiva dei file: ${error}`);
        throw error;
      }
    })
  );

  // Inizializza il sistema MAS
  initializeMAS(context);

  // Inizializza il provider per il refactoring overlay
  const refactorOverlayProvider = new RefactorOverlayProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RefactorOverlayProvider.viewType,
      refactorOverlayProvider
    )
  );

  return createJarvisAPI(outputChannel, provider);
}

// This method is called when your extension is deactivated
export function deactivate() {
  telemetryService?.shutdown();
  Logger.log('Jarvis IDE extension deactivated');

  // Termina il sistema MAS
  terminateAgents();
}

// TODO: Find a solution for automatically removing DEV related content from production builds.
//  This type of code is fine in production to keep. We just will want to remove it from production builds
//  to bring down built asset sizes.
//
// This is a workaround to reload the extension when the source code changes
// since vscode doesn't support hot reload for extensions
const { IS_DEV, DEV_WORKSPACE_FOLDER } = process.env;

if (IS_DEV && IS_DEV !== 'false') {
  assert(DEV_WORKSPACE_FOLDER, 'DEV_WORKSPACE_FOLDER must be set in development');
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(DEV_WORKSPACE_FOLDER, 'src/**/*')
  );

  watcher.onDidChange(({ scheme, path }) => {
    console.info(`${scheme} ${path} changed. Reloading VSCode...`);

    vscode.commands.executeCommand('workbench.action.reloadWindow');
  });
}

/**
 * Inizializza il sistema Multi-Agent
 * @param context Contesto dell'estensione VS Code
 */
function initializeMAS(context: vscode.ExtensionContext) {
  // Inizializza gli agenti
  initializeAgents();

  // Registra i comandi relativi al MAS
  registerMASCommands(context);

  console.log('Jarvis MAS system initialized');
}

/**
 * Registra i comandi relativi al MAS
 */
function registerMASCommands(context: vscode.ExtensionContext) {
  // Comando per ottenere lo stato del sistema MAS
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis.mas.status', () => {
      const status = commandCenter.getSystemStatus();
      vscode.window.showInformationMessage(`MAS Status: ${JSON.stringify(status)}`);
    })
  );

  // Comando per creare un nuovo task
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis.mas.createTask', async () => {
      const title = await vscode.window.showInputBox({
        placeHolder: 'Titolo del task',
        prompt: 'Inserisci un titolo per il nuovo task',
      });

      if (!title) {
        return;
      }

      const description = await vscode.window.showInputBox({
        placeHolder: 'Descrizione del task',
        prompt: 'Inserisci una descrizione per il nuovo task',
      });

      if (!description) {
        return;
      }

      // Invia il comando al Command Center
      commandCenter.sendCommand({
        type: 'create-task',
        payload: {
          title,
          description,
          requestId: `ui-request-${Date.now()}`,
        },
        source: 'vscode-ui',
        target: '', // Il Command Center saprà a quale agente inoltrare il comando
        priority: 1,
      });

      vscode.window.showInformationMessage(`Task "${title}" creato con successo`);
    })
  );
}
