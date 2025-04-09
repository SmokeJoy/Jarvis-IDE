/**
 * @file webview.types.ts
 * @description Definizione centralizzata di tutti i tipi per la comunicazione WebView in Jarvis IDE
 * Questo file è la fonte di verità per tutti i tipi di messaggi tra estensione e WebView
 */
import { ApiConfiguration, OpenAiCompatibleModelInfo, ModelInfo } from './api.types';
import { TelemetrySetting } from './telemetry.types';
import { BrowserSettings, ChatSettings, AutoApprovalSettings } from './user-settings.types';
import { Task, AgentStatus, TaskQueueState } from './mas.types';
import { ChatContent } from '../ChatContent';
import { Platform } from '../Platform';
import { HistoryItem } from '../HistoryItem';
/**
 * Tipi di messaggi per la comunicazione bidirezionale
 */
/**
 * Enum per i tipi di messaggi standard
 */
export var WebviewMessageType;
(function (WebviewMessageType) {
    // Operazioni di base
    WebviewMessageType["GET_STATE"] = "getState";
    WebviewMessageType["SET_STATE"] = "setState";
    WebviewMessageType["SEND_PROMPT"] = "sendPrompt";
    // Operazioni sulla chat
    WebviewMessageType["LOAD_CHAT_HISTORY"] = "loadChatHistory";
    WebviewMessageType["CLEAR_CHAT_HISTORY"] = "clearChatHistory";
    WebviewMessageType["EXPORT_CHAT_HISTORY"] = "exportChatHistory";
    WebviewMessageType["CHAT_RESPONSE"] = "chatResponse";
    // Operazioni sui prompt di sistema
    WebviewMessageType["GET_SYSTEM_PROMPT"] = "getSystemPrompt";
    WebviewMessageType["SAVE_SYSTEM_PROMPT"] = "saveSystemPrompt";
    // Operazioni sulle impostazioni
    WebviewMessageType["SAVE_SETTINGS"] = "saveSettings";
    WebviewMessageType["RESET_SETTINGS"] = "resetSettings";
    WebviewMessageType["EXPORT_SETTINGS"] = "exportSettings";
    WebviewMessageType["IMPORT_SETTINGS"] = "importSettings";
    WebviewMessageType["GET_SETTINGS"] = "getSettings";
    WebviewMessageType["UPDATE_SETTINGS"] = "updateSettings";
    WebviewMessageType["UPDATE_SETTING"] = "updateSetting";
    // Operazioni con immagini
    WebviewMessageType["SELECT_IMAGES"] = "selectImages";
    // Benchmark
    WebviewMessageType["GET_BENCHMARK_SESSIONS"] = "getBenchmarkSessions";
    WebviewMessageType["GET_BENCHMARK_SESSION"] = "getBenchmarkSession";
    WebviewMessageType["GET_BENCHMARK_STATS"] = "getBenchmarkStats";
    WebviewMessageType["GET_BENCHMARK_TIMELINE"] = "getBenchmarkTimeline";
    WebviewMessageType["EXPORT_BENCHMARK_SESSION"] = "exportBenchmarkSession";
    WebviewMessageType["DELETE_BENCHMARK_SESSION"] = "deleteBenchmarkSession";
    // Risposte
    WebviewMessageType["RESPONSE"] = "response";
    WebviewMessageType["STATE_UPDATE"] = "stateUpdate";
    WebviewMessageType["ERROR"] = "error";
    WebviewMessageType["SHOW_ERROR_MESSAGE"] = "showErrorMessage";
    // Azioni UI
    WebviewMessageType["ACTION"] = "action";
    // Log
    WebviewMessageType["LOG_EXPORT"] = "log.export";
    WebviewMessageType["LOG_OPEN_FOLDER"] = "log.openFolder";
    // Comunicazione con gli agenti
    WebviewMessageType["RUN_AGENT"] = "runAgent";
    WebviewMessageType["ANALYZE_FILE"] = "analyzeFile";
    WebviewMessageType["INSTRUCTION_RECEIVED"] = "instructionReceived";
    WebviewMessageType["INSTRUCTION_COMPLETED"] = "instructionCompleted";
    WebviewMessageType["INSTRUCTION_FAILED"] = "instructionFailed";
    WebviewMessageType["AGENTS_STATUS_UPDATE"] = "agentsStatusUpdate";
    WebviewMessageType["TASK_QUEUE_UPDATE"] = "taskQueueUpdate";
    // Configurazione API
    WebviewMessageType["API_CONFIGURATION"] = "api.configuration";
})(WebviewMessageType || (WebviewMessageType = {}));
/**
 * Funzione di type-guard per verificare se un messaggio è ExtensionMessage
 * @param message Il messaggio da verificare
 */
export function isExtensionMessage(message) {
    // Logica per determinare se il messaggio è un ExtensionMessage
    return (message !== undefined &&
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        typeof message.type === 'string');
}
/**
 * Funzione di type-guard per verificare se un messaggio è WebviewMessage
 * @param message Il messaggio da verificare
 */
export function isWebviewMessage(message) {
    // Logica per determinare se il messaggio è un WebviewMessage
    return (message !== undefined &&
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        (typeof message.type === 'string' || typeof message.type === 'number'));
}
/**
 * Funzione di conversione da ExtensionMessage a WebviewMessage con validazione
 * @param message Messaggio di tipo ExtensionMessage
 * @returns Messaggio convertito in WebviewMessage o null se non valido
 */
export function convertToWebviewMessage(message) {
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
    const baseMessage = {
        type,
        payload: payload ?? {}, // fallback di sicurezza
        id: undefined
    };
    // Trasferisci i campi comuni se presenti
    if ('action' in message && message.action)
        baseMessage.action = message.action;
    if ('message' in message && message.message)
        baseMessage.message = message.message;
    if ('error' in message && message.error)
        baseMessage.payload = {
            ...baseMessage.payload,
            error: message.error
        };
    // Trasferisci i campi API specifici se presenti
    if ('apiConfiguration' in message && message.apiConfiguration && typeof message.apiConfiguration === 'object') {
        // Assicurati che ci sia almeno il provider richiesto
        baseMessage.apiConfiguration = {
            provider: 'unknown', // Default provider
            ...(message.apiConfiguration || {})
        };
    }
    else if (message.state?.apiConfiguration && typeof message.state.apiConfiguration === 'object') {
        // Assicurati che ci sia almeno il provider richiesto
        baseMessage.apiConfiguration = {
            provider: 'unknown', // Default provider
            ...(message.state.apiConfiguration || {})
        };
    }
    return baseMessage;
}
/**
 * Helper per type casting
 * @param value Valore da fare cast
 */
export function castAs(value) {
    return value;
}
//# sourceMappingURL=webview.types.js.map