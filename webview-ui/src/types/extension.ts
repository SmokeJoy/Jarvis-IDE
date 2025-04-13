import type {
    ChatMessage,
    OpenAiCompatibleModelInfo,
    TelemetrySetting,
    WebviewMessage as UnifiedWebviewMessage
} from '@/shared/types'
import { WebviewMessageType } from '@/shared/WebviewMessageType'
import { Anthropic } from '@anthropic-ai/sdk'
import { ConfigModelInfo } from './models'

declare global {
    interface Window {
        postMessage(message: UnifiedWebviewMessage): void;
        getState(): ExtensionState;
        setState(state: ExtensionState): void;
    }
}

// Utilizziamo direttamente l'enum WebviewMessageType invece di estenderlo
// export type WebviewMessageType = BaseWebviewMessageType | 
//     'silentlyRefreshMcpMarketplace' | 
//     'fetchLatestMcpServersFromHub' | 
//     'openMcpSettings' | 
//     'updateMcpTimeout' | 
//     'restartMcpServer' | 
//     'deleteMcpServer' |
//     'toggleToolAutoApprove' |
//     'toggleMcpServer' |
//     'accountLoginClicked' |
//     'accountLogoutClicked' |
//     'showAccountViewClicked' |
//     'authStateChanged' |
//     'startChat';

/**
 * Type for task history item
 */
export interface TaskHistoryItem {
    id: string;
    task: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    result?: string;
    error?: string;
}

/**
 * Type for MCP server configuration
 */
export interface McpServer {
    id: string;
    name: string;
    url: string;
    status: 'active' | 'inactive';
    lastPing?: number;
}

/**
 * Type for MCP marketplace item
 */
export interface McpMarketplaceItem {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloads: number;
    rating: number;
}

/**
 * Type for auto approval settings
 */
export interface AutoApprovalSetting {
    enabled: boolean;
    timeout: number;
    maxRetries: number;
}

/**
 * Type for browser settings
 */
export interface BrowserSetting {
    name: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
}

/**
 * Type for current task item
 */
export interface CurrentTaskItem {
    id: string;
    task: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    result?: string;
    error?: string;
}

export interface ExtensionState {
    didHydrateState: boolean
    showWelcome: boolean
    shouldShowAnnouncement: boolean
    telemetrySetting: TelemetrySetting
    version: string
    customInstructions: string
    chatSettings: {
        autoApprove: boolean
        setAutoApprove: () => void
        mode: 'chat' | 'plan' | 'act'
    }
    apiConfiguration: ApiConfiguration
    availableModels?: ConfigModelInfo[]
    selectedModel?: string
    openAiModels: OpenAiCompatibleModelInfo[]
    openRouterModels: OpenAiCompatibleModelInfo[]
    vscMachineId: string
    planActSeparateModelsSetting: boolean
    theme: 'light' | 'dark'
    taskHistory: TaskHistoryItem[]
    totalTasksSize: number
    mcpServers: McpServer[]
    mcpMarketplaceEnabled: boolean
    mcpMarketplaceCatalog: McpMarketplaceItem[]
    autoApprovalSettings: Record<string, AutoApprovalSetting>
    uriScheme: string
    jarvisMessages: ChatMessage[]
    currentTaskItem: CurrentTaskItem | null
    checkpointTrackerErrorMessage: string | null
    browserSettings: Record<string, BrowserSetting>
    filePaths: string[]
    platform: string
    chatHistory: ChatMessage[]
    setApiConfiguration: (config: ApiConfiguration) => void
    setTelemetrySetting: (setting: TelemetrySetting) => void
    setCustomInstructions: (instructions: string) => void
    settings: Settings
    logs?: LogEntry[]
    connectionStatus?: 'connected' | 'disconnected' | 'error'
    errorMessage?: string
    coder_mode?: boolean;
    multi_agent?: boolean;
    code_style?: 'standard' | 'concise' | 'verbose';
}

export interface ExtensionMessage {
    type: string
    payload?: unknown
    action?: string
}

// Utilizziamo il tipo centralizzato per la definizione di WebviewMessage
export type WebviewMessage = UnifiedWebviewMessage;

export interface WebviewState {
    isConnected: boolean
    lastError?: string
}

export interface ApiConfiguration {
    provider: string
    apiKey?: string
    modelId?: string
    baseUrl?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
}

export interface ModelInfo {
    id: string
    name: string
    provider: string
    capabilities: string[]
    contextLength: number
    description?: string
    defaultParams?: {
        temperature?: number
        topP?: number
        maxTokens?: number
    }
}

export interface OpenRouterModelInfo extends ModelInfo {
    provider: 'openrouter'
}

export interface McpTool {
    name: string
    description: string
    parameters: Record<string, any>
    autoApprove: boolean
}

export interface Settings {
    use_docs: boolean
    coder_mode: boolean
    contextPrompt: string
    selectedModel: string
    availableModels?: string[]
}

export interface LogEntry {
    timestamp: string
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    message: string
    source?: string
}

export interface ChatHistory {
    id: string
    task: string
    messages: ChatMessage[]
    timestamp: number
    apiConfiguration: ApiConfiguration
}

export interface SystemPromptInfo {
    content: string
    filePath?: string
    lastModified?: number
}

export interface AgentResponse {
    type: 'success' | 'error' | 'progress'
    message: string
    data?: any
}

export type {
    ChatMessage,
    TelemetrySetting,
    Anthropic,
    WebviewMessageType
} 