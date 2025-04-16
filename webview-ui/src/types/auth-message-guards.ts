/**
 * @file auth-message-guards.ts
 * @description Type guards per la verifica dei tipi di messaggi di autenticazione
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import { 
  AuthMessageType,
  AuthMessageUnion,
  RequestAuthTokenMessage,
  AuthStateChangedMessage,
  SignOutMessage,
  AuthCallbackMessage,
  AuthErrorMessage,
  AuthSignedOutMessage,
  SimplifiedUser
} from './auth-message';

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico di autenticazione
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio atteso
 * @returns True se il messaggio è del tipo specificato
 */
export function isAuthMessageOfType<T extends AuthMessageUnion>(
  message: unknown,
  type: AuthMessageType
): message is T {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as any).type === type
  );
}

/**
 * Type guard per verificare se un messaggio è un RequestAuthTokenMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un RequestAuthTokenMessage
 */
export function isRequestAuthTokenMessage(message: unknown): message is RequestAuthTokenMessage {
  return isAuthMessageOfType<RequestAuthTokenMessage>(message, AuthMessageType.REQUEST_AUTH_TOKEN);
}

/**
 * Type guard per verificare se un messaggio è un AuthStateChangedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthStateChangedMessage
 */
export function isAuthStateChangedMessage(message: unknown): message is AuthStateChangedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: unknown }).type === AuthMessageType.AUTH_STATE_CHANGED &&
    'payload' in message &&
    typeof (message as { payload?: unknown }).payload === 'object' &&
    'user' in (message as { payload: { user?: unknown } }).payload
  );
}

/**
 * Type guard per verificare se un messaggio è un SignOutMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SignOutMessage
 */
export function isSignOutMessage(message: unknown): message is SignOutMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: unknown }).type === AuthMessageType.SIGN_OUT &&
    'payload' in message &&
    typeof (message as { payload?: unknown }).payload === 'object'
  );
}

/**
 * Type guard per verificare se un messaggio è un AuthCallbackMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthCallbackMessage
 */
export function isAuthCallbackMessage(message: unknown): message is AuthCallbackMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: unknown }).type === AuthMessageType.AUTH_CALLBACK &&
    'payload' in message &&
    typeof (message as { payload?: unknown }).payload === 'object' &&
    'customToken' in (message as { payload: { customToken?: unknown } }).payload &&
    typeof (message as { payload: { customToken?: unknown } }).payload.customToken === 'string'
  );
}

/**
 * Type guard per verificare se un messaggio è un AuthErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthErrorMessage
 */
export function isAuthErrorMessage(message: unknown): message is AuthErrorMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: unknown }).type === AuthMessageType.AUTH_ERROR &&
    'payload' in message &&
    typeof (message as { payload?: unknown }).payload === 'object' &&
    'error' in (message as { payload: { error?: unknown } }).payload &&
    typeof (message as { payload: { error?: unknown } }).payload.error === 'string'
  );
}

/**
 * Type guard per verificare se un messaggio è un AuthSignedOutMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthSignedOutMessage
 */
export function isAuthSignedOutMessage(message: unknown): message is AuthSignedOutMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: unknown }).type === AuthMessageType.AUTH_SIGNED_OUT &&
    'payload' in message &&
    typeof (message as { payload?: unknown }).payload === 'object'
  );
}

/**
 * Type guard per verificare se un oggetto è un SimplifiedUser
 * @param obj L'oggetto da verificare
 * @returns True se l'oggetto è un SimplifiedUser
 */
export function isSimplifiedUser(obj: unknown): obj is SimplifiedUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'displayName' in obj &&
    ('email' in obj) &&
    ('photoURL' in obj)
  );
}

/**
 * Type guard generico per verificare se un messaggio è un messaggio di autenticazione
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthMessageUnion
 */
export function isAuthMessage(message: unknown): message is AuthMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    Object.values(AuthMessageType).includes((message as { type?: unknown }).type as AuthMessageType)
  );
} 