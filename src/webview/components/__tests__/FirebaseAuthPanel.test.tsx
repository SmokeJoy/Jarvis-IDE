import { render, screen, fireEvent } from '@testing-library/react';
import { FirebaseAuthPanel } from '../FirebaseAuthPanel';
import { FirebaseAuthMessageType } from '../../messages/firebase-auth-message';
import { isAuthStateChangedMessage, isLogoutMessage } from '../../messages/firebase-auth-message-guards';

describe('FirebaseAuthPanel', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dovrebbe inviare un messaggio di login al click del bottone', () => {
    render(<FirebaseAuthPanel dispatch={mockDispatch} />);
    
    fireEvent.click(screen.getByText('Sign in with Token'));
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: FirebaseAuthMessageType.SIGN_IN_WITH_TOKEN,
      timestamp: expect.any(Number),
      payload: { token: 'demo-token' }
    });
  });

  it('dovrebbe inviare un messaggio di logout al click del bottone', () => {
    render(<FirebaseAuthPanel dispatch={mockDispatch} />);
    
    fireEvent.click(screen.getByText('Sign in with Token'));
    fireEvent.click(screen.getByText('Logout'));
    
    const logoutCall = mockDispatch.mock.calls.find(call => 
      isLogoutMessage(call[0])
    );
    
    expect(logoutCall).toBeDefined();
    expect(logoutCall[0].type).toBe(FirebaseAuthMessageType.LOGOUT);
  });

  it('dovrebbe aggiornare lo stato utente al ricevere un messaggio AUTH_STATE_CHANGED', () => {
    const testUser = {
      userId: '123',
      email: 'test@example.com',
      token: 'test-token'
    };
    
    render(<FirebaseAuthPanel dispatch={mockDispatch} />);
    
    window.postMessage({
      type: FirebaseAuthMessageType.AUTH_STATE_CHANGED,
      timestamp: Date.now(),
      payload: testUser
    }, '*');
    
    expect(screen.getByText(/Logged in as: test@example.com/)).toBeInTheDocument();
  });
});