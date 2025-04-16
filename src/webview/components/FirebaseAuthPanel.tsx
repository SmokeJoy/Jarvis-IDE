import React, { useState, useEffect } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import type {
  FirebaseAuthMessage,
  SignInWithTokenPayload,
  AuthStateChangedPayload,
} from '../messages/firebase-auth-message';
import { FirebaseAuthMessageType } from '../messages/firebase-auth-message';
import {
  isAuthStateChangedMessage,
  isSignInWithTokenMessage,
  isLogoutMessage,
} from '../messages/firebase-auth-message-guards';
import { getVsCodeApi } from '../vscode';

type FirebaseAuthPanelProps = {
  dispatch: (message: FirebaseAuthMessage) => void;
};

export const FirebaseAuthPanel = ({ dispatch }: FirebaseAuthPanelProps) => {
  const [user, setUser] = useState<{ userId: string; email: string; token: string } | null>(null);
  const vscode = getVsCodeApi();

  const handleSignIn = (token: string) => {
    dispatch({
      type: FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN,
      timestamp: Date.now(),
      payload: { token },
    });
  };

  const handleLogout = () => {
    dispatch({
      type: FirebaseAuthMessageType.LOGOUT,
      timestamp: Date.now(),
      payload: null,
    });
  };

  useEffect(() => {
    const handleAuthStateChange = (event: MessageEvent) => {
      const message = event.data as Partial<FirebaseAuthMessage>;

      if (message && isAuthStateChangedMessage(message as FirebaseAuthMessage)) {
        const payload = message.payload;
        if (payload &&
            'userId' in payload && typeof payload.userId === 'string' &&
            'email' in payload && typeof payload.email === 'string' &&
            'token' in payload && typeof payload.token === 'string') {
          setUser({
            userId: payload.userId,
            email: payload.email,
            token: payload.token
          });
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('message', handleAuthStateChange);
    return () => window.removeEventListener('message', handleAuthStateChange);
  }, []);

  return (
    <div className="auth-panel">
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => handleSignIn('demo-token')}>Sign in with Token</button>
      )}
    </div>
  );
};
