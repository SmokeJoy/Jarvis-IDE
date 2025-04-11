import { renderHook, act } from '@testing-library/react';
import { useProviderBlacklist } from '../../hooks/useProviderBlacklist';
import { useEventBus } from '../../hooks/useEventBus';

// Mock useEventBus
jest.mock('../../hooks/useEventBus', () => ({
  useEventBus: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

describe('useProviderBlacklist', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty blacklist', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    expect(result.current.blacklist).toEqual({});
  });

  it('should block a provider with default TTL', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    const providerId = 'test-provider';

    act(() => {
      result.current.block(providerId, 'auto-mitigation');
    });

    expect(result.current.blacklist[providerId]).toBeDefined();
    expect(result.current.blacklist[providerId].reason).toBe('auto-mitigation');
    expect(result.current.isBlocked(providerId)).toBe(true);
  });

  it('should unblock a provider', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    const providerId = 'test-provider';

    act(() => {
      result.current.block(providerId, 'auto-mitigation');
      result.current.unblock(providerId);
    });

    expect(result.current.blacklist[providerId]).toBeUndefined();
    expect(result.current.isBlocked(providerId)).toBe(false);
  });

  it('should automatically unblock after TTL expires', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    const providerId = 'test-provider';
    const ttl = 5; // 5 secondi

    act(() => {
      result.current.block(providerId, 'auto-mitigation', ttl);
    });

    expect(result.current.isBlocked(providerId)).toBe(true);

    // Avanza di 6 secondi
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.isBlocked(providerId)).toBe(false);
  });

  it('should emit events on block/unblock', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    const providerId = 'test-provider';
    const eventBus = useEventBus();

    act(() => {
      result.current.block(providerId, 'auto-mitigation');
    });

    expect(eventBus.emit).toHaveBeenCalledWith('provider:blacklisted', expect.any(Object));

    act(() => {
      result.current.unblock(providerId);
    });

    expect(eventBus.emit).toHaveBeenCalledWith('provider:restored', { providerId });
  });

  it('should handle multiple providers', () => {
    const { result } = renderHook(() => useProviderBlacklist());
    const providers = ['provider-1', 'provider-2'];

    act(() => {
      providers.forEach(id => {
        result.current.block(id, 'auto-mitigation');
      });
    });

    providers.forEach(id => {
      expect(result.current.isBlocked(id)).toBe(true);
    });

    act(() => {
      result.current.unblock(providers[0]);
    });

    expect(result.current.isBlocked(providers[0])).toBe(false);
    expect(result.current.isBlocked(providers[1])).toBe(true);
  });
}); 