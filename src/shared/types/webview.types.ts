/**
 * @file webview.types.ts
 * @description Definizione centralizzata di tutti i tipi per la comunicazione WebView in Jarvis IDE
 * Questo file è la fonte di verità per tutti i tipi di messaggi tra estensione e WebView
 * @version 1.0.0
 */

import type { ApiConfiguration, OpenAiCompatibleModelInfo, ModelInfo } from './api.types.js.js';
import { TelemetrySetting } from './telemetry.types.js.js';
import type { BrowserSettings, ChatSettings, AutoApprovalSettings } from './user-settings.types.js.js';
import type { Task, AgentStatus, TaskQueueState } from './mas.types.js.js';
import { ChatContent } from '../ChatContent.js.js';
import { Platform } from '../Platform.js.js';
import { HistoryItem } from '../HistoryItem.js.js';
import type { BaseMessage } from './common.js.js';

// Importo la tipologia di ChatMessage
import type { ChatMessage as ChatMessageImport } from './message.types.js.js';
export type ChatMessage = ChatMessageImport;

/**
 * Tipi di messaggi per la comunicazione bidirezionale
 */

/**
 * Enum per i tipi di messaggi standard
 */
export enum WebviewMessageType {
    // Operazioni di base
    GET_STATE = "getState",
    SET_STATE = "setState",
    SEND_PROMPT = "sendPrompt",
    
    // Operazioni sulla chat
    LOAD_CHAT_HISTORY = "loadChatHistory",
    CLEAR_CHAT_HISTORY = "clearChatHistory",
    EXPORT_CHAT_HISTORY = "exportChatHistory",
    CHAT_RESPONSE = "chatResponse",
    
    // Operazioni sui prompt di sistema
    GET_SYSTEM_PROMPT = "getSystemPrompt",
    SAVE_SYSTEM_PROMPT = "saveSystemPrompt",
    
    // Operazioni sulle impostazioni
    SAVE_SETTINGS = "saveSettings",
    RESET_SETTINGS = "resetSettings",
    EXPORT_SETTINGS = "exportSettings",
    IMPORT_SETTINGS = "importSettings",
    GET_SETTINGS = "getSettings",
    UPDATE_SETTINGS = "updateSettings",
    UPDATE_SETTING = "updateSetting",
    
    // Operazioni con immagini
    SELECT_IMAGES = "selectImages",
    
    // Benchmark
    GET_BENCHMARK_SESSIONS = "getBenchmarkSessions",
    GET_BENCHMARK_SESSION = "getBenchmarkSession",
    GET_BENCHMARK_STATS = "getBenchmarkStats",
    GET_BENCHMARK_TIMELINE = "getBenchmarkTimeline",
    EXPORT_BENCHMARK_SESSION = "exportBenchmarkSession",
    DELETE_BENCHMARK_SESSION = "deleteBenchmarkSession",
    
    // Risposte
    RESPONSE = "response",
    STATE_UPDATE = "stateUpdate",
    ERROR = "error",
    SHOW_ERROR_MESSAGE = "showErrorMessage",
    
    // Azioni UI
    ACTION = "action",
    
    // Log
    LOG_EXPORT = "log.export",
    LOG_OPEN_FOLDER = "log.openFolder",
    
    // Comunicazione con gli agenti
    RUN_AGENT = "runAgent",
    ANALYZE_FILE = "analyzeFile",
    INSTRUCTION_RECEIVED = "instructionReceived",
    INSTRUCTION_COMPLETED = "instructionCompleted",
    INSTRUCTION_FAILED = "instructionFailed",
    AGENTS_STATUS_UPDATE = "agentsStatusUpdate",
    TASK_QUEUE_UPDATE = "taskQueueUpdate",
    
    // Configurazione API
    API_CONFIGURATION = "api.configuration"
}

/**
 * Tipi di azioni UI
 */
export type ActionType = 
    | "chatButtonClicked"
    | "mcpButtonClicked"
    | "settingsButtonClicked"
    | "historyButtonClicked"
    | "accountButtonClicked"
    | "didBecomeVisible"
    | "accountLoginClicked"
    | "accountLogoutClicked";

/**
 * Tipo di invocazione
 */
export type InvokeType = "sendMessage" | "primaryButtonClick" | "secondaryButtonClick";

/**
 * Interfaccia base comune per i messaggi bidirezionali
 * tra estensione e WebView
 */
export interface WebviewMessageBase extends BaseMessage {
  /** Tipo del messaggio */
  type: WebviewMessageType | string;
  /** Payload opzionale del messaggio, può essere sovrascritto nelle interfacce derivate */
  payload?: Record<string, unknown>;
}

