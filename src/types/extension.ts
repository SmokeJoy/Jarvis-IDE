import type { ChatCompletionMessageParam } from "../types/provider-types/openai-types.js"
import type { ApiConfiguration } from "./global.js"
import type { 
  AnthropicContentBlock, 
  AnthropicTextBlock, 
  AnthropicImageBlock, 
  AnthropicToolUseBlock, 
  AnthropicToolResultBlock,
  AnthropicMessage
} from "./provider-types/anthropic-types.js"
import type { WebviewMessage } from '../shared/types/webview.types.js'
import type { ConfigModelInfo } from './models.js'

export type ContentBlock = AnthropicContentBlock
export type TextBlock = AnthropicTextBlock
export type ImageBlock = AnthropicContentBlock & { type: "image" }
export type ToolBlock = AnthropicContentBlock & { type: "tool_use" | "tool_result" }

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  maxTokens?: number;
  temperature?: number;
}

// Utilizzo un tipo esteso non in conflitto
export interface ExtendedApiConfig {
  // Proprietà di base
  provider: string;
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Proprietà estese
  openRouterApiKey?: string;
  selectedModelId?: string;
  selectedModel: string;
  modelInfo?: ConfigModelInfo;
  thinkingBudgetMs: number;
}

export interface OpenAiCompatibleModelInfo {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  pricePer1kTokens: number;
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: number;
  streaming?: boolean;
  id: string;
}

export interface ToolResponse {
  text: string;
}

export interface UserContent {
  type: string;
  text?: string;
  image_url?: string;
}

export interface ApiMessage {
  role: string;
  content: UserContent[];
}

// Consolido i MessageParam in un tipo unione
export type AnthropicMessageParam = AnthropicMessage;
export type StandardMessageParam = {
  role?: "system" | "user" | "assistant" | "function" | "tool";
  content?: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
};

export type ContentBlockParam = ContentBlock
export type TextBlockParam = TextBlock
export type ImageBlockParam = AnthropicImageBlock
export type ToolResultBlockParam = AnthropicToolResultBlock
export type Messages = AnthropicMessage[]

// Interfaccia base per i messaggi dell'estensione
export interface BasicExtensionMessage {
  type: string;
  payload?: any;
  messageIds?: string[];
  taskId?: string;
}

export interface ExtensionCommand {
  command: string;
  title: string;
  category?: string;
  when?: string;
}

export interface ExtensionConfiguration {
  api: ApiConfiguration;
  telemetry: {
    enabled: boolean;
    apiKey?: string;
  };
  ui: {
    theme: string;
    fontSize: number;
    fontFamily: string;
  };
}

export interface ExtensionState {
  version: string;
  didHydrateState: boolean;
  showWelcome: boolean;
  apiConfiguration: ApiConfiguration;
  availableModels: ConfigModelInfo[];
  selectedModel: string;
  telemetrySetting: TelemetrySetting;
  customInstructions: string;
  systemPrompt?: string;
  systemPromptPath?: string;
}

export interface ExtensionContext {
  extensionPath: string;
  subscriptions: { dispose(): any }[];
  workspaceState: ExtensionState;
  globalState: ExtensionState;
}

export interface Message {
  id?: string;
  role?: string;
  timestamp?: string | number;
  content?: string;
  streamingFinished?: boolean;
  error?: string;
  meta?: any;
}

export interface AgentTask {
  id: string;
  task: string;
  messages: Message[];
  timestamp: number;
  prompt: string;
}

export enum WebviewCommand {
  SEND_MESSAGE = "sendMessage",
  SEND_UPDATED_MESSAGE = "sendUpdatedMessage",
  SET_TASK = "setTask",
  STOP_TASK = "stopTask",
  ABORT_TASK = "abortTask",
  FORCE_REFRESH = "forceRefresh",
  CLEAR_CHAT = "clearChat",
  UPDATE_SETTINGS = "updateSettings",
  EDIT_SYSTEM_PROMPT = "editSystemPrompt",
  SAVE_SYSTEM_PROMPT = "saveSystemPrompt",
  BROWSER_NAVIGATE = "browserNavigate",
  BROWSER_ACTION = "browserAction",
  SEND_BROWSER_URL = "sendBrowserUrl",
  MCP_COMMAND = "mcpCommand",
  OPEN_TASK_HISTORY = "openTaskHistory",
  LOAD_TASK = "loadTask",
  EXPORT_CURRENT_TASK = "exportCurrentTask",
  UPLOAD_IMAGE = "uploadImage",
  REMOVE_IMAGE = "removeImage",
  TOGGLE_THINKING_MODE = "toggleThinkingMode",
  APPROVE_PLAN = "approvePlan",
  REJECT_PLAN = "rejectPlan",
  SET_THINKING_BUDGET = "setThinkingBudget",
  ADD_CUSTOM_MODEL = "addCustomModel",
  LOGIN = "login",
  LOGOUT = "logout",
  TOGGLE_ACCOUNT_ENABLED = "toggleAccountEnabled"
}

export interface MessageHistory {
  messages: Message[];
  isThinking: boolean;
}

export interface WebviewState {
  apiConfiguration?: ApiConfiguration;
  customInstructions?: string;
  autoApprovalSettings?: object;
  telemetryEnabled?: boolean;
  chatHistory?: MessageHistory;
  browserSettings?: object;
  chatSettings?: object;
  userInfo?: object;
  isStreaming?: boolean;
  selectedImages?: string[];
  planActSeparateModelsSetting?: boolean;
}

export type { WebviewMessage }

// Interfaccia dettagliata per i messaggi dell'estensione
export interface DetailedExtensionMessage {
  type: "error" | "message" | "state" | "action" | "response" | "mcpMarketplaceCatalog" | "requestVsCodeLmModels" | "authCallback" | "invoke" | "log.export" | "log.openFolder" | "selectedImages" | "isStreaming" | "mcpServers" | "taskHistory" | "autoApprovalSettings" | "browserSettings" | "chatSettings" | "userInfo" | "settings" | "beginThinking" | "endThinking" | "setThinkingBudget" | "thinkingModeEnabled" | "planData" | "planRequest" | "isAwaitingPlanResponse" | "taskAssistantMessage" | "versionNumber" | "vscode";
  payload?: {
    text?: string;
    role?: string;
    streaming?: boolean;
    error?: string;
    apiConfiguration?: ApiConfiguration;
    telemetryEnabled?: boolean;
    customInstructions?: string;
  };
  messageIds?: string[];
  taskId?: string;
}

export type Message_role = "system" | "user" | "assistant" | "function" | "tool";

export type TelemetrySetting = 'enabled' | 'disabled'; 