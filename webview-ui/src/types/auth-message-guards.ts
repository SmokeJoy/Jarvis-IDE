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
  message: WebviewMessage<any>, 
  type: AuthMessageType
): message is T {
  return message?.type === type;
}

/**
 * Type guard per verificare se un messaggio è un RequestAuthTokenMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un RequestAuthTokenMessage
 */
export function isRequestAuthTokenMessage(message: WebviewMessage<any>): message is RequestAuthTokenMessage {
  return isAuthMessageOfType<RequestAuthTokenMessage>(message, AuthMessageType.REQUEST_AUTH_TOKEN);
}

/**
 * Type guard per verificare se un messaggio è un AuthStateChangedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthStateChangedMessage
 */
export function isAuthStateChangedMessage(message: WebviewMessage<any>): message is AuthStateChangedMessage {
  return isAuthMessageOfType<AuthStateChangedMessage>(message, AuthMessageType.AUTH_STATE_CHANGED) &&
         typeof message?.payload === 'object' &&
         (message.payload.user === null || isSimplifiedUser(message.payload.user));
}

/**
 * Type guard per verificare se un messaggio è un SignOutMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SignOutMessage
 */
export function isSignOutMessage(message: WebviewMessage<any>): message is SignOutMessage {
  return isAuthMessageOfType<SignOutMessage>(message, AuthMessageType.SIGN_OUT);
}

/**
 * Type guard per verificare se un messaggio è un AuthCallbackMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthCallbackMessage
 */
export function isAuthCallbackMessage(message: WebviewMessage<any>): message is AuthCallbackMessage {
  return isAuthMessageOfType<AuthCallbackMessage>(message, AuthMessageType.AUTH_CALLBACK) &&
         typeof message?.payload === 'object' &&
         typeof message.payload.customToken === 'string';
}

/**
 * Type guard per verificare se un messaggio è un AuthErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthErrorMessage
 */
export function isAuthErrorMessage(message: WebviewMessage<any>): message is AuthErrorMessage {
  return isAuthMessageOfType<AuthErrorMessage>(message, AuthMessageType.AUTH_ERROR) &&
         typeof message?.payload === 'object' &&
         typeof message.payload.error === 'string';
}

/**
 * Type guard per verificare se un messaggio è un AuthSignedOutMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthSignedOutMessage
 */
export function isAuthSignedOutMessage(message: WebviewMessage<any>): message is AuthSignedOutMessage {
  return isAuthMessageOfType<AuthSignedOutMessage>(message, AuthMessageType.AUTH_SIGNED_OUT);
}

/**
 * Type guard per verificare se un oggetto è un SimplifiedUser
 * @param obj L'oggetto da verificare
 * @returns True se l'oggetto è un SimplifiedUser
 */
export function isSimplifiedUser(obj: any): obj is SimplifiedUser {
  return obj !== null &&
         typeof obj === 'object' &&
         (obj.displayName === null || typeof obj.displayName === 'string') &&
         (obj.email === null || typeof obj.email === 'string') &&
         (obj.photoURL === null || typeof obj.photoURL === 'string');
}

/**
 * Type guard generico per verificare se un messaggio è un messaggio di autenticazione
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AuthMessageUnion
 */
export function isAuthMessage(message: WebviewMessage<any>): message is AuthMessageUnion {
  return Object.values(AuthMessageType).includes(message?.type as AuthMessageType);
} 