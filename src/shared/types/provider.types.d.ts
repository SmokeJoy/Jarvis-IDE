import * as vscode from 'vscode';
import { ChatSettings, AutoApprovalSettings, BrowserSettings } from './user-settings.types';
import { ApiConfiguration } from './api.types';
import { AgentStatus, PriorityLevel } from './mas.types';
import { WebviewMessage } from './webview.types';
import { Platform } from '../ExtensionMessage';
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
  context: vscode.ExtensionContext;
  postMessageToWebview(message: WebviewMessage<any>): Promise<void>;
  getStateToPostToWebview(): Promise<ExtensionState>;
  postStateToWebview(): Promise<void>;
  readFile(filePath: string): Promise<string>;
  editFile(filePath: string, newContent: string): Promise<void>;
  createFile(filePath: string, content: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(dirPath?: string): Promise<string[]>;
  listFilesRecursive(dirPath?: string): Promise<string[]>;
  getAvailableModels(): Promise<ConfigModelInfo[]>;
  switchToProvider(provider: string, modelId?: string): void;
  updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]>;
  dispose(): Promise<void>;
}
/**
 * Stati possibili dell'agente
 */
export declare enum AgentMode {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  BUSY = 'busy',
  ERROR = 'error',
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
  queueInstruction(
    agentId: string,
    instruction: string,
    style?: string,
    priority?: PriorityLevel
  ): unknown;
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
//# sourceMappingURL=provider.types.d.ts.map
