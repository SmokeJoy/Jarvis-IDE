/**
 * @file ExtensionMessage.ts
 * @description Import/export verso l'interfaccia centralizzata WebView
 * @deprecated Utilizzare le interfacce definite in shared/types/webview.types.ts
 */

// Importa tutte le definizioni centralizzate dal file webview.types.ts
import {
  WebviewMessage,
  WebviewMessageType,
  ActionType,
  InvokeType,
  Message,
  BaseMessage,
} from './types/webview.types';

// Importa l'implementazione delle funzioni
import {
  isExtensionMessage,
  isWebviewMessage,
  convertToWebviewMessage,
  castAs,
} from './types/webview.types';

// Importa ExtensionState da provider.types.ts per evitare import circolari
import { ExtensionState } from './types/provider.types';

// Ri-esporta le interfacce principali per retrocompatibilità
export type { WebviewMessage };
export { WebviewMessageType };
export type { ActionType, InvokeType, Message, BaseMessage };
export { isExtensionMessage, isWebviewMessage, convertToWebviewMessage, castAs };

// Ri-esporta le interfacce di stato per retrocompatibilità
export type { ExtensionState };

// Ri-esporta Platform per retrocompatibilità
export const DEFAULT_PLATFORM = 'unknown';
export type Platform =
  | 'aix'
  | 'darwin'
  | 'freebsd'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'unknown';

// Importa i tipi necessari per RetroCompatibilità
import { GitCommit } from '../utils/git';
import { ApiConfiguration, OpenAiCompatibleModelInfo, ModelInfo } from '../src/shared/types/api.types';
import { AutoApprovalSettings } from './AutoApprovalSettings';
import { BrowserSettings } from './BrowserSettings';
import { ChatSettings } from './ChatSettings';
import { HistoryItem } from './HistoryItem';
import { McpServer, McpMarketplaceCatalog, McpMarketplaceItem, McpDownloadResponse } from './mcp';
import { TelemetrySetting } from './types';
import { BalanceResponse, UsageTransaction, PaymentTransaction } from './JarvisAccount';
import { ChatMessage } from './types';
import { LogLevel } from '../utils/logger';

/**
 * Import da webview.types.ts che sostituisce questa definizione
 * @deprecated Usare ExtensionMessage da webview.types.ts
 */
export interface ExtensionMessage {
  // Definizione mantenuta per retrocompatibilità
  type:
    | 'action'
    | 'state'
    | 'selectedImages'
    | 'ollamaModels'
    | 'lmStudioModels'
    | 'theme'
    | 'workspaceUpdated'
    | 'invoke'
    | 'partialMessage'
    | 'openRouterModels'
    | 'openAiModels'
    | 'mcpServers'
    | 'relinquishControl'
    | 'vsCodeLmModels'
    | 'requestVsCodeLmModels'
    | 'authCallback'
    | 'mcpMarketplaceCatalog'
    | 'mcpDownloadDetails'
    | 'commitSearchResults'
    | 'openGraphData'
    | 'isImageUrlResult'
    | 'didUpdateSettings'
    | 'userCreditsBalance'
    | 'userCreditsUsage'
    | 'userCreditsPayments'
    | 'totalTasksSize'
    | 'addToInput'
    | 'message'
    | 'error'
    | 'response'
    | 'chatHistoryLoaded'
    | 'chatHistoryCleared'
    | 'log.update'
    | 'log.export'
    | 'log.openFolder'
    | 'settings'
    | 'instructionReceived'
    | 'instructionCompleted'
    | 'instructionFailed'
    | 'agentsStatusUpdate'
    | 'taskQueueUpdate'
    | 'api.configuration';
  // Campi opzionali
  text?: string;
  action?:
    | 'chatButtonClicked'
    | 'mcpButtonClicked'
    | 'settingsButtonClicked'
    | 'historyButtonClicked'
    | 'didBecomeVisible'
    | 'accountLoginClicked'
    | 'accountLogoutClicked'
    | 'accountButtonClicked';
  invoke?: Invoke;
  state?: ExtensionState;
  images?: string[];
  ollamaModels?: string[];
  lmStudioModels?: string[];
  vsCodeLmModels?: { vendor?: string; family?: string; version?: string; id?: string }[];
  filePaths?: string[];
  partialMessage?: JarvisMessage;
  openRouterModels?: Record<string, ModelInfo>;
  openAiModels?: string[];
  mcpServers?: McpServer[];
  customToken?: string;
  mcpMarketplaceCatalog?: McpMarketplaceCatalog;
  error?: string;
  mcpDownloadDetails?: McpDownloadResponse;
  commits?: GitCommit[];
  openGraphData?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    type?: string;
  };
  url?: string;
  isImage?: boolean;
  userCreditsBalance?: BalanceResponse;
  userCreditsUsage?: UsageTransaction[];
  userCreditsPayments?: PaymentTransaction[];
  totalTasksSize?: number | null;
  message?: ChatMessage;
  messages?: ChatMessage[];
  logEntry?: {
    timestamp: string;
    level: keyof typeof LogLevel;
    message: string;
  };
  payload?: any;
}

