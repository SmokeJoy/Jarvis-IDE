// Importazioni necessarie
import * as vscode from "vscode";
import type { ChatSettings, AutoApprovalSettings, BrowserSettings } from "./user-settings.types.js.js";
import type { ApiConfiguration, OpenAiCompatibleModelInfo, LLMProviderId } from "./api.types.js.js";
import type { AgentStatus, PriorityLevel, TaskQueueState } from "./mas.types.js.js";
import { ChatContent } from "../ChatContent.js.js";
import type { WebviewMessage } from "./webview.types.js.js";
import type { Platform } from "../ExtensionMessage.js.js";

/**
 * Definizione esplicita dell'interfaccia ExtensionState
 * per evitare riferimenti circolari
 */
export interface ExtensionState {
  apiConfiguration?: ApiConfiguration;
  autoApprovalSettings: AutoApprovalSettings;
  browserSettings: BrowserSettings;
  chatSettings: ChatSettings;
  checkpointTrackerErrorMessage?: string;
  jarvisMessages: any[];
  currentTaskItem?: any;
  customInstructions?: string;
  mcpMarketplaceEnabled?: boolean;
  planActSeparateModelsSetting: boolean;
  platform: Platform;
  shouldShowAnnouncement: boolean;
  taskHistory: any[];
  telemetrySetting: TelemetrySetting;
  uriScheme?: string;
  userInfo?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
  version: string;
  vscMachineId: string;
  use_docs: boolean;
  contextPrompt: string;
  coder_mode: boolean;
}

/**
 * Interfaccia principale per il provider Jarvis
 */
export interface IJarvisProvider {
  // Proprietà essenziali
  context: vscode.ExtensionContext;
  
  // Metodi per comunicazione WebView
  postMessageToWebview(message: WebviewMessage<any>): Promise<void>;
  
  // Gestione stato
  getStateToPostToWebview(): Promise<ExtensionState>;
  postStateToWebview(): Promise<void>;
  
  // Gestione file
  readFile(filePath: string): Promise<string>;
  editFile(filePath: string, newContent: string): Promise<void>;
  createFile(filePath: string, content: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(dirPath?: string): Promise<string[]>;
  listFilesRecursive(dirPath?: string): Promise<string[]>;
  
  // Gestione API e configurazione
  getAvailableModels(): Promise<ConfigModelInfo[]>;
  switchToProvider(provider: string, modelId?: string): void;
  
  // Gestione history
  updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]>;
  
  // Metodi del ciclo di vita
  dispose(): Promise<void>;
}

/**
 * Stati possibili dell'agente
 */
export enum AgentMode {
  INACTIVE = "inactive",
  ACTIVE = "active",
  BUSY = "busy",
  ERROR = "error"
}

/**
 * Configurazione dell'agente
 */
export interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * Estensione dell'interfaccia ChatSettings standard
 */
export interface ExtendedChatSettings extends ChatSettings {
  separateMode: boolean;
  planning?: {
    provider: string;
    modelId: string;
    vsCodeLmModelSelector?: string;
    thinkingBudgetTokens?: number;
  };
  thinkingBudgetTokens?: number;
}

/**
 * Impostazioni per Jarvis
 */
export interface JarvisSettings {
  apiKeys: string[];
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  history: unknown[];
  recentFiles: string[];
  recentFolders: string[];
  useTelemetry: boolean;
  use_docs?: boolean;
  contextPrompt?: string;
  coder_mode?: boolean;
  multi_agent: boolean;
  selectedModel?: string;
  apiConfiguration?: ApiConfiguration;
  telemetrySetting?: TelemetrySetting;
  customInstructions?: string;
  planActSeparateModelsSetting?: boolean;
}

/**
 * Interfaccia per SupervisorAgent
 */
export interface SupervisorAgent {
  getAllAgentsStatus(): AgentStatus[];
  getAgentStatus(agentId: string): AgentStatus | undefined;
  queueInstruction(agentId: string, instruction: string, style?: string, priority?: PriorityLevel): unknown;
  sendMessage(message: unknown): void;
  on(event: string, listener: (data: unknown) => void): void;
}

/**
 * Informazioni sui modelli di configurazione
 */
export interface ConfigModelInfo {
  id: string;
  name: string;
  contextLength: number;
  provider: string;
  maxTokens?: number;
  contextWindow?: number;
  supportsImages?: boolean;
  supportsPromptCache?: boolean;
  inputPrice?: number;
  outputPrice?: number;
  description?: string;
}

/**
 * Impostazioni telemetria
 */
export interface TelemetrySetting {
  enabled: boolean;
}

/**
 * Item di cronologia
 */
export interface HistoryItem {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  model?: string;
  provider?: string;
}

/**
 * Tipo per le chiavi di stato globale
 */
export type GlobalStateKey = string;

/**
 * Tipo per le chiavi segrete
 */
export type SecretKey = string; 