/**
 * Interfaccia generica standardizzata per i messaggi WebView
 * con payload di tipo generico T
 */
export interface WebviewMessage<T extends Record<string, unknown> = Record<string, unknown>> extends WebviewMessageBase {
  /** Payload specifico del messaggio */
  payload?: T;
  /** Identificatore opzionale */
  id?: string;
  
  // Campi specifici per tipi di messaggi comuni
  action?: ActionType;
  invoke?: InvokeType;
  message?: string | ChatMessage;
  
  // Campi di compatibilità per retrocompatibilità
  key?: string;
  value?: any;
  content?: string;
  settings?: any;
  text?: string;
  
  // Campi per API e impostazioni
  apiConfiguration?: ApiConfiguration;
  
  // Campi per benchmark
  benchmarkSessionId?: string;
  benchmarkProvider?: string;
  benchmarkTimeframe?: number;
}

/**
 * Interfaccia per i prompt di contesto
 */
export interface ContextPrompt {
  /** Prompt di sistema */
  system?: string;
  /** Prompt utente */
  user?: string;
  /** Prompt persona */
  persona?: string;
  /** Prompt contesto */
  context?: string;
}

/**
 * Interfaccia per messaggi Extension -> WebView
 */
export interface ExtensionMessage extends BaseMessage {
  /** Tipo del messaggio inviato dall'estensione alla WebView */
  type: string;
  
  // Campi specifici
  action?: ActionType;
  error?: string;
  message?: ChatMessage | string; // Supporta sia oggetti ChatMessage che stringhe
  messages?: ChatMessage[];
  content?: string; // Aggiunto per retrocompatibilità
  settings?: {
    contextPrompt?: ContextPrompt; // Aggiornato a oggetto strutturato
    [key: string]: any;
  }; // Aggiunto per retrocompatibilità
  key?: string; // Aggiunto per retrocompatibilità
  value?: any; // Aggiunto per retrocompatibilità
  filePath?: string; // Aggiunto per retrocompatibilità
  apiConfiguration?: ApiConfiguration; // Aggiunto per compatibilità
  benchmarkSessionId?: string; // Aggiunto per compatibilità
  benchmarkProvider?: string; // Aggiunto per compatibilità
  benchmarkTimeframe?: number; // Aggiunto per compatibilità
  state?: {
    apiConfiguration?: ApiConfiguration;
    telemetrySetting?: TelemetrySetting;
    customInstructions?: string;
    planActSeparateModelsSetting?: boolean;
    use_docs?: boolean;
    contextPrompt?: ContextPrompt; // Aggiornato a oggetto strutturato (retrocompatibile)
    coder_mode?: boolean;
  };
}

/**
 * Tipo unione per rappresentare tutti i possibili messaggi
 * nei due sensi di comunicazione
 */
export type Message = WebviewMessage<any> | ExtensionMessage;

/**
 * Tipo di unione per tutti i messaggi WebView specifici
 * Questa è una union discriminata che consente di distinguere i messaggi in base al campo 'type'
 * @deprecated Utilizzare l'import da './webviewMessageUnion.js' che fornisce anche type guards specifici
 * @see ./webviewMessageUnion.js
 */
export type WebviewMessageUnion =
  | SendPromptMessage
  | ActionMessage
  | ErrorMessage
  | ResponseMessage
  | StateMessage
  // Tipi di istruzioni
  | InstructionMessage
  | InstructionCompletedMessage;

/**
 * Tipo di unione per tutti i tipi di messaggi WebView
 * Usato per la tipizzazione dei payload nei metodi di invio messaggi
 */
export type WebviewMessagePayload = WebviewMessage<any> | WebviewMessageUnion;

/**
 * Funzione di type-guard per verificare se un messaggio è ExtensionMessage
 * @param message Il messaggio da verificare
 */
export function isExtensionMessage(message: Message): message is ExtensionMessage {
    // Logica per determinare se il messaggio è un ExtensionMessage
    return (
        message !== undefined &&
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        typeof message.type === 'string'
    );
}

/**
 * Funzione di type-guard per verificare se un messaggio è WebviewMessage
 * @param message Il messaggio da verificare
 */
export function isWebviewMessage(message: Message): message is WebviewMessage<any> {
    // Logica per determinare se il messaggio è un WebviewMessage
    return (
        message !== undefined &&
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        (typeof message.type === 'string' || typeof message.type === 'number')
    );
}

// Interfacce specifiche per vari tipi di messaggi

/**
 * Messaggio di azione UI
 */
export interface ActionMessage extends ExtensionMessage {
    type: "action";
    action: ActionType;
}

/**
 * Messaggio di errore
 */
export interface ErrorMessage extends ExtensionMessage {
    type: "error";
    error: string;
}

