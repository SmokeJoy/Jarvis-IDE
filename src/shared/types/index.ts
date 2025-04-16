/**
 * Esportazioni principali dai tipi condivisi
 */

export type { WebviewMessageBase, WebviewMessage, WebviewMessageUnion } from './webview.types';

// Esporta tipi comuni
export type { BaseMessage, MessageRole } from './common';

// Re-esporta tipi chiave dalla definizione dei messaggi
export type { ChatMessage, BaseMessage, MessageRole, WebviewMessage } from './message.js';

export * from './api.types';
export * from './chat.types';
export * from './llm.types';
// export * from './common'; // Esportare solo se necessario e definito
export * from './providers.types';
export * from './settings.types';
export * from './global'; // Aggiunta esportazione per global
// Aggiungere altri file di tipi condivisi qui...

// Tipi per la gestione delle impostazioni
export type { ExtensionSettings, SettingValue, ContextPrompt } from './settings.types';

export * from './message';
export * from './mas-message';
export * from './mas-message-guards';
