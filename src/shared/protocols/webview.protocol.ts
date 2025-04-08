// src/shared/protocols/webview.protocol.ts

// Tipo base comune a tutti i messaggi WebView
export interface BaseWebviewMessage<T extends string, P = any> {
  type: T;
  payload: P;
  requestId?: string;
  source?: "extension" | "webview";
  error?: string;
  // Per retrocompatibilità, consentiamo l'accesso diretto ai campi del payload
  [key: string]: any;
}

// === Messaggi in Entrata (dalla WebView alla Extension) ===

export type IncomingWebviewMessage =
  | BaseWebviewMessage<"agent.run", { agentId: string; task: string }>
  | BaseWebviewMessage<"agent.toggle", { agentId: string; enabled: boolean }>
  | BaseWebviewMessage<"agent.getState", {}>
  | BaseWebviewMessage<"task.abort", { taskId: string }>
  | BaseWebviewMessage<"panel.init", { tab: string }>
  | BaseWebviewMessage<"settings.update", { key: string; value: any }>
  | BaseWebviewMessage<"llm.query", { prompt: string }>
  | BaseWebviewMessage<"llm.abort", { requestId: string }>
  | BaseWebviewMessage<"debug.log", { message: string }>
  // Aggiungiamo anche i tipi di messaggi legacy per retrocompatibilità
  | BaseWebviewMessage<"updateSetting", { key: string; value: any }>
  | BaseWebviewMessage<"getSettings", {}>
  | BaseWebviewMessage<"getSystemPrompt", {}>
  | BaseWebviewMessage<"saveSystemPrompt", { content: string }>
  | BaseWebviewMessage<"resetSystemPrompt", {}>
  | BaseWebviewMessage<"resetAllSettings", {}>
  | BaseWebviewMessage<"saveAllSettings", { settings: Record<string, any> }>
  | BaseWebviewMessage<"openSystemPromptFile", {}>
  | BaseWebviewMessage<"log.export", {}>
  | BaseWebviewMessage<"log.openFolder", {}>
  | BaseWebviewMessage<"updateModel", { value: string }>;

// === Messaggi in Uscita (dalla Extension alla WebView) ===

export type OutgoingWebviewMessage =
  | BaseWebviewMessage<"agent.state", { agents: any[] }>
  | BaseWebviewMessage<"task.update", { taskId: string; status: string }>
  | BaseWebviewMessage<"task.queue", { queue: any[] }>
  | BaseWebviewMessage<"panel.ready", {}>
  | BaseWebviewMessage<"settings.state", { settings: Record<string, any> }>
  | BaseWebviewMessage<"llm.result", { requestId: string; result: string }>
  | BaseWebviewMessage<"llm.error", { requestId: string; error: string }>
  | BaseWebviewMessage<"notification", { level: "info" | "warn" | "error"; message: string }>
  // Aggiungiamo anche i tipi di messaggi legacy per retrocompatibilità
  | BaseWebviewMessage<"response", { text?: string; content?: string; success?: boolean }>
  | BaseWebviewMessage<"error", { error: string }>
  | BaseWebviewMessage<"systemPromptLoaded", { content: string; filePath?: string }>
  | BaseWebviewMessage<"systemPromptSaved", {}>
  | BaseWebviewMessage<"settingsLoaded", { settings: Record<string, any> }>
  | BaseWebviewMessage<"settingUpdated", { key: string; value: any }>
  | BaseWebviewMessage<"state", { [key: string]: any }>;

// === Messaggio Unificato ===

export type WebviewMessage = IncomingWebviewMessage | OutgoingWebviewMessage;

// === Tipi di estensione per retrocompatibilità ===

// Messaggio generico per retrocompatibilità
export interface LegacyWebviewMessage {
  type: string;
  [key: string]: any;
} 