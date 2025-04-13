import { WebviewMessage } from '../../shared/types/webview.types';

export enum FirebaseAuthMessageType {
  AUTH_STATE_CHANGED = 'authStateChanged',
  SIGN_IN_WITH_TOKEN = 'signInWithToken',
  LOGOUT = 'logout',
}

export interface AuthStateChangedPayload {
  userId?: string;
  email?: string;
  token?: string;
}

export interface SignInWithTokenPayload {
  token: string;
}

export interface AuthStateChangedMessage
  extends WebviewMessage<FirebaseAuthMessageType.AUTH_STATE_CHANGED> {
  type: FirebaseAuthMessageType.AUTH_STATE_CHANGED;
  payload: AuthStateChangedPayload | null;
}

export interface SignInWithTokenMessage
  extends WebviewMessage<FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN> {
  type: FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN;
  payload: SignInWithTokenPayload;
}

export interface LogoutMessage extends WebviewMessage<FirebaseAuthMessageType.LOGOUT> {
  type: FirebaseAuthMessageType.LOGOUT;
  payload: null;
}

export type FirebaseAuthMessage = AuthStateChangedMessage | SignInWithTokenMessage | LogoutMessage;
