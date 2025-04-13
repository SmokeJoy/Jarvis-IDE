/**
 * @file webview.types.ts
 * @description Definizione centralizzata di tutti i tipi per la comunicazione WebView in Jarvis IDE
 * Questo file è la fonte di verità per tutti i tipi di messaggi tra estensione e WebView
 * @version 1.0.0
 */

import { ApiConfiguration } from './api.types';
import { TelemetrySetting } from './telemetry.types';
import { BaseMessage } from './common';

// Importo la tipologia di ChatMessage
import { ChatMessage as ChatMessageImport } from './message.types';
export type ChatMessage = ChatMessageImport;

/**
 * Tipi di messaggi per la comunicazione bidirezionale
 */

/**
 * Enum per i tipi di messaggi standard
 */
export enum WebviewMessageType {
  // Operazioni di base
  GET_STATE = 'getState',
  SET_STATE = 'setState',
  SEND_PROMPT = 'sendPrompt',

  // Operazioni sulla chat
  LOAD_CHAT_HISTORY = 'loadChatHistory',
  CLEAR_CHAT_HISTORY = 'clearChatHistory',
  EXPORT_CHAT_HISTORY = 'exportChatHistory',
  CHAT_RESPONSE = 'chatResponse',

  // Operazioni sui prompt di sistema
  GET_SYSTEM_PROMPT = 'getSystemPrompt',
  SAVE_SYSTEM_PROMPT = 'saveSystemPrompt',

  // Operazioni sulle impostazioni
  SAVE_SETTINGS = 'saveSettings',
  RESET_SETTINGS = 'resetSettings',
  EXPORT_SETTINGS = 'exportSettings',
  IMPORT_SETTINGS = 'importSettings',
  GET_SETTINGS = 'getSettings',
  UPDATE_SETTINGS = 'updateSettings',
  UPDATE_SETTING = 'updateSetting',

  // Operazioni con profili di prompt (MCP-F6)
  GET_PROMPT_PROFILES = 'getPromptProfiles',
  CREATE_PROMPT_PROFILE = 'createPromptProfile',
  UPDATE_PROMPT_PROFILE = 'updatePromptProfile',
  DELETE_PROMPT_PROFILE = 'deletePromptProfile',
  SWITCH_PROMPT_PROFILE = 'switchPromptProfile',

  // Operazioni con immagini
  SELECT_IMAGES = 'selectImages',

  // Benchmark
  GET_BENCHMARK_SESSIONS = 'getBenchmarkSessions',
  GET_BENCHMARK_SESSION = 'getBenchmarkSession',
  GET_BENCHMARK_STATS = 'getBenchmarkStats',
  GET_BENCHMARK_TIMELINE = 'getBenchmarkTimeline',
  EXPORT_BENCHMARK_SESSION = 'exportBenchmarkSession',
  DELETE_BENCHMARK_SESSION = 'deleteBenchmarkSession',

  // Risposte
  RESPONSE = 'response',
  STATE_UPDATE = 'stateUpdate',
  ERROR = 'error',
  SHOW_ERROR_MESSAGE = 'showErrorMessage',

  // Azioni UI
  ACTION = 'action',

  // Log
  LOG_EXPORT = 'log.export',
  LOG_OPEN_FOLDER = 'log.openFolder',

  // Comunicazione con gli agenti
  RUN_AGENT = 'runAgent',
  ANALYZE_FILE = 'analyzeFile',
  INSTRUCTION_RECEIVED = 'instructionReceived',
  INSTRUCTION_COMPLETED = 'instructionCompleted',
  INSTRUCTION_FAILED = 'instructionFailed',
  AGENTS_STATUS_UPDATE = 'agentsStatusUpdate',
  TASK_QUEUE_UPDATE = 'taskQueueUpdate',