export type Invoke = 'sendMessage' | 'primaryButtonClick' | 'secondaryButtonClick';

export interface JarvisMessage {
  ts: number;
  type: 'ask' | 'say';
  ask?: JarvisAsk;
  say?: JarvisSay;
  text?: string;
  reasoning?: string;
  images?: string[];
  partial?: boolean;
  lastCheckpointHash?: string;
  isCheckpointCheckedOut?: boolean;
  conversationHistoryIndex?: number;
  conversationHistoryDeletedRange?: [number, number]; // for when conversation history is truncated for API requests
}

export type JarvisAsk =
  | 'followup'
  | 'plan_mode_respond'
  | 'command'
  | 'command_output'
  | 'completion_result'
  | 'tool'
  | 'api_req_failed'
  | 'resume_task'
  | 'resume_completed_task'
  | 'mistake_limit_reached'
  | 'auto_approval_max_req_reached'
  | 'browser_action_launch'
  | 'use_mcp_server';

export type JarvisSay =
  | 'task'
  | 'error'
  | 'api_req_started'
  | 'api_req_finished'
  | 'text'
  | 'reasoning'
  | 'completion_result'
  | 'user_feedback'
  | 'user_feedback_diff'
  | 'api_req_retried'
  | 'command'
  | 'command_output'
  | 'tool'
  | 'shell_integration_warning'
  | 'browser_action_launch'
  | 'browser_action'
  | 'browser_action_result'
  | 'mcp_server_request_started'
  | 'mcp_server_response'
  | 'use_mcp_server'
  | 'diff_error'
  | 'deleted_api_reqs'
  | 'jarvisignore_error'
  | 'checkpoint_created';

export interface JarvisSayTool {
  tool:
    | 'editedExistingFile'
    | 'newFileCreated'
    | 'readFile'
    | 'listFilesTopLevel'
    | 'listFilesRecursive'
    | 'listCodeDefinitionNames'
    | 'searchFiles';
  path?: string;
  diff?: string;
  content?: string;
  regex?: string;
  filePattern?: string;
}

export const browserActions = [
  'navigateTo',
  'click',
  'input',
  'goBack',
  'goForward',
  'scrollDown',
  'scrollUp',
  'takeScreenshot',
] as const;

export type BrowserAction = (typeof browserActions)[number];

export interface JarvisSayBrowserAction {
  action: BrowserAction;
  coordinate?: string;
  text?: string;
}

export type BrowserActionResult = {
  screenshot?: string;
  logs?: string;
  currentUrl?: string;
  currentMousePosition?: string;
};

export interface JarvisAskUseMcpServer {
  serverName: string;
  type: 'use_mcp_tool' | 'access_mcp_resource';
  toolName?: string;
  arguments?: string;
  uri?: string;
}

export interface JarvisPlanModeResponse {
  response: string;
  options?: string[];
  selected?: string;
}

