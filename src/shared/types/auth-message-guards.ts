import type {
  AuthMessageUnion,
  RequestAuthTokenMessage,
  AuthStateChangedMessage,
  SignOutMessage,
  AuthCallbackMessage,
  AuthErrorMessage,
  AuthSignedOutMessage,
  AuthMessageType
} from './auth-message';

export function isRequestAuthTokenMessage(msg: unknown): msg is RequestAuthTokenMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.REQUEST_AUTH_TOKEN &&
    'payload' in (msg as any)
  );
}

export function isAuthStateChangedMessage(msg: unknown): msg is AuthStateChangedMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.AUTH_STATE_CHANGED &&
    'payload' in (msg as any)
  );
}

export function isSignOutMessage(msg: unknown): msg is SignOutMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.SIGN_OUT &&
    'payload' in (msg as any)
  );
}

export function isAuthCallbackMessage(msg: unknown): msg is AuthCallbackMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.AUTH_CALLBACK &&
    'payload' in (msg as any)
  );
}

export function isAuthErrorMessage(msg: unknown): msg is AuthErrorMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.AUTH_ERROR &&
    'payload' in (msg as any)
  );
}

export function isAuthSignedOutMessage(msg: unknown): msg is AuthSignedOutMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === AuthMessageType.AUTH_SIGNED_OUT &&
    'payload' in (msg as any)
  );
} 