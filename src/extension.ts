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
import { TelemetryService } from './services/TelemetryService';
import * as path from 'path';
import { registerSystemPromptCommands } from './commands/systemPrompt';
import { registerAgentCommands } from './commands/agentCommands';
import { registerExportCommands } from './commands/exportCommands';
import { LLMProviderId, ModelInfo } from '@shared/types/api.types';
import { LogLevel } from '@shared/types/global';
import { isDevelopmentMode } from './utils/environment';
import { WebviewMessage, ExtensionMessage, castAs } from '@shared/ExtensionMessage';
import { commandCenter } from './core/command-center';
import { initializeAgents, terminateAgents } from './core/mas/agents';
import { SettingsManager } from './services/settings/SettingsManager';
import { JarvisAPI } from './api/JarvisAPI';
import { Settings, SettingsManager as ISettingsManager, PromptProfile } from '@shared/types/settings.types';
import { RefactorOverlayProvider } from './integrations/refactor/RefactorOverlayProvider';
import { handleWebviewMessage } from './webview/WebviewMessageHandler';
import { ChatMessage } from '@shared/types/chat.types';
import { ExtensionManager } from './extension/ExtensionManager';
import { WebviewManager } from './extension/WebviewManager';
import { LLMManager } from './extension/LLMManager';
import { ConfigManager } from './extension/ConfigManager';
import { LogManager } from './extension/LogManager';
import { PromptProfilesSchema } from '@shared/schemas/PromptProfilesSchema';
import { z } from 'zod';

// Inizializzazione logger
const logger = new Logger('Extension');

// Definizione della modalità sviluppo
const isDevelopment = isDevelopmentMode();

// Interfacce per i moduli dinamici
interface ChatHistoryModule {
  saveChatMessage: (message: ChatMessage) => Promise<void>;
  loadChatHistory: () => Promise<ChatMessage[]>;
  clearChatHistory: () => Promise<void>;
}

interface ModelLoaderModule {
  loadModels: () => Promise<ModelInfo[]>;
}

interface SettingsManagerClass extends ISettingsManager {
  getInstance: () => SettingsManagerClass;
  getPromptProfiles: () => Promise<PromptProfile[]>;
}

interface ExportChatModule {
  exportChatToMarkdown: (messages: ChatMessage[]) => Promise<string>;
}

interface ExportsModule {
  createJarvisAPI: () => Promise<JarvisAPI>;
}

// Predichiarazioni di variabili per importazioni dinamiche
let exportChatToMarkdown: ExportChatModule['exportChatToMarkdown'];
let createJarvisAPI: ExportsModule['createJarvisAPI'];

// Importazione dei moduli a runtime
async function loadDynamicModules() {
  try {
    const exportChatModule = await import('./utils/exportChat');
    exportChatToMarkdown = exportChatModule.exportChatToMarkdown;

    const exportsModule = await import('./exports');
    createJarvisAPI = exportsModule.createJarvisAPI;

    logger.info('Moduli dinamici caricati con successo');
  } catch (error) {
    logger.error('Errore nel caricamento dei moduli dinamici', error as Error);
  }
}

function setLogLevel(level: LogLevel) {
  logger.setLevel(level);
}

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

const SaveSettingsSchema = z.object({
  apiConfiguration: z.object({
    provider: z.string(),
    apiKey: z.string(),
    modelId: z.string(),
    baseUrl: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
  }).optional(),
  telemetryEnabled: z.boolean().optional(),
  customInstructions: z.string().optional(),
  contextPrompt: z.union([z.string(), z.record(z.unknown())]).optional(),
  planActSeparateModelsSetting: z.boolean().optional(),
});

