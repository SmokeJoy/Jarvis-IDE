/**
 * @file webview.types.ts
 * @description Definizione centralizzata di tutti i tipi per la comunicazione WebView in Jarvis IDE
 * Questo file è la fonte di verità per tutti i tipi di messaggi tra estensione e WebView
 */
import { ApiConfiguration } from './api.types';
import { TelemetrySetting } from './telemetry.types';
import { ChatMessage as ChatMessageImport } from './message.types';
export type ChatMessage = ChatMessageImport;
/**
 * Tipi di messaggi per la comunicazione bidirezionale
 */
/**
 * Enum per i tipi di messaggi standard
 */
export declare enum WebviewMessageType {
  GET_STATE = 'getState',
  SET_STATE = 'setState',
  SEND_PROMPT = 'sendPrompt',
  LOAD_CHAT_HISTORY = 'loadChatHistory',
  CLEAR_CHAT_HISTORY = 'clearChatHistory',
  EXPORT_CHAT_HISTORY = 'exportChatHistory',
  CHAT_RESPONSE = 'chatResponse',
  GET_SYSTEM_PROMPT = 'getSystemPrompt',
  SAVE_SYSTEM_PROMPT = 'saveSystemPrompt',
  SAVE_SETTINGS = 'saveSettings',
  RESET_SETTINGS = 'resetSettings',
  EXPORT_SETTINGS = 'exportSettings',
  IMPORT_SETTINGS = 'importSettings',
  GET_SETTINGS = 'getSettings',
  UPDATE_SETTINGS = 'updateSettings',
  UPDATE_SETTING = 'updateSetting',
  SELECT_IMAGES = 'selectImages',
  GET_BENCHMARK_SESSIONS = 'getBenchmarkSessions',
  GET_BENCHMARK_SESSION = 'getBenchmarkSession',
  GET_BENCHMARK_STATS = 'getBenchmarkStats',
  GET_BENCHMARK_TIMELINE = 'getBenchmarkTimeline',
  EXPORT_BENCHMARK_SESSION = 'exportBenchmarkSession',
  DELETE_BENCHMARK_SESSION = 'deleteBenchmarkSession',
  RESPONSE = 'response',
  STATE_UPDATE = 'stateUpdate',
  ERROR = 'error',
  SHOW_ERROR_MESSAGE = 'showErrorMessage',
  ACTION = 'action',
  LOG_EXPORT = 'log.export',
  LOG_OPEN_FOLDER = 'log.openFolder',
  RUN_AGENT = 'runAgent',
  ANALYZE_FILE = 'analyzeFile',
  INSTRUCTION_RECEIVED = 'instructionReceived',
  INSTRUCTION_COMPLETED = 'instructionCompleted',
  INSTRUCTION_FAILED = 'instructionFailed',
  AGENTS_STATUS_UPDATE = 'agentsStatusUpdate',
  TASK_QUEUE_UPDATE = 'taskQueueUpdate',
  API_CONFIGURATION = 'api.configuration',
}
/**
 * Tipi di azioni UI
 */
export type ActionType =
  | 'chatButtonClicked'
  | 'mcpButtonClicked'
  | 'settingsButtonClicked'
  | 'historyButtonClicked'
  | 'accountButtonClicked'
  | 'didBecomeVisible'
  | 'accountLoginClicked'
  | 'accountLogoutClicked';
/**
 * Tipo di invocazione
 */
export type InvokeType = 'sendMessage' | 'primaryButtonClick' | 'secondaryButtonClick';
/**
 * Interfaccia base comune per i messaggi bidirezionali
 * tra estensione e WebView
 */
export interface BaseMessage {
  /** Tipo del messaggio */
  type: string;
  /** Payload opzionale del messaggio */
  payload?: Record<string, unknown>;
}

/**
 * Tipo rappresentante possibili valori di un'impostazione
 */
export type SettingValue = string | number | boolean | string[] | null;

/**
 * Interfaccia per le impostazioni generiche
 */
export interface GenericSettings {
  [key: string]: SettingValue;
}

/**
 * Interfaccia generica standardizzata per i messaggi WebView
 * con payload di tipo generico T
 */
export interface WebviewMessage<T = Record<string, unknown>> {
  /** Tipo del messaggio */
  type: string | WebviewMessageType;
  /** Payload specifico del messaggio */
  payload?: T;
  /** Identificatore opzionale */
  id?: string;
  action?: ActionType;
  invoke?: InvokeType;
  message?: string | ChatMessage;
  key?: string;
  value?: SettingValue;
  content?: string;
  settings?: GenericSettings;
  text?: string;
  apiConfiguration?: ApiConfiguration;
  benchmarkSessionId?: string;
  benchmarkProvider?: string;
  benchmarkTimeframe?: number;
}
/**
 * Interfaccia per messaggi Extension -> WebView
 */
export interface ExtensionMessage {
  /** Tipo del messaggio inviato dall'estensione alla WebView */
  type: string;
  /** Payload specifico */
  payload?: Record<string, unknown>;
  action?: ActionType;
  error?: string;
  message?: ChatMessage | string;
  messages?: ChatMessage[];
  content?: string;
  settings?: GenericSettings;
  key?: string;
  value?: SettingValue;
  filePath?: string;
  apiConfiguration?: ApiConfiguration;
  benchmarkSessionId?: string;
  benchmarkProvider?: string;
  benchmarkTimeframe?: number;
  state?: {
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
 * Tipo unione per rappresentare tutti i possibili messaggi
 * nei due sensi di comunicazione
 */
export type Message = WebviewMessage<Record<string, unknown>> | ExtensionMessage;
/**
 * Funzione di type-guard per verificare se un messaggio è ExtensionMessage
 * @param message Il messaggio da verificare
 */
export declare function isExtensionMessage(message: Message): message is ExtensionMessage;
/**
 * Funzione di type-guard per verificare se un messaggio è WebviewMessage
 * @param message Il messaggio da verificare
 */
export declare function isWebviewMessage(message: Message): message is WebviewMessage<Record<string, unknown>>;
/**
 * Messaggio di azione UI
 */
export interface ActionMessage extends ExtensionMessage {
  type: 'action';
  action: ActionType;
}
/**
 * Messaggio di errore
 */
export interface ErrorMessage extends ExtensionMessage {
  type: 'error';
  error: string;
}
/**
 * Messaggio di risposta
 */
export interface ResponseMessage extends ExtensionMessage {
  type: 'response';
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
  type: 'state';
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
export interface SendPromptMessage extends WebviewMessage<{
  prompt: string;
  apiKey?: string;
  modelId?: string;
}> {
  type: WebviewMessageType.SEND_PROMPT;
}
/**
 * Funzione di conversione da ExtensionMessage a WebviewMessage con validazione
 * @param message Messaggio di tipo ExtensionMessage
 * @returns Messaggio convertito in WebviewMessage o null se non valido
 */
export declare function convertToWebviewMessage(
  message: ExtensionMessage
): WebviewMessage<Record<string, unknown>> | null;
/**
 * Helper per type casting
 * @param value Valore da fare cast
 */
export declare function castAs<T>(value: unknown): T;
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
export interface BenchmarkSession {
  id: string;
  name: string;
  timestamp: number;
  provider: string;
  duration: number;
}
export interface BenchmarkSessionDetail extends BenchmarkSession {
  results: Record<string, unknown>[];
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
export interface InstructionCompletedMessage extends WebviewMessage<{
  id: string;
  agentId: string;
  instruction: string;
  result: string;
}> {
  type: 'instructionCompleted';
}
//# sourceMappingURL=webview.types.d.ts.map
