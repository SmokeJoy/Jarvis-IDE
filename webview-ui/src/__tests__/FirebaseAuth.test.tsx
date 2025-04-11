/**
 * @file FirebaseAuth.test.tsx
 * @description Test per il componente FirebaseAuthContext
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FirebaseAuthProvider, useFirebaseAuth } from '../context/FirebaseAuthContext';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { AuthMessageType, AuthCallbackMessage, AuthErrorMessage } from '../types/auth-message';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';

// Mock di firebase/auth
vi.mock('firebase/auth', () => {
  const originalModule = vi.importActual('firebase/auth');
  
  return {
    ...originalModule,
    getAuth: vi.fn(() => ({
      onAuthStateChanged: vi.fn((callback) => {
        // Simuliamo un utente non autenticato inizialmente
        callback(null);
        return vi.fn(); // Ritorna un unsubscribe mock
      }),
    })),
    signInWithCustomToken: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
  };
});

// Mock di firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock di useExtensionMessage
vi.mock('../hooks/useExtensionMessage', () => ({
  useExtensionMessage: vi.fn(),
}));

// Componente di test che utilizza il contexto di autenticazione
const TestComponent = () => {
  const { user, isInitialized, requestAuthToken, handleSignOut } = useFirebaseAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isInitialized ? 'initialized' : 'not-initialized'}
      </div>
      <div data-testid="user-status">
        {user ? `logged-in: ${user.email}` : 'logged-out'}
      </div>
      <button data-testid="request-token" onClick={() => requestAuthToken()}>
        Request Token
      </button>
      <button data-testid="sign-out" onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  );
};

describe('FirebaseAuthContext', () => {
  let mockPostMessage: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup del mock per postMessage
    mockPostMessage = vi.fn();
    (useExtensionMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      postMessage: mockPostMessage,
    });
  });
  
  test('renderizza correttamente e inizializza Firebase', () => {
    render(
      <FirebaseAuthProvider>
        <TestComponent />
      </FirebaseAuthProvider>
    );
    
    // Verifica che il provider abbia inizializzato correttamente l'autenticazione
    expect(screen.getByTestId('auth-status')).toHaveTextContent('initialized');
    expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
  });
  
  test('richiede un token di autenticazione usando un messaggio type-safe', () => {
    render(
      <FirebaseAuthProvider>
        <TestComponent />
      </FirebaseAuthProvider>
    );
    
    // Simulazione del click sul pulsante di richiesta token
    act(() => {
      screen.getByTestId('request-token').click();
    });
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: AuthMessageType.REQUEST_AUTH_TOKEN,
    });
  });
  
  test('gestisce la ricezione di un token e esegue il login', async () => {
    render(
      <FirebaseAuthProvider>
        <TestComponent />
      </FirebaseAuthProvider>
    );
    
    // Simulazione della ricezione di un messaggio di callback con token
    const callbackMessage: AuthCallbackMessage = {
      type: AuthMessageType.AUTH_CALLBACK,
      payload: {
        customToken: 'test-token-123',
      },
    };
    
    // Simuliamo la ricezione di un messaggio
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: callbackMessage })
      );
    });
    
    // Verifica che signInWithCustomToken sia stato chiamato con il token corretto
    await waitFor(() => {
      expect(signInWithCustomToken).toHaveBeenCalledWith(
        expect.anything(),
        'test-token-123'
      );
    });
  });
  
  test('gestisce il logout e invia un messaggio type-safe', async () => {
    render(
      <FirebaseAuthProvider>
        <TestComponent />
      </FirebaseAuthProvider>
    );
    
    // Simulazione del click sul pulsante di logout
    act(() => {
      screen.getByTestId('sign-out').click();
    });
    
    // Verifica che postMessage sia stato chiamato con il messaggio corretto
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: AuthMessageType.SIGN_OUT,
    });
    
    // Verifica che signOut sia stato chiamato
    expect(signOut).toHaveBeenCalled();
  });
  
  test('gestisce errori di autenticazione', async () => {
    // Spia del console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <FirebaseAuthProvider>
        <TestComponent />
      </FirebaseAuthProvider>
    );
    
    // Simulazione della ricezione di un messaggio di errore
    const errorMessage: AuthErrorMessage = {
      type: AuthMessageType.AUTH_ERROR,
      payload: {
        error: 'Authentication failed',
      },
    };
    
    // Simuliamo la ricezione di un messaggio
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: errorMessage })
      );
    });
    
    // Verifica che l'errore sia stato registrato
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Authentication error:',
        'Authentication failed'
      );
    });
    
    consoleErrorSpy.mockRestore();
  });
}); 

