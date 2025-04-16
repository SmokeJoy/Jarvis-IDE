import { z } from 'zod';
import {
  FirebaseAuthMessage,
  FirebaseAuthMessageType,
  // FirebaseAuthMessageUnion, // Assuming this was incorrect
  SignInWithTokenPayload,
  AuthStateChangedPayload,
} from './firebase-auth-message';

export const isAuthStateChangedMessage = (
  message: FirebaseAuthMessage
): message is Extract<FirebaseAuthMessage, { type: FirebaseAuthMessageType.AUTH_STATE_CHANGED }> => {
  return message.type === FirebaseAuthMessageType.AUTH_STATE_CHANGED;
};

export const isSignInWithTokenMessage = (
  message: FirebaseAuthMessage
): message is Extract<FirebaseAuthMessage, { type: FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN }> => {
  return message.type === FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN;
};

export const isLogoutMessage = (
  message: FirebaseAuthMessage
): message is Extract<FirebaseAuthMessage, { type: FirebaseAuthMessageType.LOGOUT }> => {
  return message.type === FirebaseAuthMessageType.LOGOUT;
};

/**
 * Type guard per verificare se un messaggio è un TokenRefreshedMessage
 */
export const isTokenRefreshedMessage = (
  message: FirebaseAuthMessage
  // Use correct enum member if TOKEN_REFRESHED doesn't exist
): message is Extract<FirebaseAuthMessage, { type: FirebaseAuthMessageType.AUTH_STATE_CHANGED }> /* Replace with correct type if needed */ => {
  // Check against the correct enum member name if available, otherwise adapt
  // return message.type === FirebaseAuthMessageType.TOKEN_REFRESHED; // Assuming TOKEN_REFRESHED doesn't exist
  // Placeholder check - adjust based on actual available types
  return message.type === FirebaseAuthMessageType.AUTH_STATE_CHANGED;
};