export interface JarvisAskQuestion {
  question: string;
  options?: string[];
  selected?: string;
}

export interface JarvisApiReqInfo {
  request?: string;
  tokensIn?: number;
  tokensOut?: number;
  cacheWrites?: number;
  cacheReads?: number;
  cost?: number;
  cancelReason?: JarvisApiReqCancelReason;
  streamingFailedMessage?: string;
}

export type JarvisApiReqCancelReason = 'streaming_failed' | 'user_cancelled';

export const COMPLETION_RESULT_CHANGES_FLAG = 'HAS_CHANGES';

/**
 * Definizioni dei tipi per i messaggi inviati dall'estensione alla WebView
 */

/**
 * Interfaccia di base per tutti i messaggi dell'estensione
 */
export interface ExtensionMessageBase {
  type: string;
  payload?: unknown;
}

/**
 * Risposta a una richiesta del modello
 */
export interface ResponseMessage extends ExtensionMessageBase {
  type: 'response';
  payload: {
    text: string;
    messageId?: string;
    isComplete?: boolean;
    wasError?: boolean;
  };
}

/**
 * Progresso di una richiesta in corso
 */
export interface RequestProgressMessage extends ExtensionMessageBase {
  type: 'requestProgress';
  payload: {
    progress: number;
    message?: string;
  };
}

/**
 * Invio delle impostazioni attuali
 */
export interface SettingsMessage extends ExtensionMessageBase {
  type: 'settings';
  payload: {
    apiKey?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    [key: string]: unknown;
  };
}

/**
 * Segnalazione di errore
 */
export interface ErrorMessage extends ExtensionMessageBase {
  type: 'error';
  payload: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Dati di telemetria
 */
export interface TelemetryMessage extends ExtensionMessageBase {
  type: 'telemetry';
  payload: {
    event: string;
    data?: Record<string, unknown>;
  };
}

/**
 * Lista dei modelli disponibili
 */
export interface ModelListMessage extends ExtensionMessageBase {
  type: 'modelList';
  payload: {
    models: Array<{
      id: string;
      name: string;
      provider: string;
      contextSize?: number;
    }>;
    selected?: string;
  };
}

/**
 * File di contesto disponibili
 */
export interface ContextFilesMessage extends ExtensionMessageBase {
  type: 'contextFiles';
  payload: {
    files: string[];
  };
}

/**
 * Cronologia della chat
 */
export interface ChatHistoryMessage extends ExtensionMessageBase {
  type: 'chatHistory';
  payload: {
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      id?: string;
      timestamp?: number;
    }>;
    sessionId?: string;
  };
}

/**
 * Conferma reset chiave API
 */
export interface ApiKeyResetMessage extends ExtensionMessageBase {
  type: 'apiKeyReset';
  payload?: {
    success: boolean;
  };
}

/**
 * Risultato dell'esportazione
 */
export interface ExportResultMessage extends ExtensionMessageBase {
  type: 'exportResult';
  payload: {
    success: boolean;
    path?: string;
    message?: string;
  };
}

/**
 * Risultato dell'esecuzione di un comando
 */
export interface CommandResultMessage extends ExtensionMessageBase {
  type: 'commandResult';
  payload: {
    command: string;
    success: boolean;
    result?: unknown;
    error?: string;
  };
}

/**
 * Notifica visibile all'utente
 */
export interface NotificationMessage extends ExtensionMessageBase {
  type: 'notification';
  payload: {
    message: string;
    type: 'info' | 'warning' | 'error';
    duration?: number;
  };
}

/**
 * Tipo unione che rappresenta tutti i possibili messaggi dell'estensione
 */
export type ExtensionMessage =
  | ResponseMessage
  | RequestProgressMessage
  | SettingsMessage
  | ErrorMessage
  | TelemetryMessage
  | ModelListMessage
  | ContextFilesMessage
  | ChatHistoryMessage
  | ApiKeyResetMessage
  | ExportResultMessage
  | CommandResultMessage
  | NotificationMessage;
