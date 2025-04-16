/**
 * @file auth-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi di autenticazione
 * @version 1.0.0
 */

import type { WebviewMessage } from '@shared/types/webview.types';
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
export interface AuthMessageBase<T extends AuthMessageType = AuthMessageType, P = unknown> extends WebviewMessage<T> {
  type: T;
  payload: P;
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
export interface RequestAuthTokenMessage extends AuthMessageBase<AuthMessageType.REQUEST_AUTH_TOKEN, { provider?: string } | undefined> {
  type: AuthMessageType.REQUEST_AUTH_TOKEN;
  payload: { provider?: string } | undefined;
}

/**
 * Messaggio per notificare un cambiamento nello stato di autenticazione
 */
export interface AuthStateChangedMessage extends AuthMessageBase<AuthMessageType.AUTH_STATE_CHANGED, { user: SimplifiedUser | null }> {
  type: AuthMessageType.AUTH_STATE_CHANGED;
  payload: { user: SimplifiedUser | null };
}

/**
 * Messaggio per richiedere il logout
 */
export interface SignOutMessage extends AuthMessageBase<AuthMessageType.SIGN_OUT, undefined> {
  type: AuthMessageType.SIGN_OUT;
  payload: undefined;
}

/**
 * Messaggio di callback di autenticazione con token
 */
export interface AuthCallbackMessage extends AuthMessageBase<AuthMessageType.AUTH_CALLBACK, { customToken: string }> {
  type: AuthMessageType.AUTH_CALLBACK;
  payload: { customToken: string };
}

/**
 * Messaggio di errore di autenticazione
 */
export interface AuthErrorMessage extends AuthMessageBase<AuthMessageType.AUTH_ERROR, { error: string; code?: string }> {
  type: AuthMessageType.AUTH_ERROR;
  payload: { error: string; code?: string };
}

/**
 * Messaggio di conferma di logout
 */
export interface AuthSignedOutMessage extends AuthMessageBase<AuthMessageType.AUTH_SIGNED_OUT, undefined> {
  type: AuthMessageType.AUTH_SIGNED_OUT;
  payload: undefined;
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