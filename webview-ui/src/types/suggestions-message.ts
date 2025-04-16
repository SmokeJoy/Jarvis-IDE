/**
 * @file suggestions-message.ts
 * @description Definizione dei tipi di messaggi per il pannello dei suggerimenti
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import type { WebviewMessage } from '@shared/types/webview.types';

/**
 * Enumerazione dei tipi di messaggio per il pannello dei suggerimenti
 */
export enum SuggestionsMessageType {
  REQUEST_SUGGESTIONS = 'requestSuggestions',
  SUGGESTIONS_UPDATED = 'suggestionsUpdated',
  SUGGESTION_ACCEPTED = 'suggestionAccepted',
  SUGGESTION_REJECTED = 'suggestionRejected',
  SUGGESTIONS_CLEARED = 'suggestionsCleared'
}

/**
 * Interfaccia base per tutti i messaggi di suggerimenti
 */
export interface SuggestionsMessageBase<T extends SuggestionsMessageType = SuggestionsMessageType, P = unknown> extends WebviewMessage<T> {
  type: T;
  payload: P;
}

/**
 * Interfaccia per il messaggio di richiesta suggerimenti
 */
export interface RequestSuggestionsMessage extends SuggestionsMessageBase<SuggestionsMessageType.REQUEST_SUGGESTIONS> {
  type: SuggestionsMessageType.REQUEST_SUGGESTIONS;
  payload: {
    context?: string;
    currentFile?: string;
    selectedText?: string;
  };
}

/**
 * Interfaccia per il formato di un singolo suggerimento
 */
export interface Suggestion {
  id: string;
  text: string;
  type: 'code' | 'refactor' | 'fix' | 'general';
  preview?: string;
  confidence?: number; // 0-100
}

/**
 * Interfaccia per il messaggio di aggiornamento suggerimenti
 */
export interface SuggestionsUpdatedMessage extends SuggestionsMessageBase<SuggestionsMessageType.SUGGESTIONS_UPDATED> {
  type: SuggestionsMessageType.SUGGESTIONS_UPDATED;
  payload: {
    suggestions: Suggestion[];
    source?: string;
  };
}

/**
 * Interfaccia per il messaggio di accettazione di un suggerimento
 */
export interface SuggestionAcceptedMessage extends SuggestionsMessageBase<SuggestionsMessageType.SUGGESTION_ACCEPTED> {
  type: SuggestionsMessageType.SUGGESTION_ACCEPTED;
  payload: {
    suggestionId: string;
    // Opzioni aggiuntive per l'accettazione
    applyMode?: 'immediate' | 'preview';
  };
}

/**
 * Interfaccia per il messaggio di rifiuto di un suggerimento
 */
export interface SuggestionRejectedMessage extends SuggestionsMessageBase<SuggestionsMessageType.SUGGESTION_REJECTED> {
  type: SuggestionsMessageType.SUGGESTION_REJECTED;
  payload: {
    suggestionId: string;
    reason?: string;
  };
}

/**
 * Interfaccia per il messaggio di pulizia dei suggerimenti
 */
export interface SuggestionsClearedMessage extends SuggestionsMessageBase<SuggestionsMessageType.SUGGESTIONS_CLEARED, { reason?: string } | undefined> {
  type: SuggestionsMessageType.SUGGESTIONS_CLEARED;
  payload: { reason?: string } | undefined;
}

/**
 * Unione discriminata di tutti i tipi di messaggi per i suggerimenti
 */
export type SuggestionsMessageUnion =
  | RequestSuggestionsMessage
  | SuggestionsUpdatedMessage
  | SuggestionAcceptedMessage
  | SuggestionRejectedMessage
  | SuggestionsClearedMessage; 