/**
 * @file useThreadScrollLock.test.ts
 * @description Test Jest per useThreadScrollLock — verifica comportamento hook scroll thread in edge-case
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useThreadScrollLock from '../../src/hooks/useThreadScrollLock';

// Simula ambiente DOM minimo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

describe('useThreadScrollLock', () => {
  it('deve bloccare lo scroll quando lockThread è chiamato', () => {
    const { result } = renderHook(() => useThreadScrollLock());
    // Act
    act(() => {
      result.current.lockThread();
    });
    // Assert
    expect(result.current.isLocked).toBe(true);
  });

  it('deve sbloccare lo scroll quando unlockThread è chiamato', () => {
    const { result } = renderHook(() => useThreadScrollLock());
    // Act
    act(() => {
      result.current.lockThread();
      result.current.unlockThread();
    });
    // Assert
    expect(result.current.isLocked).toBe(false);
  });

  it('lo status di lock deve essere consistente tra operazioni ripetute', () => {
    const { result } = renderHook(() => useThreadScrollLock());
    act(() => {
      result.current.lockThread();
      result.current.unlockThread();
      result.current.lockThread();
    });
    expect(result.current.isLocked).toBe(true);
  });

  // Edge-case: chiamare unlock se già sbloccato
  it('non dovrebbe produrre errori chiamando unlockThread su thread già sbloccato', () => {
    const { result } = renderHook(() => useThreadScrollLock());
    act(() => {
      result.current.unlockThread();
    });
    expect(result.current.isLocked).toBe(false);
  });

  // Snapshot utile se ci fosse stato DOM complesso
  // it('snapshot stato dopo lock', () => {
  //   const { result } = renderHook(() => useThreadScrollLock());
  //   act(() => { result.current.lockThread(); });
  //   expect(result.current).toMatchSnapshot();
  // });
});