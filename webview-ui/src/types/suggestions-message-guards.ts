/**
 * @file suggestions-message-guards.ts
 * @description Type guards per i messaggi del pannello dei suggerimenti
 * @version 1.0.0
 */

import { WebviewMessage } from '../../../src/shared/types/webview.types';
import {
  SuggestionsMessageType,
  SuggestionsMessageUnion,
  RequestSuggestionsMessage,
  SuggestionsUpdatedMessage,
  SuggestionAcceptedMessage,
  SuggestionRejectedMessage,
  SuggestionsClearedMessage,
  Suggestion
} from './suggestions-message';

/**
 * Type for unknown message payload
 */
type UnknownPayload = Record<string, unknown>;

/**
 * Type for suggestion type
 */
type SuggestionType = 'code' | 'refactor' | 'fix' | 'general';

/**
 * Type for suggestion apply mode
 */
type ApplyMode = 'immediate' | 'preview';

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio da controllare
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends SuggestionsMessageUnion>(
  message: unknown,
  type: SuggestionsMessageType
): message is T {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as any).type === type
  );
}

/**
 * Type guard per verificare se un messaggio è un SuggestionsMessageUnion
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SuggestionsMessageUnion
 */
export function isSuggestionsMessage(message: unknown): message is SuggestionsMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    Object.values(SuggestionsMessageType).includes((message as any).type)
  );
}

/**
 * Type guard per verificare se un messaggio è una richiesta di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di suggerimenti
 */
export function isRequestSuggestionsMessage(message: unknown): message is RequestSuggestionsMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === SuggestionsMessageType.REQUEST_SUGGESTIONS &&
    'payload' in message
  );
}

/**
 * Type guard per verificare se un messaggio è un aggiornamento di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un aggiornamento di suggerimenti
 */
export function isSuggestionsUpdatedMessage(message: unknown): message is SuggestionsUpdatedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === SuggestionsMessageType.SUGGESTIONS_UPDATED &&
    'payload' in message
  );
}

/**
 * Type guard per verificare se un messaggio è un'accettazione di suggerimento
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un'accettazione di suggerimento
 */
export function isSuggestionAcceptedMessage(message: unknown): message is SuggestionAcceptedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === SuggestionsMessageType.SUGGESTION_ACCEPTED &&
    'payload' in message
  );
}

/**
 * Type guard per verificare se un messaggio è un rifiuto di suggerimento
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un rifiuto di suggerimento
 */
export function isSuggestionRejectedMessage(message: unknown): message is SuggestionRejectedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === SuggestionsMessageType.SUGGESTION_REJECTED &&
    'payload' in message
  );
}

/**
 * Type guard per verificare se un messaggio è una pulizia di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una pulizia di suggerimenti
 */
export function isSuggestionsClearedMessage(message: unknown): message is SuggestionsClearedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === SuggestionsMessageType.SUGGESTIONS_CLEARED &&
    ('payload' in message ? typeof (msg.payload as unknown) === 'object' || typeof (msg.payload as unknown) === 'undefined' : true)
  );
}

// Funzioni di validazione dei payload

/**
 * Valida il payload di una richiesta di suggerimenti
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateRequestSuggestionsPayload(payload: UnknownPayload): boolean {
  // La richiesta può avere payload opzionale o vuoto
  if (!payload) return true;
  
  return (
    typeof payload === 'object' &&
    (!payload.context || typeof payload.context === 'string') &&
    (!payload.currentFile || typeof payload.currentFile === 'string') &&
    (!payload.selectedText || typeof payload.selectedText === 'string')
  );
}

/**
 * Valida un oggetto suggerimento
 * @param payload Il suggerimento da validare
 * @returns True se il suggerimento è valido
 */
export function validateSuggestion(payload: unknown): payload is Suggestion {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'text' in payload &&
    typeof (payload as any).text === 'string'
  );
}

/**
 * Valida il payload di un aggiornamento di suggerimenti
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionsUpdatedPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    Array.isArray(payload.suggestions) &&
    payload.suggestions.every((suggestion: unknown) => validateSuggestion(suggestion as UnknownPayload)) &&
    (!payload.source || typeof payload.source === 'string')
  );
}

/**
 * Valida il payload di un'accettazione di suggerimento
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionAcceptedPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    typeof payload.suggestionId === 'string' &&
    (!payload.applyMode || ['immediate', 'preview'].includes(payload.applyMode as ApplyMode))
  );
}

/**
 * Valida il payload di un rifiuto di suggerimento
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionRejectedPayload(payload: UnknownPayload): boolean {
  return (
    typeof payload === 'object' &&
    typeof payload.reason === 'string'
  );
} 