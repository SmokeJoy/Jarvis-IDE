/**
 * @file useAgentTypingState.test.ts
 * @description Test Jest per useAgentTypingState — verifica comportamento hook typing degli agenti su thread multipli
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAgentTypingState } from '../../webview-ui/src/hooks/useAgentTypingState';

// Piccolo event bus mock
function createEventBusMock() {
  const listeners = {};
  return {
    on(event, handler) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
      return () => {
        listeners[event] = listeners[event].filter(h => h !== handler);
      };
    },
    emit(event, payload) {
      (listeners[event] || []).forEach(handler => handler(payload));
    }
  };
}

describe('useAgentTypingState', () => {
  it('aggiorna stato typing AGENT_TYPING e AGENT_TYPING_DONE su thread/agent', () => {
    const bus = createEventBusMock();
    const { result } = renderHook(() => useAgentTypingState(bus));
    // Nessuno typing iniziale
    expect(result.current).toEqual({});

    act(() => {
      bus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
    });
    expect(result.current).toEqual({ t1: { a1: true } });

    act(() => {
      bus.emit('AGENT_TYPING_DONE', { agentId: 'a1', threadId: 't1' });
    });
    expect(result.current).toEqual({ t1: { a1: false } });
  });

  it('gestisce typing multipli su thread e agent diversi', () => {
    const bus = createEventBusMock();
    const { result } = renderHook(() => useAgentTypingState(bus));
    act(() => {
      bus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
      bus.emit('AGENT_TYPING', { agentId: 'a2', threadId: 't1' });
      bus.emit('AGENT_TYPING', { agentId: 'a3', threadId: 't2' });
    });
    expect(result.current).toEqual({ t1: { a1: true, a2: true }, t2: { a3: true } });
    act(() => {
      bus.emit('AGENT_TYPING_DONE', { agentId: 'a1', threadId: 't1' });
    });
    expect(result.current).toEqual({ t1: { a1: false, a2: true }, t2: { a3: true } });
  });

  it('teardown: rimuove correttamente i listener su unmount', () => {
    const bus = createEventBusMock();
    const unsubscribeSpy = jest.fn();
    // Monkeypatch .on per testare l'unsubscribe
    const origOn = bus.on;
    bus.on = function(event, handler) {
      const unsub = origOn.call(this, event, handler);
      return () => {
        unsubscribeSpy();
        unsub();
      };
    };
    const { unmount } = renderHook(() => useAgentTypingState(bus));
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2); // 2 eventi
  });
});