  // Configurazione API
  API_CONFIGURATION = 'api.configuration',
  READY = 'ready',
  COMMAND = 'command',
  INSTRUCTION = 'instruction',
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
export interface WebviewMessageBase extends BaseMessage {
  /** Tipo del messaggio */
  type: WebviewMessageType | string;
  /** Payload opzionale del messaggio, può essere sovrascritto nelle interfacce derivate */
  payload?: Record<string, unknown>;
}

/**
 * Interfaccia generica standardizzata per i messaggi WebView
 * con payload di tipo generico T
 * @template T Tipo del messaggio
 * @template P Tipo del payload
 */
export interface WebviewMessage<T = string, P = Record<string, unknown>> {
  type: T;
  timestamp?: number;
  payload?: P;
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
 * Tipo che rappresenta i possibili valori di impostazione
 */
export type SettingValue = string | number | boolean | string[] | null | undefined;

/**
 * Tipo per le impostazioni che possono essere serializzate
 */
export interface SerializedSettings {
  /** Struttura per il prompt di contesto */
  contextPrompt?: ContextPrompt;
  /** Altre impostazioni possibili, tipizzate per evitare any */
  [key: string]: SettingValue | ContextPrompt | Record<string, SettingValue>;
}

/**
 * Interfaccia per lo stato dell'estensione
 */
export interface ExtensionState {
  /** Configurazione dell'API */
  apiConfiguration?: ApiConfiguration;
  /** Impostazioni di telemetria */
  telemetrySetting?: TelemetrySetting;
  /** Istruzioni personalizzate */
  customInstructions?: string;
  /** Impostazione per modelli separati per pianificazione e azione */
  planActSeparateModelsSetting?: boolean;
  /** Flag per l'utilizzo della documentazione */
  use_docs?: boolean;
  /** Struttura per il prompt di contesto (supporta sia string che ContextPrompt) */
  contextPrompt?: string | ContextPrompt;
  /** Flag per la modalità sviluppatore */
  coder_mode?: boolean;
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
  settings?: SerializedSettings; // Tipo migliorato
  key?: string; // Aggiunto per retrocompatibilità
  value?: SettingValue; // Tipo migliorato
  filePath?: string; // Aggiunto per retrocompatibilità
  apiConfiguration?: ApiConfiguration; // Aggiunto per compatibilità
  benchmarkSessionId?: string; // Aggiunto per compatibilità
  benchmarkProvider?: string; // Aggiunto per compatibilità
  benchmarkTimeframe?: number; // Aggiunto per compatibilità
  state?: ExtensionState;
}

/**
 * Tipo unione per rappresentare tutti i possibili messaggi
 * nei due sensi di comunicazione
 */
export type Message = WebviewMessage<string, Record<string, unknown>> | ExtensionMessage;

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
export type WebviewMessagePayload = WebviewMessage<string, Record<string, unknown>> | WebviewMessageUnion;

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
export function isWebviewMessage(message: Message): message is WebviewMessage<string, Record<string, unknown>> {
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
  state: ExtensionState;
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
 * Tipo di ritorno esteso per WebviewMessage usato nella conversione
 */
export interface ConvertedWebviewMessage extends WebviewMessage<string, Record<string, unknown>> {
  action?: ActionType;
  message?: ChatMessage | string;
  apiConfiguration?: ApiConfiguration;
}

/**
 * Funzione di conversione da ExtensionMessage a WebviewMessage con validazione
 * @param message Messaggio di tipo ExtensionMessage
 * @returns Messaggio convertito in WebviewMessage o null se non valido
 */
export function convertToWebviewMessage(
  message: ExtensionMessage
): ConvertedWebviewMessage | null {
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
  const baseMessage: ConvertedWebviewMessage = {
    type,
    payload: payload ?? {}, // fallback di sicurezza
  };

  // Trasferisci i campi comuni se presenti
  if ('action' in message && message.action) baseMessage.action = message.action;
  if ('message' in message && message.message) baseMessage.message = message.message;
  if ('error' in message && message.error)
    baseMessage.payload = {
      ...baseMessage.payload,
      error: message.error,
    };

  // Trasferisci i campi API specifici se presenti
  if (
    'apiConfiguration' in message &&
    message.apiConfiguration &&
    typeof message.apiConfiguration === 'object'
  ) {
    // Assicurati che ci sia almeno il provider richiesto
    baseMessage.apiConfiguration = {
      provider: message.apiConfiguration.provider || 'default',
      ...((message.apiConfiguration as object) || {}),
    };
  } else if (
    message.state?.apiConfiguration &&
    typeof message.state.apiConfiguration === 'object'
  ) {
    // Assicurati che ci sia almeno il provider richiesto
    baseMessage.apiConfiguration = {
      provider: message.state.apiConfiguration.provider || 'default',
      ...((message.state.apiConfiguration as object) || {}),
    };
  }

  return baseMessage;
}

/**
 * Helper per type casting
 * @param value Valore da fare cast
 * @deprecated Utilizzare safeCastAs() da './webviewMessageUnion.js' che include validazione a runtime
 */
export function castAs<T>(value: unknown): T {
  console.warn(
    '[DEPRECATED] castAs() è deprecato. Utilizzare safeCastAs() da webviewMessageUnion.js'
  );
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

/**
 * Interfaccia per i dettagli di una sessione di benchmark
 */
export interface BenchmarkSessionResult {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  duration: number;
  tokens: number;
  cost: number;
}

/**
 * Interfaccia estesa per i dettagli di una sessione di benchmark
 */
export interface BenchmarkSessionDetail extends BenchmarkSession {
  results: BenchmarkSessionResult[];
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
export interface InstructionMessage extends WebviewMessageBase {
  type: WebviewMessageType.INSTRUCTION;
  id?: string;
  agentId?: string;
  payload: {
    instruction: string;
    result?: string;
  };
}

/**
 * Interfaccia per messaggio di istruzione completata
 */
export interface InstructionCompletedMessage extends WebviewMessage {
  type: 'instructionCompleted';
  id: string;
  agentId: string;
  instruction: string;
  result: string;
}

export interface WebviewReadyMessage extends WebviewMessage<WebviewMessageType.READY> {
  type: WebviewMessageType.READY;
}

/**
 * Payload per i messaggi di log
 */
export interface LogMessagePayload {
  /** Livello di log (info, warn, error) */
  level: 'info' | 'warn' | 'error';
  /** Messaggio di log */
  message: string;
  /** Dati aggiuntivi opzionali */
  data?: Record<string, unknown>;
}

/**
 * Payload per i messaggi di errore
 */
export interface ErrorMessagePayload {
  /** Messaggio di errore */
  message: string;
  /** Codice di errore opzionale */
  code?: string;
  /** Dettagli aggiuntivi sull'errore */
  details?: Record<string, unknown>;
}

/**
 * Payload per i messaggi di aggiornamento stato
 */
export interface StateUpdatePayload {
  /** Percorso delle proprietà da aggiornare */
  path: string[];
  /** Valore da impostare */
  value: SettingValue | Record<string, unknown>;
}

/**
 * Payload per i messaggi di comando
 */
export interface CommandPayload {
  /** Comando da eseguire */
  command: string;
  /** Argomenti del comando */
  args?: (string | number | boolean | null | undefined)[];
}

/**
 * Payload per i messaggi di risposta
 */
export interface ResponsePayload {
  /** ID della richiesta a cui si sta rispondendo */
  requestId: string;
  /** Dati della risposta */
  data?: Record<string, unknown>;
  /** Messaggio di errore, se presente */
  error?: string;
}

/**
 * Messaggio di log
 */
export interface WebviewLogMessage extends WebviewMessage<'log', LogMessagePayload> {
  type: 'log';
  payload: LogMessagePayload;
}

/**
 * Messaggio di errore della WebView
 */
export interface WebviewErrorMessage extends WebviewMessage<WebviewMessageType.ERROR, ErrorMessagePayload> {
  type: WebviewMessageType.ERROR;
  payload: ErrorMessagePayload;
}

/**
 * Messaggio di aggiornamento stato della WebView
 */
export interface WebviewStateUpdateMessage extends WebviewMessage<WebviewMessageType.STATE_UPDATE, StateUpdatePayload> {
  type: WebviewMessageType.STATE_UPDATE;
  payload: StateUpdatePayload;
}

/**
 * Messaggio di comando della WebView
 */
export interface WebviewCommandMessage extends WebviewMessage<WebviewMessageType.COMMAND, CommandPayload> {
  type: WebviewMessageType.COMMAND;
  payload: CommandPayload;
}

/**
 * Messaggio di risposta della WebView
 */
export interface WebviewResponseMessage extends WebviewMessage<WebviewMessageType.RESPONSE, ResponsePayload> {
  type: WebviewMessageType.RESPONSE;
  payload: ResponsePayload;
}

export type WebviewBaseMessage =
  | WebviewReadyMessage
  | WebviewErrorMessage
  | WebviewLogMessage
  | WebviewStateUpdateMessage
  | WebviewCommandMessage
  | WebviewResponseMessage;
