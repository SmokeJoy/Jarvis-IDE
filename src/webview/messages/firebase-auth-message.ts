import { z } from 'zod';

export enum FirebaseAuthMessageType {
  SIGN_IN_WITH_TOKEN = 'FIREBASE_AUTH/SIGN_IN_WITH_TOKEN',
  LOGOUT = 'FIREBASE_AUTH/LOGOUT',
  AUTH_STATE_CHANGED = 'FIREBASE_AUTH/AUTH_STATE_CHANGED'
}

export const SignInWithTokenPayload = z.object({
  token: z.string().min(1)
});

export const AuthStateChangedPayload = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  token: z.string().optional()
}).nullable();

export const FirebaseAuthMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN),
    timestamp: z.number(),
    payload: SignInWithTokenPayload
  }),
  z.object({
    type: z.literal(FirebaseAuthMessageType.LOGOUT),
    timestamp: z.number(),
    payload: z.null()
  }),
  z.object({
    type: z.literal(FirebaseAuthMessageType.AUTH_STATE_CHANGED),
    timestamp: z.number(),
    payload: AuthStateChangedPayload
  })
]);

export type FirebaseAuthMessageUnion = z.infer<typeof FirebaseAuthMessageSchema>;