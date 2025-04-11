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
 * Type guard generico per verificare se un messaggio è di un tipo specifico
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio da controllare
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends SuggestionsMessageUnion>(
  message: WebviewMessage<any>,
  type: SuggestionsMessageType
): message is T {
  return message?.type === type;
}

/**
 * Type guard per verificare se un messaggio è un SuggestionsMessageUnion
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SuggestionsMessageUnion
 */
export function isSuggestionsMessage(message: WebviewMessage<any>): message is SuggestionsMessageUnion {
  return Object.values(SuggestionsMessageType).includes(message?.type as SuggestionsMessageType);
}

/**
 * Type guard per verificare se un messaggio è una richiesta di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una richiesta di suggerimenti
 */
export function isRequestSuggestionsMessage(message: WebviewMessage<any>): message is RequestSuggestionsMessage {
  return isMessageOfType<RequestSuggestionsMessage>(
    message, 
    SuggestionsMessageType.REQUEST_SUGGESTIONS
  ) && validateRequestSuggestionsPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è un aggiornamento di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un aggiornamento di suggerimenti
 */
export function isSuggestionsUpdatedMessage(message: WebviewMessage<any>): message is SuggestionsUpdatedMessage {
  return isMessageOfType<SuggestionsUpdatedMessage>(
    message, 
    SuggestionsMessageType.SUGGESTIONS_UPDATED
  ) && validateSuggestionsUpdatedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è un'accettazione di suggerimento
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un'accettazione di suggerimento
 */
export function isSuggestionAcceptedMessage(message: WebviewMessage<any>): message is SuggestionAcceptedMessage {
  return isMessageOfType<SuggestionAcceptedMessage>(
    message, 
    SuggestionsMessageType.SUGGESTION_ACCEPTED
  ) && validateSuggestionAcceptedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è un rifiuto di suggerimento
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un rifiuto di suggerimento
 */
export function isSuggestionRejectedMessage(message: WebviewMessage<any>): message is SuggestionRejectedMessage {
  return isMessageOfType<SuggestionRejectedMessage>(
    message, 
    SuggestionsMessageType.SUGGESTION_REJECTED
  ) && validateSuggestionRejectedPayload(message.payload);
}

/**
 * Type guard per verificare se un messaggio è una pulizia di suggerimenti
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è una pulizia di suggerimenti
 */
export function isSuggestionsClearedMessage(message: WebviewMessage<any>): message is SuggestionsClearedMessage {
  return isMessageOfType<SuggestionsClearedMessage>(
    message, 
    SuggestionsMessageType.SUGGESTIONS_CLEARED
  );
}

// Funzioni di validazione dei payload

/**
 * Valida il payload di una richiesta di suggerimenti
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateRequestSuggestionsPayload(payload: any): boolean {
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
 * @param suggestion Il suggerimento da validare
 * @returns True se il suggerimento è valido
 */
function validateSuggestion(suggestion: any): suggestion is Suggestion {
  return (
    typeof suggestion === 'object' &&
    typeof suggestion.id === 'string' &&
    typeof suggestion.text === 'string' &&
    ['code', 'refactor', 'fix', 'general'].includes(suggestion.type) &&
    (!suggestion.preview || typeof suggestion.preview === 'string') &&
    (!suggestion.confidence || (
      typeof suggestion.confidence === 'number' &&
      suggestion.confidence >= 0 &&
      suggestion.confidence <= 100
    ))
  );
}

/**
 * Valida il payload di un aggiornamento di suggerimenti
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionsUpdatedPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    Array.isArray(payload.suggestions) &&
    payload.suggestions.every((suggestion: any) => validateSuggestion(suggestion)) &&
    (!payload.source || typeof payload.source === 'string')
  );
}

/**
 * Valida il payload di un'accettazione di suggerimento
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionAcceptedPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    typeof payload.suggestionId === 'string' &&
    (!payload.applyMode || ['immediate', 'preview'].includes(payload.applyMode))
  );
}

/**
 * Valida il payload di un rifiuto di suggerimento
 * @param payload Il payload da validare
 * @returns True se il payload è valido
 */
function validateSuggestionRejectedPayload(payload: any): boolean {
  return (
    typeof payload === 'object' &&
    typeof payload.suggestionId === 'string' &&
    (!payload.reason || typeof payload.reason === 'string')
  );
} 