/**
 * Messaggio di risposta
 */
export interface ResponseMessage extends ExtensionMessage {
    type: "response";
    payload: {
        text?: string;
        role?: string;
        streaming?: boolean;
        error?: string;
    };
}

/**
 * Messaggio di stato
 */
export interface StateMessage extends ExtensionMessage {
    type: "state";
    state: {
        apiConfiguration?: ApiConfiguration;
        telemetrySetting?: TelemetrySetting;
        customInstructions?: string;
        planActSeparateModelsSetting?: boolean;
        use_docs?: boolean;
        contextPrompt?: string;
        coder_mode?: boolean;
    };
}

/**
 * Messaggio di invio prompt (da WebView a Extension)
 */
export interface SendPromptMessage extends WebviewMessage {
    type: WebviewMessageType.SEND_PROMPT;
    payload: {
        prompt: string;
        apiKey?: string;
        modelId?: string;
    };
}

/**
 * Funzione di conversione da ExtensionMessage a WebviewMessage con validazione
 * @param message Messaggio di tipo ExtensionMessage
 * @returns Messaggio convertito in WebviewMessage o null se non valido
 */
export function convertToWebviewMessage(message: ExtensionMessage): WebviewMessage<Record<string, unknown>> | null {
    // Validazione dell'input
    if (!message || typeof message !== 'object' || !('type' in message)) {
        console.warn('[WebviewMessage] Messaggio non valido:', message);
        return null;
    }

    const { type, payload } = message;

    // Validazione del tipo
    if (typeof type !== 'string') {
        console.warn('[WebviewMessage] Tipo mancante o non stringa:', type);
        return null;
    }

    // Crea un nuovo oggetto base
    const baseMessage: Partial<WebviewMessage<Record<string, unknown>>> = {
        type,
        payload: payload ?? {}, // fallback di sicurezza
        id: undefined
    };
    
    // Trasferisci i campi comuni se presenti
    if ('action' in message && message.action) baseMessage.action = message.action;
    if ('message' in message && message.message) baseMessage.message = message.message;
    if ('error' in message && message.error) baseMessage.payload = { 
        ...baseMessage.payload, 
        error: message.error 
    };
    
    // Trasferisci i campi API specifici se presenti
    if ('apiConfiguration' in message && message.apiConfiguration && typeof message.apiConfiguration === 'object') {
        // Assicurati che ci sia almeno il provider richiesto
        baseMessage.apiConfiguration = { 
            provider: 'unknown', // Default provider
            ...((message.apiConfiguration as object) || {})
        };
    } else if (message.state?.apiConfiguration && typeof message.state.apiConfiguration === 'object') {
        // Assicurati che ci sia almeno il provider richiesto
        baseMessage.apiConfiguration = { 
            provider: 'unknown', // Default provider
            ...((message.state.apiConfiguration as object) || {})
        };
    }
    
    return baseMessage as WebviewMessage<Record<string, unknown>>;
}

/**
 * Helper per type casting
 * @param value Valore da fare cast
 * @deprecated Utilizzare safeCastAs() da './webviewMessageUnion.js' che include validazione a runtime
 */
export function castAs<T>(value: unknown): T {
    console.warn('[DEPRECATED] castAs() è deprecato. Utilizzare safeCastAs() da webviewMessageUnion.js');
    return value as T;
}

/**
 * Interfaccia per le impostazioni WebView
 * @deprecated Utilizzare le interfacce specifiche per le impostazioni
 */
export interface WebviewSettings {
    /** Flag per l'uso dei documenti */
    use_docs: boolean;
    /** Flag per la modalità coder */
    coder_mode: boolean;
    /** Prompt di contesto */
    contextPrompt: string;
    /** Modello selezionato */
    selectedModel: string;
    /** Flag per multi-agente */
    multi_agent: boolean;
    /** Modelli disponibili */
    availableModels?: string[];
}

// Interfacce per le sessioni di benchmark

export interface BenchmarkSession {
    id: string;
    name: string;
    timestamp: number;
    provider: string;
    duration: number;
}

export interface BenchmarkSessionDetail extends BenchmarkSession {
    results: any[];
}

export interface ProviderStats {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    totalCost: number;
}

export interface TimelineStats {
    date: string;
    requests: number;
    cost: number;
}

/**
 * Interfaccia per messaggi di istruzioni
 */
export interface InstructionMessage {
    type: WebviewMessageType;
    id?: string;
    agentId?: string;
    instruction?: string;
    result?: string;
}

/**
 * Interfaccia per messaggio di istruzione completata
 */
export interface InstructionCompletedMessage extends WebviewMessage {
    type: "instructionCompleted";
    id: string;
    agentId: string;
    instruction: string;
    result: string;
} 