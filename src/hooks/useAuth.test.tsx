import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should login successfully with valid credentials', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('should handle login errors', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('invalid@example.com', 'wrong');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.user).toBeNull();
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth());

    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });
});
