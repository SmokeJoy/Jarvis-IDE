/**
 * Definizione del tipo ChatSession che rappresenta una sessione di chat completa
 * Include messaggi, impostazioni e altri metadati
 */

import { ChatMessage } from './index';
import { ChatSettings } from './settings.types';

/**
 * Interfaccia per una sessione di chat completa
 */
export interface ChatSession {
  /** ID univoco della sessione */
  id: string;

  /** Titolo della sessione */
  title: string;

  /** Timestamp di creazione */
  createdAt: number;

  /** Array di messaggi della chat */
  messages: ChatMessage[];

  /** Impostazioni della chat */
  settings: ChatSettings;

  /** Prompt di sistema (opzionale) */
  systemPrompt?: string;

  /** File di contesto utilizzati (opzionale) */
  contextFiles?: string[];

  /** ID del modello utilizzato (opzionale) */
  modelId?: string;

  /** Timestamp dell'ultimo aggiornamento (opzionale) */
  updatedAt?: number;
}

/**
 * Tipo per le opzioni di creazione sessione
 */
export interface CreateSessionOptions {
  title?: string;
  messages?: ChatMessage[];
  settings?: ChatSettings;
  systemPrompt?: string;
  contextFiles?: string[];
  modelId?: string;
}

/**
 * Crea una nuova sessione di chat con valori predefiniti
 * @param options - Opzioni per la creazione della sessione
 * @returns Una nuova sessione di chat
 */
export function createChatSession(options: CreateSessionOptions = {}): ChatSession {
  const timestamp = Date.now();

  return {
    id: `session_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    title: options.title || `Sessione ${new Date(timestamp).toLocaleString()}`,
    createdAt: timestamp,
    messages: options.messages || [],
    settings: options.settings || {},
    systemPrompt: options.systemPrompt,
    contextFiles: options.contextFiles,
    modelId: options.modelId,
    updatedAt: timestamp,
  };
}

/**
 * Verifica se un oggetto è una sessione di chat valida
 * @param obj - Oggetto da verificare
 * @returns true se l'oggetto è una sessione di chat valida
 */
export function isChatSession(obj: unknown): obj is ChatSession {
  if (!obj || typeof obj !== 'object') return false;

  const session = obj as ChatSession;

  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    typeof session.createdAt === 'number' &&
    Array.isArray(session.messages) &&
    session.settings !== undefined &&
    typeof session.settings === 'object'
  );
}
