/**
 * @file auth-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi di autenticazione
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import type { User } from 'firebase/auth';

/**
 * Enum per i tipi di messaggi di autenticazione
 */
export enum AuthMessageType {
  // Richieste al backend
  REQUEST_AUTH_TOKEN = 'requestAuthToken',
  AUTH_STATE_CHANGED = 'authStateChanged',
  SIGN_OUT = 'signOut',
  
  // Risposte dal backend
  AUTH_CALLBACK = 'authCallback',
  AUTH_ERROR = 'authError',
  AUTH_SIGNED_OUT = 'authSignedOut'
}

/**
 * Interfaccia base per tutti i messaggi di autenticazione
 */
export interface AuthMessageBase extends WebviewMessageUnion {
  type: AuthMessageType | string;
}

/**
 * Interfaccia per l'utente semplificato da inviare all'estensione
 */
export interface SimplifiedUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Messaggio per richiedere un token di autenticazione
 */
export interface RequestAuthTokenMessage extends AuthMessageBase {
  type: AuthMessageType.REQUEST_AUTH_TOKEN;
  payload?: {
    provider?: string;
  };
}

/**
 * Messaggio per notificare un cambiamento nello stato di autenticazione
 */
export interface AuthStateChangedMessage extends AuthMessageBase {
  type: AuthMessageType.AUTH_STATE_CHANGED;
  payload: {
    user: SimplifiedUser | null;
  };
}

/**
 * Messaggio per richiedere il logout
 */
export interface SignOutMessage extends AuthMessageBase {
  type: AuthMessageType.SIGN_OUT;
}

/**
 * Messaggio di callback di autenticazione con token
 */
export interface AuthCallbackMessage extends AuthMessageBase {
  type: AuthMessageType.AUTH_CALLBACK;
  payload: {
    customToken: string;
  };
}

/**
 * Messaggio di errore di autenticazione
 */
export interface AuthErrorMessage extends AuthMessageBase {
  type: AuthMessageType.AUTH_ERROR;
  payload: {
    error: string;
    code?: string;
  };
}

/**
 * Messaggio di conferma di logout
 */
export interface AuthSignedOutMessage extends AuthMessageBase {
  type: AuthMessageType.AUTH_SIGNED_OUT;
}

/**
 * Unione discriminata di tutti i tipi di messaggi di autenticazione
 */
export type AuthMessageUnion =
  | RequestAuthTokenMessage
  | AuthStateChangedMessage
  | SignOutMessage
  | AuthCallbackMessage
  | AuthErrorMessage
  | AuthSignedOutMessage; 