import { z } from 'zod';
import { FirebaseAuthMessageType, FirebaseAuthMessageUnion, SignInWithTokenPayload, AuthStateChangedPayload } from './firebase-auth-message';

export const isAuthStateChangedMessage = (
  message: FirebaseAuthMessageUnion
): message is FirebaseAuthMessageUnion<FirebaseAuthMessageType.AUTH_STATE_CHANGED> => {
  return message.type === FirebaseAuthMessageType.AUTH_STATE_CHANGED;
};

export const isSignInWithTokenMessage = (
  message: FirebaseAuthMessageUnion
): message is FirebaseAuthMessageUnion<FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN> => {
  return message.type === FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN;
};

export const isLogoutMessage = (
  message: FirebaseAuthMessageUnion
): message is FirebaseAuthMessageUnion<FirebaseAuthMessageType.LOGOUT> => {
  return message.type === FirebaseAuthMessageType.LOGOUT;
};

export const isTokenRefreshedMessage = (
  message: FirebaseAuthMessageUnion
): message is FirebaseAuthMessageUnion<FirebaseAuthMessageType.TOKEN_REFRESHED> => {
  return message.type === FirebaseAuthMessageType.TOKEN_REFRESHED;
};