async function handleSettingsUpdate(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  try {
    // Valida il payload con Zod
    const result = SaveSettingsSchema.safeParse(message.payload);
    if (!result.success) {
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'error',
          message: 'Payload delle impostazioni non valido',
        })
      );
      return;
    }
    const payload = result.data;
    // Ottieni il SettingsManager
    const settingsManager = SettingsManager.getInstance();
    // Recupera le impostazioni correnti
    const currentSettings = settingsManager.getSettings();
    // Aggiorna le impostazioni con quelle ricevute dal messaggio
    if (payload) {
      if (payload.contextPrompt !== undefined) {
        if (typeof payload.contextPrompt === 'object') {
          currentSettings['contextPrompt'] = JSON.stringify(payload.contextPrompt);
        } else {
          currentSettings['contextPrompt'] = payload.contextPrompt;
        }
      }
      if (payload.apiConfiguration) {
        currentSettings['apiConfiguration'] = payload.apiConfiguration;
      }
      if (payload.telemetryEnabled !== undefined) {
        currentSettings['telemetrySetting'] = {
          enabled: !!payload.telemetryEnabled,
        };
      }
      if (payload.customInstructions !== undefined) {
        currentSettings['customInstructions'] = payload.customInstructions;
      }
      await settingsManager.updateSettings(currentSettings);
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'settingsSaved',
          id: message.id,
        })
      );
      console.log('Impostazioni salvate:', currentSettings);
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento delle impostazioni:", error);
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
    const settingsManager = SettingsManager.getInstance();

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
    const settingsManager = SettingsManager.getInstance();

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
    const result = PromptProfilesSchema.safeParse(message.payload);
    if (!result.success) {
      throw new Error('Payload del profilo non valido');
    }
    const { profiles } = result.data;
    if (!profiles || !profiles[0]) {
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'error',
          error: 'Nessun profilo valido fornito',
        })
      );
      return;
    }
    const settingsManager = SettingsManager.getInstance();
    const newProfile = await settingsManager.createPromptProfile(profiles[0]);
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
    const result = z.object({ profileId: z.string(), profile: z.any() }).safeParse(message.payload);
    if (!result.success) {
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'error',
          error: 'Payload non valido per aggiornamento profilo',
        })
      );
      return;
    }
    const { profileId, profile } = result.data;
    // Ottieni il SettingsManager
    const settingsManager = SettingsManager.getInstance();
    // Aggiorna il profilo esistente
    const updatedProfile = await settingsManager.updatePromptProfile(profileId, profile);
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
    const result = z.object({ profileId: z.string() }).safeParse(message.payload);
    if (!result.success) {
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'error',
          error: 'Payload non valido per eliminazione profilo',
        })
      );
      return;
    }
    const { profileId } = result.data;
    // Ottieni il SettingsManager
    const settingsManager = SettingsManager.getInstance();
    // Elimina il profilo
    await settingsManager.deletePromptProfile(profileId);
    // Ottieni i profili rimanenti dopo l'eliminazione
    const remainingProfiles = settingsManager.getPromptProfiles();
    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileDeleted',
        profileId,
        profiles: remainingProfiles,
      })
    );
    console.log('Profilo di prompt eliminato, ID:', profileId);
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
    const result = z.object({ profileId: z.string() }).safeParse(message.payload);
    if (!result.success) {
      panel.webview.postMessage(
        castAs<ExtensionMessage>({
          type: 'error',
          error: 'Payload non valido per cambio profilo',
        })
      );
      return;
    }
    const { profileId } = result.data;
    // Ottieni il SettingsManager
    const settingsManager = SettingsManager.getInstance();
    // Imposta il profilo attivo
    const activeProfile = await settingsManager.setActivePromptProfile(profileId);
    // Ottieni tutti i profili dopo lo switch
    const allProfiles = settingsManager.getPromptProfiles();
    // Invia conferma alla webview
    panel.webview.postMessage(
      castAs<ExtensionMessage>({
        type: 'promptProfileSwitched',
        profileId,
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

let extensionManager: ExtensionManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
    try {
        // Initialize managers
        const configManager = new ConfigManager(context);
        const logManager = new LogManager(context);
        const llmManager = new LLMManager(context, configManager);
        const webviewManager = new WebviewManager(context);

        // Create and initialize the extension manager
        extensionManager = new ExtensionManager(
            context,
            configManager,
            logManager,
            llmManager,
            webviewManager
        );

        await extensionManager.initialize();

        // Register commands
        const startCommand = vscode.commands.registerCommand('jarvis-ide.start', () => {
            extensionManager?.start();
        });

        const stopCommand = vscode.commands.registerCommand('jarvis-ide.stop', () => {
            extensionManager?.stop();
        });

        context.subscriptions.push(startCommand, stopCommand);

        // Log successful activation
        logManager.info('Jarvis IDE activated successfully');
      } catch (error) {
        // Log any activation errors
        console.error('Failed to activate Jarvis IDE:', error);
        vscode.window.showErrorMessage('Failed to activate Jarvis IDE. Check the logs for details.');
    }
}

export function deactivate() {
    if (extensionManager) {
        extensionManager.dispose();
        extensionManager = undefined;
    }
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
