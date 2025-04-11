import { useState, useEffect } from 'react';
import { FirebaseAuthMessageType, FirebaseAuthMessageUnion } from '../messages/firebase-auth-message';
import { isAuthStateChangedMessage, isSignInWithTokenMessage, isLogoutMessage } from '../messages/firebase-auth-message-guards';

type FirebaseAuthPanelProps = {
  dispatch: (message: FirebaseAuthMessageUnion) => void;
};

export const FirebaseAuthPanel = ({ dispatch }: FirebaseAuthPanelProps) => {
  const [user, setUser] = useState<{ userId: string; email: string; token: string } | null>(null);

  const handleSignIn = (token: string) => {
    dispatch({
      type: FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN,
      timestamp: Date.now(),
      payload: { token }
    });
  };

  const handleLogout = () => {
    dispatch({
      type: FirebaseAuthMessageType.LOGOUT,
      timestamp: Date.now(),
      payload: null
    });
  };

  useEffect(() => {
    const handleAuthStateChange = (message: FirebaseAuthMessageUnion) => {
      if (isAuthStateChangedMessage(message)) {
        setUser(message.payload);
      }
    };

    // Simulazione listener messaggi in ingresso
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